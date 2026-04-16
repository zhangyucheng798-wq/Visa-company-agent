import { spawn } from 'node:child_process'
import http from 'node:http'
import { once } from 'node:events'

await verifyApiBaseline()
await verifyWorkerBaseline()
await verifyWebClientBaseline()
await verifyWebOpsBaseline()

console.log('Local baseline verification passed.')

async function verifyApiBaseline() {
  const apiPort = await getAvailablePort()
  const api = startNodeProcess('apps/api/src/main.js', {
    PORT: String(apiPort),
  })

  try {
    await waitForLog(api, '"event":"server_listening"')

    const health = await request({
      port: apiPort,
      path: '/health',
      headers: {
        'x-request-id': 'verify-health-request',
        'x-correlation-id': 'verify-health-correlation',
      },
    })

    assertStatus(health, 200, 'API /health should return 200')
    assertHeader(health, 'x-request-id', 'verify-health-request', 'API /health should echo x-request-id')
    assertHeader(health, 'x-correlation-id', 'verify-health-correlation', 'API /health should echo x-correlation-id')
    assertHeader(health, 'cache-control', 'no-store', 'API /health should disable caching')
    assertHeader(health, 'pragma', 'no-cache', 'API /health should disable cache pragma')
    assertHeader(health, 'x-content-type-options', 'nosniff', 'API /health should set nosniff')
    assertJsonField(health, 'status', 'ok', 'API /health should report ok status')
    assertJsonField(health, 'requestId', 'verify-health-request', 'API /health body should include requestId')
    assertJsonField(health, 'correlationId', 'verify-health-correlation', 'API /health body should include correlationId')

    const unauthenticated = await request({
      port: apiPort,
      path: '/protected/health',
    })
    assertStatus(unauthenticated, 401, 'Protected route should reject unauthenticated requests')

    const forbidden = await request({
      port: apiPort,
      path: '/ops/dashboard',
      headers: {
        'x-actor-id': 'reviewer-1',
        'x-actor-role': 'reviewer',
        'x-tenant-id': 'tenant_demo_a',
      },
    })
    assertStatus(forbidden, 403, 'Ops route should reject disallowed role')

    const allowed = await request({
      port: apiPort,
      path: '/protected/health',
      headers: {
        'x-actor-id': 'operator-1',
        'x-actor-role': 'case_operator',
        'x-tenant-id': 'tenant_demo_a',
        'x-request-id': 'verify-protected-request',
        'x-correlation-id': 'verify-protected-correlation',
      },
    })
    assertStatus(allowed, 200, 'Protected route should accept allowed role with tenant context')
    assertJsonField(allowed, 'tenantId', 'tenant_demo_a', 'Protected route should echo tenant context')
    assertJsonField(allowed, 'actorRole', 'case_operator', 'Protected route should echo actor role')
  } finally {
    await stopProcess(api)
  }
}

async function verifyWorkerBaseline() {
  const reconciliation = await runWorker({
    WORKER_JOB: 'reconciliation',
    WORKER_TENANT_ID: 'tenant_demo_a',
    WORKER_CORRELATION_ID: 'verify-worker-reconciliation',
  })

  if (!reconciliation.output.includes('"event":"reconciliation_completed"')) {
    throw new Error('Worker reconciliation should emit reconciliation_completed log')
  }

  const alertBaseline = await runWorker({
    WORKER_JOB: 'alert-baseline',
    WORKER_TENANT_ID: 'tenant_demo_a',
    WORKER_CORRELATION_ID: 'verify-worker-alert',
  })

  if (!alertBaseline.output.includes('"event":"alert_baseline_evaluated"')) {
    throw new Error('Worker alert baseline should emit alert_baseline_evaluated log')
  }
}

async function verifyWebClientBaseline() {
  const webClientPort = await getAvailablePort()
  const webClient = startNodeProcess('apps/web-client/server.js', {
    PORT: String(webClientPort),
  })

  try {
    await waitForLog(webClient, '"event":"server_listening"')

    const caseList = await request({
      port: webClientPort,
      path: '/cases',
    })
    assertStatus(caseList, 200, 'Web client /cases should return 200')
    assertBodyIncludes(caseList, 'Case list', 'Web client /cases should render case list')

    const timelineAudit = await request({
      port: webClientPort,
      path: '/cases/case_demo_001/timeline-audit',
    })
    assertStatus(timelineAudit, 200, 'Timeline audit page should return 200')
    assertBodyIncludes(timelineAudit, 'Timeline audit', 'Timeline audit page should render timeline audit content')

    const methodNotAllowed = await request({
      port: webClientPort,
      path: '/cases',
      method: 'POST',
    })
    assertStatus(methodNotAllowed, 405, 'Web client should reject non-GET methods')
    assertHeader(methodNotAllowed, 'allow', 'GET', 'Web client 405 should advertise Allow: GET')

    const missing = await request({
      port: webClientPort,
      path: '/unknown-route',
    })
    assertStatus(missing, 404, 'Web client should 404 unknown routes')
  } finally {
    await stopProcess(webClient)
  }
}

async function verifyWebOpsBaseline() {
  const webOpsPort = await getAvailablePort()
  const webOps = startNodeProcess('apps/web-ops/server.js', {
    PORT: String(webOpsPort),
  })

  try {
    await waitForLog(webOps, '"event":"server_listening"')

    const dashboard = await request({
      port: webOpsPort,
      path: '/ops',
    })
    assertStatus(dashboard, 200, 'Web ops /ops should return 200')
    assertBodyIncludes(dashboard, 'Ops dashboard', 'Web ops /ops should render dashboard')

    const methodNotAllowed = await request({
      port: webOpsPort,
      path: '/ops',
      method: 'POST',
    })
    assertStatus(methodNotAllowed, 405, 'Web ops should reject non-GET methods')

    const missing = await request({
      port: webOpsPort,
      path: '/unknown-route',
    })
    assertStatus(missing, 404, 'Web ops should 404 unknown routes')
  } finally {
    await stopProcess(webOps)
  }
}

function startNodeProcess(relativePath, extraEnv = {}) {
  const child = spawn(process.execPath, [relativePath], {
    cwd: projectRoot(),
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let output = ''
  let childError = null
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => {
    output += chunk
  })
  child.stderr.on('data', (chunk) => {
    output += chunk
  })
  child.on('error', (error) => {
    childError = error
  })

  return {
    child,
    getOutput: () => output,
    getError: () => childError,
  }
}

async function runWorker(extraEnv, timeoutMs = 10000) {
  const worker = startNodeProcess('apps/workers/src/main.js', extraEnv)
  const result = await Promise.race([
    waitForProcessClose(worker),
    sleep(timeoutMs).then(async () => {
      await stopProcess(worker)
      throw new Error(`Worker process timed out after ${timeoutMs}ms\n${worker.getOutput()}`)
    }),
  ])

  if (result.code !== 0) {
    throw new Error(`Worker process failed with code ${result.code}\n${worker.getOutput()}`)
  }

  return {
    output: worker.getOutput(),
  }
}

async function waitForLog(processHandle, expectedText, timeoutMs = 10000) {
  const startedAt = Date.now()

  while (!processHandle.getOutput().includes(expectedText)) {
    const childError = processHandle.getError()
    if (childError) {
      throw new Error(`Process error before expected log: ${expectedText}\n${childError.message}\n${processHandle.getOutput()}`)
    }

    if (processHandle.child.exitCode !== null) {
      throw new Error(`Process exited before expected log: ${expectedText}\n${processHandle.getOutput()}`)
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for log: ${expectedText}\n${processHandle.getOutput()}`)
    }

    await sleep(50)
  }
}

async function stopProcess(processHandle) {
  if (processHandle.child.exitCode !== null) {
    return
  }

  processHandle.child.kill('SIGTERM')
  await Promise.race([
    waitForProcessExit(processHandle),
    sleep(500).then(async () => {
      if (processHandle.child.exitCode === null) {
        processHandle.child.kill('SIGKILL')
        await waitForProcessExit(processHandle)
      }
    }),
  ])
}

function request({ port, path, method = 'GET', headers = {}, timeoutMs = 10000 }) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers,
    }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        })
      })
    })

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`))
    })
    req.on('error', reject)
    req.end()
  })
}

function assertStatus(response, expected, message) {
  if (response.status !== expected) {
    throw new Error(`${message}. Expected ${expected}, received ${response.status}. Body: ${response.body}`)
  }
}

function assertHeader(response, name, expected, message) {
  if (response.headers[name] !== expected) {
    throw new Error(`${message}. Expected ${name}=${expected}, received ${response.headers[name]}`)
  }
}

function assertJsonField(response, field, expected, message) {
  const body = JSON.parse(response.body)
  if (body[field] !== expected) {
    throw new Error(`${message}. Expected ${field}=${expected}, received ${body[field]}`)
  }
}

function assertBodyIncludes(response, expectedText, message) {
  if (!response.body.includes(expectedText)) {
    throw new Error(`${message}. Missing text: ${expectedText}`)
  }
}

async function waitForProcessExit(processHandle) {
  const childError = processHandle.getError()
  if (childError) {
    throw childError
  }

  if (processHandle.child.exitCode !== null) {
    return {
      code: processHandle.child.exitCode,
      signal: processHandle.child.signalCode,
    }
  }

  return new Promise((resolve, reject) => {
    const handleError = (error) => {
      cleanup()
      reject(error)
    }
    const handleExit = (code, signal) => {
      cleanup()
      resolve({ code, signal })
    }
    const cleanup = () => {
      processHandle.child.off('error', handleError)
      processHandle.child.off('exit', handleExit)
    }

    processHandle.child.on('error', handleError)
    processHandle.child.on('exit', handleExit)
  })
}

async function waitForProcessClose(processHandle) {
  const childError = processHandle.getError()
  if (childError) {
    throw childError
  }

  return new Promise((resolve, reject) => {
    const handleError = (error) => {
      cleanup()
      reject(error)
    }
    const handleClose = (code, signal) => {
      cleanup()
      resolve({ code, signal })
    }
    const cleanup = () => {
      processHandle.child.off('error', handleError)
      processHandle.child.off('close', handleClose)
    }

    processHandle.child.on('error', handleError)
    processHandle.child.on('close', handleClose)
  })
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to resolve available port')))
        return
      }

      const { port } = address
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve(port)
      })
    })
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function projectRoot() {
  return new URL('../../', import.meta.url)
}
