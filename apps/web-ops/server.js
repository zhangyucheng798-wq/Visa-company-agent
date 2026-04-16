const http = require('node:http')
const { URL } = require('node:url')

const port = Number(process.env.PORT || 3002)

const dashboardSections = [
  {
    title: 'Operations queues',
    items: [
      'Review and approval queues are available through the API baseline.',
      'Task and notification surfaces are part of the ops follow-up workflow.',
    ],
  },
  {
    title: 'Alert baseline',
    items: [
      'Worker alert baseline tracks exhausted notifications.',
      'Worker alert baseline tracks pending audit compensations.',
    ],
  },
  {
    title: 'Recovery readiness',
    items: [
      'Recovery runbook: docs/runbooks/recovery-runbook.md',
      'Rollback runbook: docs/runbooks/migration-rollback-runbook.md',
      'Staging verification pack: docs/staging-verification-pack.md',
      'Demo readiness gate: docs/demo-readiness-gate.md',
    ],
  },
]

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, 'http://127.0.0.1')
  const path = normalizePathname(requestUrl.pathname)
  const isDashboardRoute = path === '/' || path === '/ops'

  if (!isDashboardRoute) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    console.log(JSON.stringify({ app: 'web-ops', event: 'request_completed', method: req.method, path, status: 404 }))
    res.end('Not Found')
    return
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' })
    console.log(JSON.stringify({ app: 'web-ops', event: 'request_completed', method: req.method, path, status: 405 }))
    res.end('Method Not Allowed')
    return
  }

  const html = renderDashboard(path)
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  console.log(JSON.stringify({ app: 'web-ops', event: 'request_completed', method: req.method, path, status: 200 }))
  res.end(html)
})

server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ app: 'web-ops', event: 'server_listening', port, host: '127.0.0.1' }))
})

function renderDashboard(path) {
  const sectionsHtml = dashboardSections.map((section) => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      <ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>
  `).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-ops dashboard</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 920px; margin: 0 auto; }
      section { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px 20px; margin: 16px 0; }
      h1, h2 { margin-bottom: 12px; }
      p, li { line-height: 1.5; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Ops dashboard</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <p>Minimal operations cockpit for queue visibility, alert awareness, and readiness references.</p>
      ${sectionsHtml}
    </main>
  </body>
</html>`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizePathname(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}
