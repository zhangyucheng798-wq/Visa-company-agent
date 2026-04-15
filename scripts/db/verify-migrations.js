import fs from 'node:fs'
import path from 'node:path'

const migrationsDir = path.resolve('D:/Visa Company开发/infra/db/migrations')
const rollbackDir = path.resolve('D:/Visa Company开发/infra/db/rollback-plans')

const migrations = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'))
const failures = []

for (const migration of migrations) {
  const fullPath = path.join(migrationsDir, migration)
  const content = fs.readFileSync(fullPath, 'utf8')
  const rollbackName = migration.replace(/\.sql$/, '.md')
  const rollbackPath = path.join(rollbackDir, rollbackName)

  if (!content.includes('-- Classification:')) {
    failures.push(`${migration}: missing classification header`)
  }

  if (!content.includes('BEGIN;') || !content.includes('COMMIT;')) {
    failures.push(`${migration}: missing BEGIN/COMMIT wrapper`)
  }

  if (!fs.existsSync(rollbackPath)) {
    failures.push(`${migration}: missing rollback plan ${rollbackName}`)
  }
}

if (failures.length > 0) {
  console.error('Migration verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Migration skeleton verification passed.')
