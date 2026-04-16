import test from 'node:test'
import assert from 'node:assert/strict'
import { requestJson, startNodeProcess, stopProcess, waitForServerListening } from './test-helpers.js'

const reviewerHeaders = {
  'x-actor-id': 'reviewer-a',
  'x-actor-role': 'reviewer',
  'x-tenant-id': 'tenant_demo_a',
}

const operatorHeaders = {
  'x-actor-id': 'operator-a',
  'x-actor-role': 'case_operator',
  'x-tenant-id': 'tenant_demo_a',
}

test('retryable audit failure creates pending compensation that can be resolved', async () => {
  const failingServer = startNodeProcess('../src/main.js', new URL('.', import.meta.url), {
    PORT: '0',
    AUDIT_FORCE_FAIL: '1',
  })

  let compensationId = null

  try {
    const port = await waitForServerListening(failingServer)

    const blockedResponse = await requestJson({
      port,
      path: '/protected/health',
      method: 'GET',
      headers: operatorHeaders,
    })
    assert.equal(blockedResponse.status, 503)
    assert.equal(blockedResponse.body.code, 'AUDIT_REQUIRED_WRITE_FAILED')
    assert.equal(blockedResponse.body.retryable, true)
    assert.equal(blockedResponse.body.audit_blocked, true)
    assert.ok(blockedResponse.body.audit_compensation_id)
    compensationId = blockedResponse.body.audit_compensation_id

    const pendingResponse = await requestJson({
      port,
      path: '/audit/compensations',
      method: 'GET',
      headers: reviewerHeaders,
    })
    assert.equal(pendingResponse.status, 200)
    assert.equal(pendingResponse.body.items.length, 1)
    assert.equal(pendingResponse.body.items[0].compensationId, compensationId)
    assert.equal(pendingResponse.body.items[0].status, 'pending')
    assert.equal(pendingResponse.body.items[0].retryable, true)

    const resolvedResponse = await requestJson({
      port,
      path: '/audit/compensations/resolve',
      method: 'POST',
      headers: {
        ...reviewerHeaders,
        'x-compensation-id': compensationId,
        'x-resolution-note': 'verified retry and resolution flow',
      },
    })
    assert.equal(resolvedResponse.status, 200)
    assert.equal(resolvedResponse.body.compensation.compensationId, compensationId)
    assert.equal(resolvedResponse.body.compensation.status, 'resolved')
    assert.equal(resolvedResponse.body.compensation.resolutionNote, 'verified retry and resolution flow')

    const filteredPendingResponse = await requestJson({
      port,
      path: '/audit/compensations',
      method: 'GET',
      headers: {
        ...reviewerHeaders,
        'x-compensation-status': 'pending',
      },
    })
    assert.equal(filteredPendingResponse.status, 200)
    assert.equal(filteredPendingResponse.body.items.length, 0)
    const resolvedListResponse = await requestJson({
      port,
      path: '/audit/compensations',
      method: 'GET',
      headers: reviewerHeaders,
    })
    assert.equal(resolvedListResponse.status, 200)
    assert.equal(resolvedListResponse.body.items.length, 1)
    assert.equal(resolvedListResponse.body.items[0].compensationId, compensationId)
    assert.equal(resolvedListResponse.body.items[0].status, 'resolved')

    const filteredResolvedResponse = await requestJson({
      port,
      path: '/audit/compensations',
      method: 'GET',
      headers: {
        ...reviewerHeaders,
        'x-compensation-status': 'resolved',
      },
    })
    assert.equal(filteredResolvedResponse.status, 200)
    assert.equal(filteredResolvedResponse.body.items.length, 1)
    assert.equal(filteredResolvedResponse.body.items[0].compensationId, compensationId)
  } finally {
    await stopProcess(failingServer)
  }
})
