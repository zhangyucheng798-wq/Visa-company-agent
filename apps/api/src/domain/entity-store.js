import crypto from 'node:crypto'
import { ApprovalStatus, CaseStatus, ClientVisibleStatus, MaterialSlotStatus, ReviewStatus, RiskLevel, TaskStatus } from '../../../../packages/shared-types/src/index.js'

const clients = []
const beneficiaries = []
const cases = []
const materialSlots = []
const clientAccessTokens = []
const reviews = []
const approvals = []
const tasks = []

export function listTasksByTenant(tenantId) {
  return tasks.filter((item) => item.tenantId === tenantId)
}

export function listTasksByCase(caseId, tenantId) {
  return tasks.filter((item) => item.caseId === caseId && item.tenantId === tenantId)
}

export function findTaskById(taskId, tenantId) {
  return tasks.find((item) => item.taskId === taskId && item.tenantId === tenantId) || null
}

export function listApprovalsByTenant(tenantId) {
  return approvals.filter((item) => item.tenantId === tenantId)
}

export function listApprovalsByCase(caseId, tenantId) {
  return approvals.filter((item) => item.caseId === caseId && item.tenantId === tenantId)
}

export function findApprovalById(approvalId, tenantId) {
  return approvals.find((item) => item.approvalId === approvalId && item.tenantId === tenantId) || null
}

export function listReviewsByTenant(tenantId) {
  return reviews.filter((item) => item.tenantId === tenantId)
}

export function listReviewsByCase(caseId, tenantId) {
  return reviews.filter((item) => item.caseId === caseId && item.tenantId === tenantId)
}

export function findReviewById(reviewId, tenantId) {
  return reviews.find((item) => item.reviewId === reviewId && item.tenantId === tenantId) || null
}

export function createClient({ tenantId, fullName, email, phone = null, clientId = crypto.randomUUID() }) {
  const now = new Date().toISOString()
  const record = {
    clientId,
    tenantId,
    fullName,
    email,
    phone,
    createdAt: now,
    updatedAt: now,
  }

  clients.push(record)
  return record
}

export function listClientsByTenant(tenantId) {
  return clients.filter((item) => item.tenantId === tenantId)
}

export function findClientById(clientId, tenantId) {
  return clients.find((item) => item.clientId === clientId && item.tenantId === tenantId) || null
}

export function createBeneficiary({ tenantId, fullName, passportNumber, nationality, beneficiaryId = crypto.randomUUID() }) {
  const now = new Date().toISOString()
  const record = {
    beneficiaryId,
    tenantId,
    fullName,
    passportNumber,
    nationality,
    createdAt: now,
    updatedAt: now,
  }

  beneficiaries.push(record)
  return record
}

export function listBeneficiariesByTenant(tenantId) {
  return beneficiaries.filter((item) => item.tenantId === tenantId)
}

export function findBeneficiaryById(beneficiaryId, tenantId) {
  return beneficiaries.find((item) => item.beneficiaryId === beneficiaryId && item.tenantId === tenantId) || null
}

export function createVisaCase({ tenantId, clientId, beneficiaryId, visaType, countryCode, caseId = crypto.randomUUID() }) {
  const now = new Date().toISOString()
  const record = {
    caseId,
    tenantId,
    clientId,
    beneficiaryId,
    visaType,
    countryCode,
    caseStatus: CaseStatus.DRAFT,
    clientVisibleStatus: ClientVisibleStatus.INTAKE_STARTED,
    riskLevel: RiskLevel.LOW,
    ownerId: null,
    assignedAt: null,
    approvalSubmittedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  cases.push(record)
  return record
}

export function listCasesByTenant(tenantId) {
  return cases.filter((item) => item.tenantId === tenantId)
}

export function findCaseById(caseId, tenantId) {
  return cases.find((item) => item.caseId === caseId && item.tenantId === tenantId) || null
}

export function startIntake(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  visaCase.caseStatus = CaseStatus.INTAKE_IN_PROGRESS
  visaCase.clientVisibleStatus = ClientVisibleStatus.INTAKE_STARTED
  visaCase.updatedAt = new Date().toISOString()
  return visaCase
}

export function sendSupplementRequest(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  visaCase.caseStatus = CaseStatus.AWAITING_CLIENT
  visaCase.clientVisibleStatus = ClientVisibleStatus.ACTION_REQUIRED
  visaCase.updatedAt = new Date().toISOString()
  return visaCase
}

export function returnToInternalProcessing(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  visaCase.caseStatus = CaseStatus.INTERNAL_PROCESSING
  visaCase.clientVisibleStatus = ClientVisibleStatus.PROCESSING
  visaCase.updatedAt = new Date().toISOString()
  return visaCase
}

export function submitForReview(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  visaCase.caseStatus = CaseStatus.REVIEW_IN_PROGRESS
  visaCase.clientVisibleStatus = ClientVisibleStatus.UNDER_REVIEW
  visaCase.updatedAt = new Date().toISOString()
  return visaCase
}

export function assignCaseOwner(caseId, tenantId, ownerId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const now = new Date().toISOString()
  visaCase.ownerId = ownerId
  visaCase.assignedAt = now
  visaCase.updatedAt = now
  return visaCase
}

export function createTask({ tenantId, caseId, title, status = TaskStatus.OPEN, assigneeId = null, taskId = crypto.randomUUID() }) {
  const now = new Date().toISOString()
  const record = {
    taskId,
    tenantId,
    caseId,
    title,
    status,
    assigneeId,
    createdAt: now,
    updatedAt: now,
  }

  tasks.push(record)
  return record
}

export function getReviewSubmissionPreview(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  return {
    caseId: visaCase.caseId,
    clientId: visaCase.clientId,
  }
}

export function recordReviewDecision(caseId, tenantId, actorId, reviewId = crypto.randomUUID()) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const now = new Date().toISOString()
  const review = {
    reviewId,
    caseId: visaCase.caseId,
    tenantId,
    actorId,
    reviewStatus: ReviewStatus.COMPLETED,
    decision: 'approved',
    reasonCode: 'PHASE4_REVIEW_APPROVED',
    createdAt: now,
    updatedAt: now,
    decidedAt: now,
  }

  reviews.push(review)
  visaCase.caseStatus = CaseStatus.APPROVAL_IN_PROGRESS
  visaCase.clientVisibleStatus = ClientVisibleStatus.UNDER_REVIEW
  visaCase.approvalSubmittedAt = null
  visaCase.updatedAt = now

  return {
    case: visaCase,
    review,
  }
}

export function rejectReviewDecision(caseId, tenantId, actorId, reasonCode = 'PHASE4_REVIEW_RETURNED', reviewId = crypto.randomUUID()) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const now = new Date().toISOString()
  const review = {
    reviewId,
    caseId: visaCase.caseId,
    tenantId,
    actorId,
    reviewStatus: ReviewStatus.RETURNED,
    decision: 'returned',
    reasonCode,
    createdAt: now,
    updatedAt: now,
    decidedAt: now,
  }

  reviews.push(review)
  visaCase.caseStatus = CaseStatus.AWAITING_CLIENT
  visaCase.clientVisibleStatus = ClientVisibleStatus.ACTION_REQUIRED
  visaCase.updatedAt = now

  return {
    case: visaCase,
    review,
  }
}

export function getApprovalSubmissionPreview(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  return {
    caseId: visaCase.caseId,
    clientId: visaCase.clientId,
  }
}

export function submitForApproval(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const now = new Date().toISOString()
  visaCase.clientVisibleStatus = ClientVisibleStatus.UNDER_REVIEW
  visaCase.approvalSubmittedAt = now
  visaCase.updatedAt = now
  return visaCase
}

export function recordApprovalDecision(caseId, tenantId, actorId, reasonCode = 'PHASE4_APPROVAL_APPROVED', approvalId = crypto.randomUUID()) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const now = new Date().toISOString()
  const approval = {
    approvalId,
    caseId: visaCase.caseId,
    tenantId,
    actorId,
    approvalStatus: ApprovalStatus.APPROVED,
    reasonCode,
    createdAt: now,
    updatedAt: now,
    decidedAt: now,
  }

  approvals.push(approval)
  visaCase.caseStatus = CaseStatus.READY_FOR_NEXT_STEP
  visaCase.clientVisibleStatus = ClientVisibleStatus.READY_FOR_NEXT_STEP
  visaCase.updatedAt = now

  return {
    case: visaCase,
    approval,
  }
}

export function getCaseClosurePreview(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  return {
    caseId: visaCase.caseId,
    clientId: visaCase.clientId,
  }
}

export function closeCase(caseId, tenantId) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const now = new Date().toISOString()
  visaCase.caseStatus = CaseStatus.CLOSED
  visaCase.clientVisibleStatus = ClientVisibleStatus.CLOSED
  visaCase.updatedAt = now
  return visaCase
}

export function rejectApprovalDecision(caseId, tenantId, actorId, reasonCode = 'PHASE4_APPROVAL_REJECTED', approvalId = crypto.randomUUID()) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const now = new Date().toISOString()
  const approval = {
    approvalId,
    caseId: visaCase.caseId,
    tenantId,
    actorId,
    approvalStatus: ApprovalStatus.REJECTED,
    reasonCode,
    createdAt: now,
    updatedAt: now,
    decidedAt: now,
  }

  approvals.push(approval)
  visaCase.caseStatus = CaseStatus.INTERNAL_PROCESSING
  visaCase.clientVisibleStatus = ClientVisibleStatus.PROCESSING
  visaCase.approvalSubmittedAt = null
  visaCase.updatedAt = now

  return {
    case: visaCase,
    approval,
  }
}

export function createMaterialSlotsForCase({ caseId, tenantId }) {
  const template = [
    { slotCode: 'passport', label: 'Passport', required: true },
    { slotCode: 'photo', label: 'Photo', required: true },
    { slotCode: 'bank_statement', label: 'Bank Statement', required: false },
  ]

  const created = template.map((item) => ({
    materialSlotId: crypto.randomUUID(),
    caseId,
    tenantId,
    slotCode: item.slotCode,
    label: item.label,
    required: item.required,
    status: MaterialSlotStatus.WAITING_UPLOAD,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  materialSlots.push(...created)
  return created
}

export function listMaterialSlotsByCase(caseId, tenantId) {
  return materialSlots.filter((item) => item.caseId === caseId && item.tenantId === tenantId)
}

export function findMaterialSlotById(materialSlotId, tenantId) {
  return materialSlots.find((item) => item.materialSlotId === materialSlotId && item.tenantId === tenantId) || null
}

export function updateMaterialSlotStatus(materialSlotId, tenantId, status) {
  const slot = findMaterialSlotById(materialSlotId, tenantId)
  if (!slot) return null

  slot.status = status
  slot.updatedAt = new Date().toISOString()
  return slot
}

export function issueClientAccessToken({ tenantId, caseId, clientId, actorId, expiresInHours = 24, clientAccessTokenId = crypto.randomUUID(), token = crypto.randomUUID() }) {
  const now = new Date()
  const record = {
    clientAccessTokenId,
    tenantId,
    caseId,
    clientId,
    actorId,
    token,
    status: 'issued',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString(),
    openedAt: null,
    revokedAt: null,
  }

  clientAccessTokens.push(record)
  return record
}

export function listClientAccessTokensByTenant(tenantId) {
  return clientAccessTokens.filter((item) => item.tenantId === tenantId)
}

export function findClientAccessTokenByValue(token) {
  return clientAccessTokens.find((item) => item.token === token) || null
}

export function markClientAccessTokenOpened(token) {
  const record = findClientAccessTokenByValue(token)
  if (!record) return null

  if (!record.openedAt) {
    record.openedAt = new Date().toISOString()
  }
  record.updatedAt = new Date().toISOString()
  return record
}

export function revokeClientAccessToken(token) {
  const record = findClientAccessTokenByValue(token)
  if (!record) return null

  record.status = 'revoked'
  record.revokedAt = new Date().toISOString()
  record.updatedAt = new Date().toISOString()
  return record
}
