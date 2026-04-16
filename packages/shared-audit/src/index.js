export const AuditLevel = Object.freeze({
  A: 'A',
  B: 'B',
  C: 'C',
})

export const AuditActionCode = Object.freeze({
  CASE_CREATED: 'CASE_CREATED',
  CASE_START_INTAKE: 'CASE_START_INTAKE',
  CASE_SEND_SUPPLEMENT_REQUEST: 'CASE_SEND_SUPPLEMENT_REQUEST',
  CASE_RETURNED_TO_INTERNAL_PROCESSING: 'CASE_RETURNED_TO_INTERNAL_PROCESSING',
  CASE_SUBMITTED_FOR_REVIEW: 'CASE_SUBMITTED_FOR_REVIEW',
  CASE_SUBMITTED_FOR_APPROVAL: 'CASE_SUBMITTED_FOR_APPROVAL',
  CASE_CLOSED: 'CASE_CLOSED',
  CLIENT_CREATED: 'CLIENT_CREATED',
  CLIENT_TOKEN_ISSUED: 'CLIENT_TOKEN_ISSUED',
  CLIENT_LINK_OPEN: 'CLIENT_LINK_OPEN',
  CLIENT_LINK_REVOKED: 'CLIENT_LINK_REVOKED',
  BENEFICIARY_CREATED: 'BENEFICIARY_CREATED',
  CLIENT_SUPPLEMENT_SUBMITTED: 'CLIENT_SUPPLEMENT_SUBMITTED',
  FILE_UPLOAD_RECEIVED: 'FILE_UPLOAD_RECEIVED',
  DOCUMENT_VERSION_ADMITTED: 'DOCUMENT_VERSION_ADMITTED',
  REVIEW_DECISION_RECORDED: 'REVIEW_DECISION_RECORDED',
  REVIEW_RETURNED: 'REVIEW_RETURNED',
  APPROVAL_DECISION_RECORDED: 'APPROVAL_DECISION_RECORDED',
  APPROVAL_REJECTION_RECORDED: 'APPROVAL_REJECTION_RECORDED',
})

export const AuditActionRegistry = Object.freeze({
  [AuditActionCode.CASE_CREATED]: { level: AuditLevel.B, targetType: 'case' },
  [AuditActionCode.CASE_START_INTAKE]: { level: AuditLevel.B, targetType: 'case' },
  [AuditActionCode.CASE_SEND_SUPPLEMENT_REQUEST]: { level: AuditLevel.A, targetType: 'case' },
  [AuditActionCode.CASE_RETURNED_TO_INTERNAL_PROCESSING]: { level: AuditLevel.A, targetType: 'case' },
  [AuditActionCode.CASE_SUBMITTED_FOR_REVIEW]: { level: AuditLevel.A, targetType: 'case' },
  [AuditActionCode.CASE_SUBMITTED_FOR_APPROVAL]: { level: AuditLevel.A, targetType: 'case' },
  [AuditActionCode.CASE_CLOSED]: { level: AuditLevel.A, targetType: 'case' },
  [AuditActionCode.CLIENT_CREATED]: { level: AuditLevel.B, targetType: 'client' },
  [AuditActionCode.CLIENT_TOKEN_ISSUED]: { level: AuditLevel.A, targetType: 'client_access_token' },
  [AuditActionCode.CLIENT_LINK_OPEN]: { level: AuditLevel.A, targetType: 'client_access_link' },
  [AuditActionCode.CLIENT_LINK_REVOKED]: { level: AuditLevel.A, targetType: 'client_access_link' },
  [AuditActionCode.BENEFICIARY_CREATED]: { level: AuditLevel.B, targetType: 'beneficiary' },
  [AuditActionCode.CLIENT_SUPPLEMENT_SUBMITTED]: { level: AuditLevel.A, targetType: 'case' },
  [AuditActionCode.FILE_UPLOAD_RECEIVED]: { level: AuditLevel.B, targetType: 'raw_file_object' },
  [AuditActionCode.DOCUMENT_VERSION_ADMITTED]: { level: AuditLevel.A, targetType: 'document_version' },
  [AuditActionCode.REVIEW_DECISION_RECORDED]: { level: AuditLevel.A, targetType: 'review' },
  [AuditActionCode.REVIEW_RETURNED]: { level: AuditLevel.A, targetType: 'review' },
  [AuditActionCode.APPROVAL_DECISION_RECORDED]: { level: AuditLevel.A, targetType: 'approval' },
  [AuditActionCode.APPROVAL_REJECTION_RECORDED]: { level: AuditLevel.A, targetType: 'approval' },
})

export function getAuditActionDefinition(actionCode) {
  return AuditActionRegistry[actionCode] || null
}
