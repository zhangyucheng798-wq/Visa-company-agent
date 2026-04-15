import fs from 'node:fs'

const required = [
  'apps/api/src',
  'apps/web-ops',
  'apps/web-client',
  'apps/workers/src',
  'packages/shared-types/src',
  'packages/shared-contracts/src',
  'packages/shared-audit/src',
  'packages/shared-testkit/src',
  'infra/db/migrations',
  'infra/observability',
  'tests/integration',
  'tests/contract',
  'tests/security',
]

const missing = required.filter((item) => !fs.existsSync(new URL(`../../${item}`, import.meta.url)))

if (missing.length > 0) {
  console.error('Missing required scaffold paths:')
  for (const item of missing) console.error(`- ${item}`)
  process.exit(1)
}

console.log('Phase 1 scaffold structure verified.')
