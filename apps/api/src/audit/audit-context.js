import { getAuditActionDefinition } from '../../../../packages/shared-audit/src/index.js'

export function buildAuditContext({ requestContext, actionCode, targetId, caseId = null, clientId = null, reasonCode = 'SYSTEM_INIT' }) {
  const definition = getAuditActionDefinition(actionCode)

  if (!definition) {
    return {
      ok: false,
      error: {
        code: 'AUDIT_ACTION_UNKNOWN',
        message: `Unknown audit action: ${actionCode}`,
      },
    }
  }

  return {
    ok: true,
    value: {
      requestId: requestContext.requestId,
      correlationId: requestContext.correlationId,
      tenantId: requestContext.tenantId,
      actorId: requestContext.actorId,
      actorRole: requestContext.actorRole,
      actionCode,
      auditLevel: definition.level,
      targetType: definition.targetType,
      targetId,
      caseId,
      clientId,
      reasonCode,
      result: 'success',
      occurredAt: new Date().toISOString(),
    },
  }
}
