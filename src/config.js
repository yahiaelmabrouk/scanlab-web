const isStaging = location.host.endsWith('scanlab-web.pages.dev')
let env = import.meta.env.PROD ? (isStaging ? 'staging' : 'production') : 'development'
const isProduction = env === 'production'

let isVetMR = location.host === 'app.scanlabvetmr.com'
let isCTLab = location.host === 'app.scanlabct.com'

// add scanlabMode=ct to url query params to make Scanlab behave as ScanlabCT temporarily/etc
if (!isProduction) {
  let urlParams = new URLSearchParams(window.location.search)
  let scanlabMode = (urlParams.get('scanlabMode') || '').toLowerCase()

  // Persist scanlabMode on hard refresh by storing the last value that came from the url params in localStorage, and using that when it's not being supplied there currently
  if (scanlabMode) {
    localStorage.setItem('scanlabMode', scanlabMode)
  } else {
    scanlabMode = localStorage.getItem('scanlabMode')
  }

  if (scanlabMode === 'ct') {
    isCTLab = true
    isVetMR = false
  } else if (scanlabMode === 'vet') {
    isCTLab = false
    isVetMR = true
  } else if (scanlabMode === 'mr') {
    isCTLab = false
    isVetMR = false
  }
}

const config = {
  cruncherRoot: import.meta.env.PROD ? 'https://cruncher.api.scanlabmr.com/' : 'http://127.0.0.1:5000/',
  isVetMR,
  isStaging,
  isCTLab,
  isMaintenance: false,
  apiRoot: import.meta.env.PROD
    ? isVetMR
      ? 'https://scanlab-vet-api.herokuapp.com/v1/'
      : isCTLab
      ? 'https://scanlab-ct-api-48468ae0fa1a.herokuapp.com/v1/'
      : 'http://24.199.106.243:6200/v1/'
    : '/api/v1/',
  analysisApiRoot: 'https://r-analysis-api.scanlabmr.com/v1/',
  analysisPublicRoot: 'https://r-analysis-api.scanlabmr.com/public',
  env,
  isProduction,
}

export default config
