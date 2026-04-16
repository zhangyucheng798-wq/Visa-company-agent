import test from 'node:test'
import assert from 'node:assert/strict'
import { requestJson, startNodeProcess, stopProcess, waitForServerListening } from './test-helpers.js'

const tenantHeaders = {
  'x-actor-id': 'operator-1',
  'x-actor-role': 'case_operator',
  'x-tenant-id': 'tenant_demo_a',
}

test('supplement workflow round-trip returns case to internal processing', async () => {
  const server = startNodeProcess('../src/main.js', new URL('.', import.meta.url), {
    PORT: '0',
  })

  try {
    const port = await waitForServerListening(server)

    const clientResponse = await requestJson({
      port,
      path: '/clients',
      method: 'POST',
      headers: {
        ...tenantHeaders,
        'x-client-name': 'Alex Chen',
        'x-client-email': 'alex@example.com',
      },
    })
    assert.equal(clientResponse.status, 201)
    const clientId = clientResponse.body.client.clientId

    const beneficiaryResponse = await requestJson({
      port,
      path: '/beneficiaries',
      method: 'POST',
      headers: {
        ...tenantHeaders,
        'x-beneficiary-name': 'Alex Chen',
        'x-passport-number': 'P12345678',
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
        ...tenantHeaders,
        'x-client-id': clientId,
        'x-beneficiary-id': beneficiaryId,
        'x-visa-type': 'tourist',
        'x-country-code': 'US',
      },
    })
    assert.equal(caseResponse.status, 201)
    assert.equal(caseResponse.body.case.caseStatus, 'draft')
    assert.equal(caseResponse.body.case.clientVisibleStatus, 'intake_started')
    const caseId = caseResponse.body.case.caseId

    const intakeResponse = await requestJson({
      port,
      path: '/cases/start-intake',
      method: 'POST',
      headers: {
        ...tenantHeaders,
        'x-case-id': caseId,
      },
    })
    assert.equal(intakeResponse.status, 200)
    assert.equal(intakeResponse.body.case.caseStatus, 'intake_in_progress')
    assert.equal(intakeResponse.body.case.clientVisibleStatus, 'intake_started')
    assert.equal(intakeResponse.body.materialSlots.length, 3)

    const supplementResponse = await requestJson({
      port,
      path: '/cases/send-supplement-request',
      method: 'POST',
      headers: {
        ...tenantHeaders,
        'x-case-id': caseId,
      },
    })
    assert.equal(supplementResponse.status, 200)
    assert.equal(supplementResponse.body.case.caseStatus, 'awaiting_client')
    assert.equal(supplementResponse.body.case.clientVisibleStatus, 'action_required')
    assert.equal(supplementResponse.body.actionItem.blockerType, 'missing_material')
    assert.equal(supplementResponse.body.notification.notificationType, 'supplement_request_internal')

    const tokenResponse = await requestJson({
      port,
      path: '/client-access-tokens',
      method: 'POST',
      headers: {
        ...tenantHeaders,
        'x-case-id': caseId,
      },
    })
    assert.equal(tokenResponse.status, 201)
    const token = tokenResponse.body.clientAccessToken.token
    assert.ok(token)

    const openResponse = await requestJson({
      port,
      path: '/client-access/open',
      method: 'POST',
      headers: {
        'x-client-access-token': token,
      },
    })
    assert.equal(openResponse.status, 200)
    assert.equal(openResponse.body.clientAccessToken.status, 'issued')
    assert.ok(openResponse.body.clientAccessToken.openedAt)

    const summaryResponse = await requestJson({
      port,
      path: '/client-portal/summary',
      method: 'GET',
      headers: {
        'x-client-access-token': token,
      },
    })
    assert.equal(summaryResponse.status, 200)
    assert.equal(summaryResponse.body.case.caseId, caseId)
    assert.equal(summaryResponse.body.client.clientId, clientId)
    assert.equal(summaryResponse.body.beneficiary.beneficiaryId, beneficiaryId)
    assert.equal(summaryResponse.body.materialSlots.length, 3)

    const submitResponse = await requestJson({
      port,
      path: '/client-portal/submit',
      method: 'POST',
      headers: {
        'x-client-access-token': token,
      },
    })
    assert.equal(submitResponse.status, 200)
    assert.equal(submitResponse.body.case.caseStatus, 'internal_processing')
    assert.equal(submitResponse.body.case.clientVisibleStatus, 'processing')

    const secondSubmitResponse = await requestJson({
      port,
      path: '/client-portal/submit',
      method: 'POST',
      headers: {
        'x-client-access-token': token,
      },
    })
    assert.equal(secondSubmitResponse.status, 409)
    assert.equal(secondSubmitResponse.body.code, 'CASE_INVALID_TRANSITION')
  } finally {
    await stopProcess(server)
  }
})

