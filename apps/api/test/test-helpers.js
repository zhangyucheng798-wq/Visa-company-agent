import { spawn } from 'node:child_process'

export function startNodeProcess(relativePath, cwdUrl, extraEnv = {}) {
  const child = spawn(process.execPath, [relativePath], {
    cwd: cwdUrl,
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

export async function waitForServerListening(processHandle, timeoutMs = 10000) {
  const startedAt = Date.now()

  while (true) {
    const childError = processHandle.getError()
    if (childError) {
      throw new Error(`Process error before server listening\n${childError.message}\n${processHandle.getOutput()}`)
    }

    if (processHandle.child.exitCode !== null) {
      throw new Error(`Process exited before server listening\n${processHandle.getOutput()}`)
    }

    const match = processHandle.getOutput().match(/"event":"server_listening","port":(\d+)/)
    if (match) {
      return Number(match[1])
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for server listening\n${processHandle.getOutput()}`)
    }

    await sleep(50)
  }
}

export async function stopProcess(processHandle) {
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

export async function waitForProcessExit(processHandle) {
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

export async function requestJson({ port, path, method = 'GET', headers = {}, timeoutMs = 10000 }) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  })

  return {
    status: response.status,
    headers: response.headers,
    body: await response.json(),
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
