/**
 * MRI ambient audio manager.
 *
 * Two sounds:
 *  - loop:    background MRI hum while the user sets up a scan (gapless via Web Audio API)
 *  - loading: played while cruncher generates the volume
 */

let audioSuppressed = false

export function setAudioSuppressed(suppressed) {
  audioSuppressed = !!suppressed
  if (audioSuppressed) stopAll()
}

// -- Web Audio API gapless loop for mri-loop-00 --
let audioCtx = null
let loopBuffer = null
let loopSource = null
let loopGain = null
let userHasInteracted = false
let loopStartPending = false

function onFirstUserGesture() {
  userHasInteracted = true
  document.removeEventListener('pointerdown', onFirstUserGesture)
  document.removeEventListener('keydown', onFirstUserGesture)
  document.removeEventListener('touchstart', onFirstUserGesture)
  if (loopStartPending) {
    loopStartPending = false
    startMriLoop()
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', onFirstUserGesture)
  document.addEventListener('keydown', onFirstUserGesture)
  document.addEventListener('touchstart', onFirstUserGesture)
}

async function ensureLoopBuffer() {
  if (loopBuffer) return loopBuffer
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  const response = await fetch('/sounds/mri-loop-00.ogg')
  const arrayBuffer = await response.arrayBuffer()
  loopBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  return loopBuffer
}

export async function startMriLoop() {
  if (audioSuppressed) return
  if (!userHasInteracted) {
    loopStartPending = true
    return
  }
  try {
    const buffer = await ensureLoopBuffer()
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }
    stopMriLoop()
    loopGain = audioCtx.createGain()
    loopGain.gain.value = 0.8
    loopGain.connect(audioCtx.destination)
    loopSource = audioCtx.createBufferSource()
    loopSource.buffer = buffer
    loopSource.loop = true
    loopSource.connect(loopGain)
    loopSource.start(0)
  } catch {
    // autoplay blocked or fetch failed — silently ignore
  }
}

export function stopMriLoop() {
  loopStartPending = false
  if (loopSource) {
    try {
      loopSource.stop()
    } catch {
      // already stopped
    }
    loopSource.disconnect()
    loopSource = null
  }
  if (loopGain) {
    loopGain.disconnect()
    loopGain = null
  }
}

// -- Standard Audio element for mri-loading-00 --
let loadingAudio = null

function getLoadingAudio() {
  if (!loadingAudio) {
    loadingAudio = new Audio('/sounds/mri-loading-00.mp3')
    loadingAudio.loop = true
    loadingAudio.volume = 0.3
  }
  return loadingAudio
}

export function startMriLoading() {
  if (audioSuppressed) return
  const audio = getLoadingAudio()
  audio.currentTime = 0
  audio.play().catch(() => {})
}

export function stopMriLoading() {
  if (loadingAudio) {
    loadingAudio.pause()
    loadingAudio.currentTime = 0
  }
}

export function stopAll() {
  stopMriLoop()
  stopMriLoading()
}
