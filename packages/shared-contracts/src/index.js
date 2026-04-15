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
  messageTemplateCode: 'string',
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
  reasonCode: 'string',
})

export const EscalateCaseCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const ApproveCaseCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
})

export const RejectCaseCommand = Object.freeze({
  caseId: 'string',
  reasonCode: 'string',
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
  createdAt: 'string',
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
