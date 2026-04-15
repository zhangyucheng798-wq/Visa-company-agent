import { AuditLevel } from '../../../../packages/shared-audit/src/index.js'
import { ErrorCode } from '../../../../packages/shared-types/src/index.js'

const memoryAuditLog = []

export function writeAuditRecord(auditRecord) {
  const forcedFailure = process.env.AUDIT_FORCE_FAIL === '1'
  if (forcedFailure) {
    return {
      ok: false,
      error: {
        code: ErrorCode.AUDIT_REQUIRED_WRITE_FAILED,
        message: 'Forced audit failure for verification',
        retryable: auditRecord.auditLevel !== AuditLevel.A,
      },
    }
  }

  memoryAuditLog.push(auditRecord)
  return {
    ok: true,
    value: auditRecord,
  }
}

export function getAuditLogSnapshot() {
  return [...memoryAuditLog]
}
