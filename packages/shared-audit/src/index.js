export const AuditLevel = Object.freeze({
  A: 'A',
  B: 'B',
  C: 'C',
})

export const AuditActionCode = Object.freeze({
  CASE_CREATED: 'CASE_CREATED',
  CASE_START_INTAKE: 'CASE_START_INTAKE',
  CASE_SEND_SUPPLEMENT_REQUEST: 'CASE_SEND_SUPPLEMENT_REQUEST',
  CLIENT_TOKEN_ISSUED: 'CLIENT_TOKEN_ISSUED',
  CLIENT_LINK_OPEN: 'CLIENT_LINK_OPEN',
  FILE_UPLOAD_RECEIVED: 'FILE_UPLOAD_RECEIVED',
  DOCUMENT_VERSION_ADMITTED: 'DOCUMENT_VERSION_ADMITTED',
  REVIEW_DECISION_RECORDED: 'REVIEW_DECISION_RECORDED',
  APPROVAL_DECISION_RECORDED: 'APPROVAL_DECISION_RECORDED',
})

export const AuditActionRegistry = Object.freeze({
  [AuditActionCode.CASE_CREATED]: { level: AuditLevel.B, targetType: 'case' },
  [AuditActionCode.CASE_START_INTAKE]: { level: AuditLevel.B, targetType: 'case' },
  [AuditActionCode.CASE_SEND_SUPPLEMENT_REQUEST]: { level: AuditLevel.A, targetType: 'case' },
  [AuditActionCode.CLIENT_TOKEN_ISSUED]: { level: AuditLevel.A, targetType: 'client_access_token' },
  [AuditActionCode.CLIENT_LINK_OPEN]: { level: AuditLevel.A, targetType: 'client_access_link' },
  [AuditActionCode.FILE_UPLOAD_RECEIVED]: { level: AuditLevel.B, targetType: 'raw_file_object' },
  [AuditActionCode.DOCUMENT_VERSION_ADMITTED]: { level: AuditLevel.A, targetType: 'document_version' },
  [AuditActionCode.REVIEW_DECISION_RECORDED]: { level: AuditLevel.A, targetType: 'review' },
  [AuditActionCode.APPROVAL_DECISION_RECORDED]: { level: AuditLevel.A, targetType: 'approval' },
})

export function getAuditActionDefinition(actionCode) {
  return AuditActionRegistry[actionCode] || null
}
