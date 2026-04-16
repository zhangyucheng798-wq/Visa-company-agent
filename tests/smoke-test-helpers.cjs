const { spawn } = require('node:child_process')
const net = require('node:net')

function startNodeProcess(relativePath, cwd, extraEnv = {}) {
  const child = spawn(process.execPath, [relativePath], {
    cwd,
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

async function fetchHtml(port, path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    signal: AbortSignal.timeout(10000),
  })

  return {
    status: response.status,
    headers: response.headers,
    body: await response.text(),
  }
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address !== 'object') {
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
    server.on('error', reject)
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
  fetchHtml,
  getAvailablePort,
  startNodeProcess,
  stopProcess,
  waitForLog,
}
