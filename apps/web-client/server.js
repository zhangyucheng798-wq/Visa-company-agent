const http = require('node:http')

const port = Number(process.env.PORT || 3003)

const server = http.createServer((req, res) => {
  const html = `<!doctype html><html><body><h1>web-client</h1><p>Phase 1 scaffold ready.</p><p>${req.url}</p></body></html>`
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(html)
})

server.listen(port, () => {
  console.log(`web-client listening on :${port}`)
})
