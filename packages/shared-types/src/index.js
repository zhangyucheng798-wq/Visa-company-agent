export const CaseStatus = Object.freeze({
  DRAFT: 'draft',
  INTAKE_IN_PROGRESS: 'intake_in_progress',
  AWAITING_CLIENT: 'awaiting_client',
  INTERNAL_PROCESSING: 'internal_processing',
  REVIEW_IN_PROGRESS: 'review_in_progress',
  APPROVAL_IN_PROGRESS: 'approval_in_progress',
  READY_FOR_NEXT_STEP: 'ready_for_next_step',
  CLOSED: 'closed',
})

export const ClientVisibleStatus = Object.freeze({
  INTAKE_STARTED: 'intake_started',
  ACTION_REQUIRED: 'action_required',
  UNDER_REVIEW: 'under_review',
  PROCESSING: 'processing',
  READY_FOR_NEXT_STEP: 'ready_for_next_step',
  CLOSED: 'closed',
})

export const ValidationStatus = Object.freeze({
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed',
})

export const ScanStatus = Object.freeze({
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed',
})

export const DocumentVersionStatus = Object.freeze({
  PENDING_ADMISSION: 'pending_admission',
  ADMITTED: 'admitted',
  REJECTED: 'rejected',
})

export const MaterialSlotStatus = Object.freeze({
  OPEN: 'open',
  WAITING_UPLOAD: 'waiting_upload',
  UPLOADED: 'uploaded',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
})

export const TaskStatus = Object.freeze({
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
})

export const ActionItemStatus = Object.freeze({
  OPEN: 'open',
  DISMISSED: 'dismissed',
  CONVERTED_TO_TASK: 'converted_to_task',
})

export const ReviewStatus = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RETURNED: 'returned',
  COMPLETED: 'completed',
})

export const ApprovalStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

export const NotificationDeliveryStatus = Object.freeze({
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
})

export const RiskLevel = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
})

export const BlockerType = Object.freeze({
  MISSING_MATERIAL: 'missing_material',
  REVIEW_REQUIRED: 'review_required',
  APPROVAL_REQUIRED: 'approval_required',
  SECURITY_HOLD: 'security_hold',
})

export const ErrorCode = Object.freeze({
  ACCESS_DENIED: 'ACCESS_DENIED',
  TENANT_SCOPE_MISMATCH: 'TENANT_SCOPE_MISMATCH',
  CLIENT_LINK_INVALID: 'CLIENT_LINK_INVALID',
  CLIENT_LINK_REVOKED: 'CLIENT_LINK_REVOKED',
  CLIENT_LINK_EXPIRED: 'CLIENT_LINK_EXPIRED',
  FILE_VALIDATION_FAILED: 'FILE_VALIDATION_FAILED',
  FILE_SCAN_FAILED: 'FILE_SCAN_FAILED',
  DOCUMENT_VERSION_REJECTED: 'DOCUMENT_VERSION_REJECTED',
  DOCUMENT_VERSION_ALREADY_ADMITTED: 'DOCUMENT_VERSION_ALREADY_ADMITTED',
  CASE_INVALID_TRANSITION: 'CASE_INVALID_TRANSITION',
  REVIEW_PRECONDITION_FAILED: 'REVIEW_PRECONDITION_FAILED',
  AUDIT_REQUIRED_WRITE_FAILED: 'AUDIT_REQUIRED_WRITE_FAILED',
})

export const BaseEntityFields = Object.freeze({
  tenantId: 'string',
  createdAt: 'string',
  updatedAt: 'string',
})
