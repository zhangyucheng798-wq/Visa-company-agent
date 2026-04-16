export const ApiErrorShape = Object.freeze({
  code: 'string',
  message: 'string',
  request_id: 'string',
  retryable: 'boolean',
})

export const PaginationContract = Object.freeze({
  page: 'number',
  pageSize: 'number',
})

export const AuditCompensationDto = Object.freeze({
  compensationId: 'string',
  tenantId: 'string',
  requestId: 'string',
  targetId: 'string',
  actionCode: 'string',
  auditLevel: 'A|B|C',
  errorCode: 'string',
  retryable: 'boolean',
  status: 'pending|resolved',
  resolutionNote: 'string|null',
  resolvedAt: 'string|null',
  createdAt: 'string',
})

export const QueueFilterContract = Object.freeze({
  ownerScope: 'mine|team|all',
  riskLevel: 'low|medium|high',
  taskStatus: 'open|assigned|in_progress|completed|cancelled',
  caseStatus: 'draft|intake_in_progress|awaiting_client|internal_processing|review_in_progress|approval_in_progress|ready_for_next_step|closed',
})

export const RawFileUploadContract = Object.freeze({
  caseId: 'string',
  materialSlotId: 'string',
  originalFileName: 'string',
})

export const CreateClientCommand = Object.freeze({
  fullName: 'string',
  email: 'string',
  phone: 'string?',
})

export const CreateBeneficiaryCommand = Object.freeze({
  fullName: 'string',
  passportNumber: 'string',
  nationality: 'string',
})

export const CreateCaseCommand = Object.freeze({
  clientId: 'string',
  beneficiaryId: 'string',
  visaType: 'string',
  countryCode: 'string',
})

export const StartIntakeCommand = Object.freeze({
  caseId: 'string',
})

export const SendSupplementRequestCommand = Object.freeze({
  caseId: 'string',
})

export const SubmitForReviewCommand = Object.freeze({
  caseId: 'string',
})

export const ReturnToClientCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const ReturnToInternalCommand = Object.freeze({
  caseId: 'string',
})

export const EscalateCaseCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const ApproveCaseCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const ApproveReviewCommand = Object.freeze({
  caseId: 'string',
})

export const ReturnReviewCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const RejectCaseCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const ApproveApprovalCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const RejectApprovalCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const ConvertActionItemToTaskCommand = Object.freeze({
  actionItemId: 'string',
  assigneeId: 'string?',
})

export const MarkReadyForNextStepCommand = Object.freeze({
  caseId: 'string',
})

export const ClientDto = Object.freeze({
  clientId: 'string',
  fullName: 'string',
  email: 'string',
  createdAt: 'string',
})

export const BeneficiaryDto = Object.freeze({
  beneficiaryId: 'string',
  fullName: 'string',
  nationality: 'string',
  createdAt: 'string',
})

export const CaseSummaryDto = Object.freeze({
  caseId: 'string',
  clientId: 'string',
  beneficiaryId: 'string',
  caseStatus: 'string',
  clientVisibleStatus: 'string',
  riskLevel: 'string',
  approvalSubmittedAt: 'string|null',
  createdAt: 'string',
})

export const ReviewDto = Object.freeze({
  reviewId: 'string',
  caseId: 'string',
  tenantId: 'string',
  actorId: 'string',
  reviewStatus: 'pending|in_progress|returned|completed',
  decision: 'approved|returned',
  reasonCode: 'string',
  createdAt: 'string',
  updatedAt: 'string',
  decidedAt: 'string',
})

export const ApprovalDto = Object.freeze({
  approvalId: 'string',
  caseId: 'string',
  tenantId: 'string',
  actorId: 'string',
  approvalStatus: 'pending|approved|rejected',
  reasonCode: 'string',
  createdAt: 'string',
  updatedAt: 'string',
  decidedAt: 'string',
})

export const TaskDto = Object.freeze({
  taskId: 'string',
  tenantId: 'string',
  caseId: 'string',
  title: 'string',
  status: 'open|assigned|in_progress|completed|cancelled',
  assigneeId: 'string|null',
  createdAt: 'string',
  updatedAt: 'string',
})

export const ActionItemDto = Object.freeze({
  actionItemId: 'string',
  tenantId: 'string',
  caseId: 'string',
  title: 'string',
  blockerType: 'missing_material|review_required|approval_required|security_hold',
  status: 'open|dismissed|converted_to_task',
  convertedTaskId: 'string|null',
  createdAt: 'string',
  updatedAt: 'string',
})

export const RetryNotificationDeliveryCommand = Object.freeze({
  notificationId: 'string',
  outcome: 'sent|failed?',
  failureReason: 'string?',
})

export const NotificationDispatchDto = Object.freeze({
  notificationId: 'string',
  tenantId: 'string',
  caseId: 'string',
  channel: 'internal',
  notificationType: 'supplement_request_internal',
  recipientRole: 'case_operator',
  recipientActorId: 'string|null',
  payload: 'object',
  deliveryStatus: 'pending|sent|failed',
  deliveryAttempts: 'number',
  lastAttemptAt: 'string|null',
  deliveredAt: 'string|null',
  failureReason: 'string|null',
  dispatchedAt: 'string',
})

export const RawFileObjectDto = Object.freeze({
  rawFileObjectId: 'string',
  caseId: 'string',
  materialSlotId: 'string',
  validationStatus: 'string',
  scanStatus: 'string',
  documentVersionStatus: 'string',
  createdAt: 'string',
})
