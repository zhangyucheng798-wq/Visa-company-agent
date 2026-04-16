const test = require('node:test')
const assert = require('node:assert/strict')
const {
  fetchHtml,
  getAvailablePort,
  startNodeProcess,
  stopProcess,
  waitForLog,
} = require('../../../tests/smoke-test-helpers.cjs')

test('web-ops smoke journey covers dashboard sections', async () => {
  const port = await getAvailablePort()
  const server = startNodeProcess('../server.js', __dirname, {
    PORT: String(port),
  })

  try {
    await waitForLog(server, '"event":"server_listening"')

    const dashboard = await fetchHtml(port, '/ops')
    assert.equal(dashboard.status, 200)
    assert.match(dashboard.body, /Ops dashboard/)
    assert.match(dashboard.body, /Operations queues/)
    assert.match(dashboard.body, /Alert baseline/)
    assert.match(dashboard.body, /Recovery readiness/)
    assert.match(dashboard.body, /Review and approval queues are available through the API baseline\./)
    assert.match(dashboard.body, /Worker alert baseline tracks pending audit compensations\./)
  } finally {
    await stopProcess(server)
  }
})
