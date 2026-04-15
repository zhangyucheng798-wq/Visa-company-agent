import fs from 'node:fs'
import path from 'node:path'

const name = process.argv[2]
if (!name) {
  console.error('Usage: node scripts/db/create-migration.js <migration_name>')
  process.exit(1)
}

const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
const fileName = `${timestamp}_${name}.sql`
const target = path.resolve('D:/Visa Company开发/infra/db/migrations', fileName)

if (fs.existsSync(target)) {
  console.error(`Migration already exists: ${fileName}`)
  process.exit(1)
}

const content = `-- Migration: ${fileName}\n-- Classification: L1|L2|L3\n-- RollbackPlan: infra/db/rollback-plans/${timestamp}_${name}.md\n\nBEGIN;\n\n-- Write forward-only SQL here.\n\nCOMMIT;\n`
fs.writeFileSync(target, content)

const rollbackPath = path.resolve('D:/Visa Company开发/infra/db/rollback-plans', `${timestamp}_${name}.md`)
const rollbackContent = `# Rollback Plan: ${fileName}\n\n- Trigger conditions:\n- Rollback steps:\n- Validation checks:\n- Impacted tables:\n`
fs.writeFileSync(rollbackPath, rollbackContent)

console.log(`Created migration: ${target}`)
console.log(`Created rollback plan: ${rollbackPath}`)
