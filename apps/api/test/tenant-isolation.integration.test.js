import test from 'node:test'
import assert from 'node:assert/strict'
import { requestJson, startNodeProcess, stopProcess, waitForServerListening } from './test-helpers.js'

const tenantAHeaders = {
  'x-actor-id': 'operator-a',
  'x-actor-role': 'case_operator',
  'x-tenant-id': 'tenant_demo_a',
}

const tenantBHeaders = {
  'x-actor-id': 'operator-b',
  'x-actor-role': 'case_operator',
  'x-tenant-id': 'tenant_demo_b',
}

test('tenant B cannot read, mutate, or upload against tenant A resources', async () => {
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
        ...tenantAHeaders,
        'x-client-name': 'Tenant A Client',
        'x-client-email': 'tenant-a@example.com',
      },
    })
    assert.equal(clientResponse.status, 201)
    const clientId = clientResponse.body.client.clientId

    const beneficiaryResponse = await requestJson({
      port,
      path: '/beneficiaries',
      method: 'POST',
      headers: {
        ...tenantAHeaders,
        'x-beneficiary-name': 'Tenant A Beneficiary',
        'x-passport-number': 'PA123456',
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
        ...tenantAHeaders,
        'x-client-id': clientId,
        'x-beneficiary-id': beneficiaryId,
        'x-visa-type': 'tourist',
        'x-country-code': 'US',
      },
    })
    assert.equal(caseResponse.status, 201)
    const caseId = caseResponse.body.case.caseId

    const intakeResponse = await requestJson({
      port,
      path: '/cases/start-intake',
      method: 'POST',
      headers: {
        ...tenantAHeaders,
        'x-case-id': caseId,
      },
    })
    assert.equal(intakeResponse.status, 200)
    const materialSlotId = intakeResponse.body.materialSlots[0].materialSlotId

    const tenantBCasesResponse = await requestJson({
      port,
      path: '/cases',
      method: 'GET',
      headers: tenantBHeaders,
    })
    assert.equal(tenantBCasesResponse.status, 200)
    assert.equal(tenantBCasesResponse.body.items.length, 0)

    const tenantBStartIntakeResponse = await requestJson({
      port,
      path: '/cases/start-intake',
      method: 'POST',
      headers: {
        ...tenantBHeaders,
        'x-case-id': caseId,
      },
    })
    assert.equal(tenantBStartIntakeResponse.status, 404)
    assert.equal(tenantBStartIntakeResponse.body.code, 'CASE_NOT_FOUND')

    const tenantBUploadResponse = await requestJson({
      port,
      path: '/files/raw',
      method: 'POST',
      headers: {
        ...tenantBHeaders,
        'x-case-id': caseId,
        'x-material-slot-id': materialSlotId,
        'x-file-name': 'cross-tenant.pdf',
      },
    })
    assert.equal(tenantBUploadResponse.status, 404)
    assert.equal(tenantBUploadResponse.body.code, 'CASE_NOT_FOUND')

    const tenantBRawFilesResponse = await requestJson({
      port,
      path: '/files/raw',
      method: 'GET',
      headers: tenantBHeaders,
    })
    assert.equal(tenantBRawFilesResponse.status, 200)
    assert.equal(tenantBRawFilesResponse.body.items.length, 0)

    const tenantAUploadResponse = await requestJson({
      port,
      path: '/files/raw',
      method: 'POST',
      headers: {
        ...tenantAHeaders,
        'x-case-id': caseId,
        'x-material-slot-id': materialSlotId,
        'x-file-name': 'tenant-a.pdf',
      },
    })
    assert.equal(tenantAUploadResponse.status, 201)

    const tenantARawFilesResponse = await requestJson({
      port,
      path: '/files/raw',
      method: 'GET',
      headers: tenantAHeaders,
    })
    assert.equal(tenantARawFilesResponse.status, 200)
    assert.equal(tenantARawFilesResponse.body.items.length, 1)
    assert.equal(tenantARawFilesResponse.body.items[0].caseId, caseId)

    const tenantBRawFilesAfterUploadResponse = await requestJson({
      port,
      path: '/files/raw',
      method: 'GET',
      headers: tenantBHeaders,
    })
    assert.equal(tenantBRawFilesAfterUploadResponse.status, 200)
    assert.equal(tenantBRawFilesAfterUploadResponse.body.items.length, 0)
  } finally {
    await stopProcess(server)
  }
})
