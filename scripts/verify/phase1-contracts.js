import { BlockerType, CaseStatus, ClientVisibleStatus, TaskStatus } from '../../packages/shared-types/src/index.js'
import { ApiErrorShape, CreateCaseCommand, QueueFilterContract } from '../../packages/shared-contracts/src/index.js'

const checks = [
  ['CaseStatus.READY_FOR_NEXT_STEP', CaseStatus.READY_FOR_NEXT_STEP],
  ['ClientVisibleStatus.ACTION_REQUIRED', ClientVisibleStatus.ACTION_REQUIRED],
  ['TaskStatus.IN_PROGRESS', TaskStatus.IN_PROGRESS],
  ['BlockerType.SECURITY_HOLD', BlockerType.SECURITY_HOLD],
  ['ApiErrorShape.request_id', ApiErrorShape.request_id],
  ['CreateCaseCommand.clientId', CreateCaseCommand.clientId],
  ['QueueFilterContract.ownerScope', QueueFilterContract.ownerScope],
]

const failed = checks.filter(([, value]) => !value)
if (failed.length > 0) {
  console.error('Contract verification failed:')
  for (const [name] of failed) console.error(`- ${name}`)
  process.exit(1)
}

console.log('Phase 1 contracts verification passed.')
