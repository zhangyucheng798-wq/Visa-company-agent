const test = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { once } = require('node:events')

const port = 3312

test('web-ops serves dashboard and route guards', async () => {
  const server = startNodeProcess('../server.js', {
    PORT: String(port),
  })

  try {
    await waitForLog(server, '"event":"server_listening"')

    const dashboard = await fetch(`http://127.0.0.1:${port}/ops`)
    const dashboardHtml = await dashboard.text()
    assert.equal(dashboard.status, 200)
    assert.match(dashboardHtml, /Ops dashboard/)

    const methodNotAllowed = await fetch(`http://127.0.0.1:${port}/ops`, {
      method: 'POST',
    })
    assert.equal(methodNotAllowed.status, 405)

    const missing = await fetch(`http://127.0.0.1:${port}/missing-route`)
    assert.equal(missing.status, 404)
  } finally {
    await stopProcess(server)
  }
})

function startNodeProcess(relativePath, extraEnv = {}) {
  const child = spawn(process.execPath, [relativePath], {
    cwd: __dirname,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let output = ''
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => {
    output += chunk
  })
  child.stderr.on('data', (chunk) => {
    output += chunk
  })

  return {
    child,
    getOutput: () => output,
  }
}

async function waitForLog(processHandle, expectedText, timeoutMs = 10000) {
  const startedAt = Date.now()

  while (!processHandle.getOutput().includes(expectedText)) {
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
  const timeout = sleep(500).then(() => {
    if (processHandle.child.exitCode === null) {
      processHandle.child.kill('SIGKILL')
    }
  })

  await Promise.race([
    once(processHandle.child, 'exit'),
    timeout,
  ])
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
