import * as dicomParser from 'dicom-parser'
import _ from 'lodash'
import log from 'loglevel'

const HEADER_BYTE_COUNT = 65536

/**
 * Fetch only the first bytes of a file via HTTP Range request.
 * Returns an ArrayBuffer of the partial (or full) file content.
 */
export async function fetchDicomHeader(url, byteCount = HEADER_BYTE_COUNT) {
  const response = await fetch(url, {
    headers: { Range: `bytes=0-${byteCount - 1}` },
    cache: 'no-store',
  })

  // 206 = partial content (expected), 200 = server ignored Range (still usable)
  if (!response.ok && response.status !== 206) {
    throw new Error(`Header fetch failed: ${response.status}`)
  }

  return response.arrayBuffer()
}

/**
 * Parse DICOM header tags from a partial ArrayBuffer.
 * Uses dicom-parser with untilTag to stop before pixel data.
 * Returns extracted tags or null if parsing fails.
 */
export function parseDicomHeaderTags(arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer)

  function extractTags(dataSet) {
    if (!dataSet) return null
    const seriesInstanceUID = dataSet.string('x0020000e') || null
    if (!seriesInstanceUID) return null
    return {
      seriesInstanceUID,
      seriesDescription: dataSet.string('x0008103e') || null,
      numberOfFrames: dataSet.intString('x00280008') || null,
      imageOrientationPatient: dataSet.string('x00200037') || null,
    }
  }

  // Try with untilTag first (stops before pixel data), then without (best-effort partial parse)
  for (const options of [{ untilTag: 'x7fe00010' }, undefined]) {
    try {
      const dataSet = dicomParser.parseDicom(byteArray, options)
      const tags = extractTags(dataSet)
      if (tags) return tags
    } catch (err) {
      // dicom-parser throws an object with {exception, dataSet} on buffer overrun —
      // the partial dataSet often contains the tags we need
      const errObj = typeof err === 'string' ? { exception: err } : err
      if (errObj.dataSet) {
        const tags = extractTags(errObj.dataSet)
        if (tags) return tags
      }
    }
  }

  log.warn('Failed to parse DICOM header after all attempts')
  return null
}

/**
 * Bucket key for ImageOrientationPatient (tag 0020,0037).
 * DICOM stores it as 6 decimals separated by backslashes: "rx\ry\rz\cx\cy\cz".
 * We round to 1 decimal so minor float drift within a stack doesn't split the bucket,
 * but distinct orientations (axial vs sagittal vs coronal) still land in different buckets.
 */
function orientationBucketKey(iop) {
  if (!iop) return 'unknown'
  const parts = _.split(iop, '\\').map((v) => {
    const num = parseFloat(v)
    return Number.isFinite(num) ? Math.round(num * 10) / 10 : 'x'
  })
  return parts.join(',')
}

/**
 * Check if a series description indicates a localizer.
 * Mirrors the logic in dicomService.js seriesIsLocalizer().
 */
function descriptionIsLocalizer(seriesDescription) {
  if (!seriesDescription) return false
  const desc = _.toLower(seriesDescription)

  if (_.startsWith(desc, 'localizer') || _.startsWith(desc, 'loc ')) {
    return true
  }

  const tokens = _.split(desc, ' ')
  if (_.includes(tokens, 'loc') || _.includes(tokens, 'localizer')) {
    return true
  }

  return false
}

/**
 * Classify an array of file URLs as localizer, volume, or unclassified
 * by fetching and parsing DICOM headers.
 *
 * @param {string[]} fileUrls - Signed URLs to classify
 * @param {Function} [progressCallback] - Called with (completed, total) after each file
 * @returns {Promise<{localizerUrls: string[], volumeUrls: string[], unclassifiedUrls: string[]}>}
 */
export async function classifyFilesByHeader(fileUrls, progressCallback) {
  let completed = 0

  // Fire all requests in parallel — browser handles HTTP/2 multiplexing
  const results = await Promise.all(
    fileUrls.map(async (url) => {
      let tags = null
      try {
        const buffer = await fetchDicomHeader(url)
        tags = parseDicomHeaderTags(buffer)
      } catch (err) {
        log.warn('Header classification failed for file:', err.message)
      }
      completed++
      if (progressCallback) {
        progressCallback(completed, fileUrls.length)
      }
      return { url, tags }
    })
  )

  // Group by series instance UID
  const seriesMap = {} // seriesUID -> { urls: [], tags: [] }
  const unclassifiedUrls = []

  for (const result of results) {
    if (!result.tags || !result.tags.seriesInstanceUID) {
      unclassifiedUrls.push(result.url)
      continue
    }
    const uid = result.tags.seriesInstanceUID
    if (!seriesMap[uid]) {
      seriesMap[uid] = { urls: [], tags: [] }
    }
    seriesMap[uid].urls.push(result.url)
    seriesMap[uid].tags.push(result.tags)
  }

  // First pass: bucket each series by ImageOrientationPatient. A DICOM "series" can
  // hold multiple orientation stacks (e.g., a 3-plane localizer lives inside a single
  // seriesInstanceUID). This mirrors the per-stack view used by master's post-parse
  // minFrameLength classifier.
  const seriesInfos = {}
  for (const uid in seriesMap) {
    const series = seriesMap[uid]
    const orientationBuckets = {}
    for (let i = 0; i < series.urls.length; i++) {
      const key = orientationBucketKey(series.tags[i].imageOrientationPatient)
      if (!orientationBuckets[key]) orientationBuckets[key] = []
      orientationBuckets[key].push(series.urls[i])
    }
    const bucketKeys = Object.keys(orientationBuckets)
    seriesInfos[uid] = {
      series,
      orientationBuckets,
      bucketKeys,
      distinctOrientations: bucketKeys.filter((k) => k !== 'unknown').length,
      maxBucketSize: _.max(bucketKeys.map((k) => orientationBuckets[k].length)) || 0,
      minBucketSize: _.min(bucketKeys.map((k) => orientationBuckets[k].length)) || 0,
    }
  }

  // Second pass: compute the minimum orientation-bucket size across *all* series.
  // Stacks at or near this size are localizers (same intent as master's minFrameLength).
  // 50% slack tolerates small per-plane slice-count variance (e.g. 5 vs 6 slices).
  const allBucketSizes = _.flatMap(Object.values(seriesInfos), (info) =>
    info.bucketKeys.map((k) => info.orientationBuckets[k].length)
  )
  const globalMinBucketSize = _.min(allBucketSizes) || 0
  const localizerSizeThreshold = Math.max(globalMinBucketSize * 1.5, globalMinBucketSize + 1)

  // Classify each series
  const localizerUrls = []
  const volumeUrls = []
  const seriesDecisions = []

  for (const uid in seriesInfos) {
    const info = seriesInfos[uid]
    const { series, distinctOrientations, maxBucketSize, minBucketSize } = info
    const firstTag = series.tags[0]
    let isLocalizer = false
    let reason = null

    // Multi-orientation series is almost always a multiplanar localizer — volumes
    // keep a single orientation across all slices.
    if (distinctOrientations >= 2) {
      isLocalizer = true
      reason = `multi-orientation (${distinctOrientations} planes)`
    }

    // Series description hint
    if (!isLocalizer && descriptionIsLocalizer(firstTag.seriesDescription)) {
      isLocalizer = true
      reason = 'description'
    }

    // Cross-series min-bucket-size rule (mirrors master's minFrameLength): a
    // single-orientation series whose largest bucket stays at/near the global minimum
    // is another plane of the same localizer set — not a volume.
    if (!isLocalizer && maxBucketSize <= localizerSizeThreshold) {
      isLocalizer = true
      reason = `min-bucket-size (max=${maxBucketSize}, threshold=${localizerSizeThreshold.toFixed(1)})`
    }

    // Legacy fallback: very small single-frame series
    if (!isLocalizer && series.urls.length <= 3) {
      const allSingleFrame = series.tags.every((t) => !t.numberOfFrames || t.numberOfFrames <= 1)
      if (allSingleFrame) {
        isLocalizer = true
        reason = 'few-files-single-frame'
      }
    }

    seriesDecisions.push({
      uid,
      seriesDescription: firstTag.seriesDescription,
      fileCount: series.urls.length,
      numberOfFrames: firstTag.numberOfFrames,
      orientationBucketSizes: info.bucketKeys.map((k) => `${k}:${info.orientationBuckets[k].length}`),
      distinctOrientations,
      minBucketSize,
      maxBucketSize,
      isLocalizer,
      reason: isLocalizer ? reason : 'failed-all-checks',
    })

    if (isLocalizer) {
      localizerUrls.push(...series.urls)
    } else {
      volumeUrls.push(...series.urls)
    }
  }

  log.info('[LOC-DEBUG] Per-series classification decisions:', seriesDecisions)

  log.info(
    `DICOM header classification: ${localizerUrls.length} localizer, ${volumeUrls.length} volume, ${unclassifiedUrls.length} unclassified`
  )

  return { localizerUrls, volumeUrls, unclassifiedUrls }
}
