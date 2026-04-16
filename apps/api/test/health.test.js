import test from 'node:test'
import assert from 'node:assert/strict'
import { requestJson, startNodeProcess, stopProcess, waitForServerListening } from './test-helpers.js'

test('api health returns trace headers and body fields', async () => {
  const server = startNodeProcess('../src/main.js', new URL('.', import.meta.url), {
    PORT: '0',
  })

  try {
    const port = await waitForServerListening(server)

    const response = await requestJson({
      port,
      path: '/health',
      headers: {
        'x-request-id': 'test-health-request',
        'x-correlation-id': 'test-health-correlation',
      },
    })

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-request-id'), 'test-health-request')
    assert.equal(response.headers.get('x-correlation-id'), 'test-health-correlation')
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('pragma'), 'no-cache')
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(response.body.status, 'ok')
    assert.equal(response.body.requestId, 'test-health-request')
    assert.equal(response.body.correlationId, 'test-health-correlation')
  } finally {
    await stopProcess(server)
  }
})

test('api protected route rejects unauthenticated request', async () => {
  const server = startNodeProcess('../src/main.js', new URL('.', import.meta.url), {
    PORT: '0',
  })

  try {
    const port = await waitForServerListening(server)

    const response = await requestJson({
      port,
      path: '/protected/health',
    })

    assert.equal(response.status, 401)
    assert.equal(response.body.code, 'ACCESS_DENIED')
  } finally {
    await stopProcess(server)
  }
})
