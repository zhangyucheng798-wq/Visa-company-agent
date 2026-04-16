import crypto from 'node:crypto'
import { AuditLevel } from '../../../../packages/shared-audit/src/index.js'
import { ErrorCode } from '../../../../packages/shared-types/src/index.js'

const memoryAuditLog = []
const auditCompensations = []

function shouldForceAuditFailure(auditRecord) {
  if (process.env.AUDIT_FORCE_FAIL !== '1') return false

  const ignoredActions = new Set(
    (process.env.AUDIT_FORCE_FAIL_IGNORE_ACTIONS || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )

  return !ignoredActions.has(auditRecord.actionCode)
}

export function writeAuditRecord(auditRecord) {
  const forcedFailure = shouldForceAuditFailure(auditRecord)
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

export function createAuditCompensation(auditRecord, error, requestId) {
  if (!error?.retryable) return null

  const compensation = {
    compensationId: crypto.randomUUID(),
    tenantId: auditRecord.tenantId,
    requestId,
    targetId: auditRecord.targetId,
    actionCode: auditRecord.actionCode,
    auditLevel: auditRecord.auditLevel,
    errorCode: error.code,
    retryable: error.retryable,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  auditCompensations.push(compensation)
  return compensation
}

export function listAuditCompensationsByTenant(tenantId) {
  return auditCompensations.filter((item) => item.tenantId === tenantId)
}

export function listAuditCompensationsByStatus(status, tenantId) {
  return auditCompensations.filter((item) => item.status === status && item.tenantId === tenantId)
}

export function findAuditCompensationById(compensationId, tenantId) {
  return auditCompensations.find((item) => item.compensationId === compensationId && item.tenantId === tenantId) || null
}

export function resolveAuditCompensation(compensationId, tenantId, resolutionNote = null) {
  const compensation = findAuditCompensationById(compensationId, tenantId)
  if (!compensation || compensation.status !== 'pending') return null

  compensation.status = 'resolved'
  compensation.resolutionNote = resolutionNote
  compensation.resolvedAt = new Date().toISOString()
  return compensation
}

export function reconcilePendingAuditCompensations(tenantId = null) {
  return auditCompensations.filter((item) => item.status === 'pending' && (!tenantId || item.tenantId === tenantId))
}

export function getAuditLogSnapshot() {
  return [...memoryAuditLog]
}

export function getAuditCompensationSnapshot() {
  return [...auditCompensations]
}
