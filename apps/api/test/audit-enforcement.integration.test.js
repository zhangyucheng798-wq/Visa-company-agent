import test from 'node:test'
import assert from 'node:assert/strict'
import { requestJson, startNodeProcess, stopProcess, waitForServerListening } from './test-helpers.js'

const baseHeaders = {
  'x-actor-id': 'operator-a',
  'x-actor-role': 'case_operator',
  'x-tenant-id': 'tenant_demo_a',
}

test('client access token issuance persists audit record on success', async () => {
  const server = startNodeProcess('../src/main.js', new URL('.', import.meta.url), {
    PORT: '0',
  })

  try {
    const port = await waitForServerListening(server)
    const { caseId } = await createCaseFixture(port)

    const issueResponse = await requestJson({
      port,
      path: '/client-access-tokens',
      method: 'POST',
      headers: {
        ...baseHeaders,
        'x-case-id': caseId,
      },
    })
    assert.equal(issueResponse.status, 201)
    assert.equal(issueResponse.body.clientAccessToken.caseId, caseId)
    assert.equal(issueResponse.body.audit.actionCode, 'CLIENT_TOKEN_ISSUED')

    const auditLogResponse = await requestJson({
      port,
      path: '/audit/logs',
      method: 'GET',
      headers: {
        'x-actor-id': 'reviewer-a',
        'x-actor-role': 'reviewer',
        'x-tenant-id': 'tenant_demo_a',
      },
    })
    assert.equal(auditLogResponse.status, 200)

    const matchingRecord = auditLogResponse.body.items.find((item) => item.actionCode === 'CLIENT_TOKEN_ISSUED' && item.caseId === caseId)
    assert.ok(matchingRecord)
    assert.equal(matchingRecord.targetType, 'client_access_token')
    assert.equal(matchingRecord.tenantId, 'tenant_demo_a')
  } finally {
    await stopProcess(server)
  }
})

test('client access token issuance is blocked when required audit write fails', async () => {
  const server = startNodeProcess('../src/main.js', new URL('.', import.meta.url), {
    PORT: '0',
    AUDIT_FORCE_FAIL: '1',
    AUDIT_FORCE_FAIL_IGNORE_ACTIONS: 'CLIENT_CREATED,BENEFICIARY_CREATED,CASE_CREATED',
  })

  try {
    const port = await waitForServerListening(server)
    const { caseId } = await createCaseFixture(port)

    const blockedResponse = await requestJson({
      port,
      path: '/client-access-tokens',
      method: 'POST',
      headers: {
        ...baseHeaders,
        'x-case-id': caseId,
      },
    })
    assert.equal(blockedResponse.status, 500)
    assert.equal(blockedResponse.body.code, 'AUDIT_REQUIRED_WRITE_FAILED')
    assert.equal(blockedResponse.body.audit_blocked, true)
    assert.equal(blockedResponse.body.retryable, false)
    assert.equal(blockedResponse.body.audit_compensation_id, null)

    const tokenListResponse = await requestJson({
      port,
      path: '/client-access-tokens',
      method: 'GET',
      headers: baseHeaders,
    })
    assert.equal(tokenListResponse.status, 200)
    assert.equal(tokenListResponse.body.items.length, 0)

    const compensationResponse = await requestJson({
      port,
      path: '/audit/compensations',
      method: 'GET',
      headers: {
        'x-actor-id': 'reviewer-a',
        'x-actor-role': 'reviewer',
        'x-tenant-id': 'tenant_demo_a',
      },
    })
    assert.equal(compensationResponse.status, 200)
    assert.equal(compensationResponse.body.items.length, 0)
  } finally {
    await stopProcess(server)
  }
})

test('protected route is blocked and compensation is created when retryable audit write fails', async () => {
  const server = startNodeProcess('../src/main.js', new URL('.', import.meta.url), {
    PORT: '0',
    AUDIT_FORCE_FAIL: '1',
  })

  try {
    const port = await waitForServerListening(server)

    const blockedResponse = await requestJson({
      port,
      path: '/protected/health',
      method: 'GET',
      headers: {
        ...baseHeaders,
      },
    })
    assert.equal(blockedResponse.status, 503)
    assert.equal(blockedResponse.body.code, 'AUDIT_REQUIRED_WRITE_FAILED')
    assert.equal(blockedResponse.body.audit_blocked, true)
    assert.equal(blockedResponse.body.retryable, true)
    assert.ok(blockedResponse.body.audit_compensation_id)

    const compensationResponse = await requestJson({
      port,
      path: '/audit/compensations',
      method: 'GET',
      headers: {
        'x-actor-id': 'reviewer-a',
        'x-actor-role': 'reviewer',
        'x-tenant-id': 'tenant_demo_a',
      },
    })
    assert.equal(compensationResponse.status, 200)
    assert.equal(compensationResponse.body.items.length, 1)
    assert.equal(compensationResponse.body.items[0].errorCode, 'AUDIT_REQUIRED_WRITE_FAILED')
    assert.equal(compensationResponse.body.items[0].status, 'pending')
  } finally {
    await stopProcess(server)
  }
})

async function createCaseFixture(port) {
  const bootstrapHeaders = baseHeaders

  const clientResponse = await requestJson({
    port,
    path: '/clients',
    method: 'POST',
    headers: {
      ...bootstrapHeaders,
      'x-client-name': 'Audit Client',
      'x-client-email': 'audit@example.com',
    },
  })
  assert.equal(clientResponse.status, 201)
  const clientId = clientResponse.body.client.clientId

  const beneficiaryResponse = await requestJson({
    port,
    path: '/beneficiaries',
    method: 'POST',
    headers: {
      ...bootstrapHeaders,
      'x-beneficiary-name': 'Audit Beneficiary',
      'x-passport-number': 'PA999999',
      'x-nationality': 'CN',
    },
  })
  assert.equal(beneficiaryResponse.status, 201)
  const beneficiaryId = beneficiaryResponse.body.beneficiary.beneficiaryId

  const caseResponse = await requestJson({
    port,
    path: '/cases',
    method: 'POST',
    headers: {
      ...bootstrapHeaders,
      'x-client-id': clientId,
      'x-beneficiary-id': beneficiaryId,
      'x-visa-type': 'tourist',
      'x-country-code': 'US',
    },
  })
  assert.equal(caseResponse.status, 201)

  return {
    clientId,
    beneficiaryId,
    caseId: caseResponse.body.case.caseId,
  }
}
