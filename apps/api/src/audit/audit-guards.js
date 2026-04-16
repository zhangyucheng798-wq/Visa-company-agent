import { AuditLevel } from '../../../../packages/shared-audit/src/index.js'
import { createAuditCompensation } from './audit-service.js'

export function enforceAuditWritePolicy(result, requestId, auditRecord = null) {
  if (result.ok) {
    return null
  }

  const compensation = auditRecord ? createAuditCompensation(auditRecord, result.error, requestId) : null

  return {
    status: result.error.retryable ? 503 : 500,
    body: {
      code: result.error.code,
      message:
        result.error.retryable
          ? 'Audit write failed; action requires retry or compensation handling'
          : 'Audit write failed; action blocked',
      request_id: requestId,
      retryable: result.error.retryable,
      audit_blocked: true,
      audit_compensation_id: compensation?.compensationId || null,
    },
  }
}

export function isBlockingAuditLevel(auditRecord) {
  return auditRecord.auditLevel === AuditLevel.A || auditRecord.auditLevel === AuditLevel.B
}
