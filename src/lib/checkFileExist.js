const checkImageExist = (src, cb) => {
  const http = new XMLHttpRequest()

  http.open('HEAD', src, false)
  http.send()

  if (cb) cb(http)
}

export default checkImageExist
