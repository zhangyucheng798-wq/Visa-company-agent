const test = require('node:test')
const assert = require('node:assert/strict')
const {
  fetchHtml,
  getAvailablePort,
  startNodeProcess,
  stopProcess,
  waitForLog,
} = require('../../../tests/smoke-test-helpers.cjs')

test('web-client smoke journey follows linked case surfaces for one case', async () => {
  const port = await getAvailablePort()
  const server = startNodeProcess('../server.js', __dirname, {
    PORT: String(port),
  })

  try {
    await waitForLog(server, '"event":"server_listening"')

    const caseList = await fetchHtml(port, '/cases')
    assert.equal(caseList.status, 200)
    assert.match(caseList.body, /Case list/)
    assert.match(caseList.body, /case_demo_001/)
    assert.match(caseList.body, /\/cases\/case_demo_001/)

    const caseDetail = await fetchHtml(port, '/cases/case_demo_001')
    assert.equal(caseDetail.status, 200)
    assert.match(caseDetail.body, /Case detail/)
    assert.match(caseDetail.body, /Alex Chen/)
    assert.match(caseDetail.body, /Material collection/)
    assert.match(caseDetail.body, /\/cases\/case_demo_001\/review-workspace/)
    assert.match(caseDetail.body, /\/cases\/case_demo_001\/approval-workspace/)
    assert.match(caseDetail.body, /\/cases\/case_demo_001\/client-portal/)
    assert.match(caseDetail.body, /\/cases\/case_demo_001\/upload-flow/)
    assert.match(caseDetail.body, /\/cases\/case_demo_001\/supplement-request/)
    assert.match(caseDetail.body, /\/cases\/case_demo_001\/timeline-audit/)

    const reviewWorkspace = await fetchHtml(port, '/cases/case_demo_001/review-workspace')
    assert.equal(reviewWorkspace.status, 200)
    assert.match(reviewWorkspace.body, /Review workspace/)
    assert.match(reviewWorkspace.body, /case_demo_001/)
    assert.match(reviewWorkspace.body, /Wait for intake completion before review assignment/)

    const approvalWorkspace = await fetchHtml(port, '/cases/case_demo_001/approval-workspace')
    assert.equal(approvalWorkspace.status, 200)
    assert.match(approvalWorkspace.body, /Approval workspace/)
    assert.match(approvalWorkspace.body, /case_demo_001/)
    assert.match(approvalWorkspace.body, /Pending review hand-off/)

    const clientPortal = await fetchHtml(port, '/cases/case_demo_001/client-portal')
    assert.equal(clientPortal.status, 200)
    assert.match(clientPortal.body, /Client portal/)
    assert.match(clientPortal.body, /Waiting for documents/)
    assert.match(clientPortal.body, /\/cases\/case_demo_001\/upload-flow/)
    assert.match(clientPortal.body, /\/cases\/case_demo_001\/supplement-request/)

    const uploadFlow = await fetchHtml(port, '/cases/case_demo_001/upload-flow')
    assert.equal(uploadFlow.status, 200)
    assert.match(uploadFlow.body, /Upload flow/)
    assert.match(uploadFlow.body, /Bank statement/)
    assert.match(uploadFlow.body, /\/cases\/case_demo_001\/supplement-request/)

    const supplementRequest = await fetchHtml(port, '/cases/case_demo_001/supplement-request')
    assert.equal(supplementRequest.status, 200)
    assert.match(supplementRequest.body, /Supplement request/)
    assert.match(supplementRequest.body, /2026-04-24/)
    assert.match(supplementRequest.body, /Bank statement/)

    const timelineAudit = await fetchHtml(port, '/cases/case_demo_001/timeline-audit')
    assert.equal(timelineAudit.status, 200)
    assert.match(timelineAudit.body, /Timeline audit/)
    assert.match(timelineAudit.body, /case_demo_001/)
    assert.match(timelineAudit.body, /Supplement requested/)
  } finally {
    await stopProcess(server)
  }
})
