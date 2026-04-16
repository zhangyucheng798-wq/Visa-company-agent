import crypto from 'node:crypto'
import { ActionItemStatus, ApprovalStatus, BlockerType, CaseStatus, ClientVisibleStatus, MaterialSlotStatus, NotificationDeliveryStatus, ReviewStatus, RiskLevel, TaskStatus } from '../../../../packages/shared-types/src/index.js'

const clients = []
const beneficiaries = []
const cases = []
const materialSlots = []
const clientAccessTokens = []
const reviews = []
const approvals = []
const tasks = []
const actionItems = []
const notifications = []

export function listTasksByTenant(tenantId) {
  return tasks.filter((item) => item.tenantId === tenantId)
}

export function listTasksByCase(caseId, tenantId) {
  return tasks.filter((item) => item.caseId === caseId && item.tenantId === tenantId)
}

export function findTaskById(taskId, tenantId) {
  return tasks.find((item) => item.taskId === taskId && item.tenantId === tenantId) || null
}

export function listActionItemsByTenant(tenantId) {
  return actionItems.filter((item) => item.tenantId === tenantId)
}

export function listActionItemsByCase(caseId, tenantId) {
  return actionItems.filter((item) => item.caseId === caseId && item.tenantId === tenantId)
}

export function findActionItemById(actionItemId, tenantId) {
  return actionItems.find((item) => item.actionItemId === actionItemId && item.tenantId === tenantId) || null
}

export function listNotificationsByTenant(tenantId) {
  return notifications.filter((item) => item.tenantId === tenantId)
}

export function listNotificationsByCase(caseId, tenantId) {
  return notifications.filter((item) => item.caseId === caseId && item.tenantId === tenantId)
}

export function listNotificationsByType(notificationType, tenantId) {
  return notifications.filter((item) => item.notificationType === notificationType && item.tenantId === tenantId)
}

export function listNotificationsByRecipient(recipientActorId, tenantId) {
  return notifications.filter((item) => item.recipientActorId === recipientActorId && item.tenantId === tenantId)
}

export function listNotificationsByDeliveryStatus(deliveryStatus, tenantId) {
  return notifications.filter((item) => item.deliveryStatus === deliveryStatus && item.tenantId === tenantId)
}

export function listInternalNotificationsByRecipientRole(recipientRole, tenantId) {
  return notifications.filter((item) => item.recipientRole === recipientRole && item.tenantId === tenantId)
}

export function findNotificationById(notificationId, tenantId) {
  return notifications.find((item) => item.notificationId === notificationId && item.tenantId === tenantId) || null
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

export function createActionItem({
  tenantId,
  caseId,
  title,
  blockerType,
  status = ActionItemStatus.OPEN,
  convertedTaskId = null,
  actionItemId = crypto.randomUUID(),
}) {
  const now = new Date().toISOString()
  const record = {
    actionItemId,
    tenantId,
    caseId,
    title,
    blockerType,
    status,
    convertedTaskId,
    createdAt: now,
    updatedAt: now,
  }

  actionItems.push(record)
  return record
}

export function createBlockerActionItem(caseId, tenantId, blockerType) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const existing = actionItems.find(
    (item) => item.caseId === caseId && item.tenantId === tenantId && item.blockerType === blockerType && item.status === ActionItemStatus.OPEN,
  )
  if (existing) return existing

  return createActionItem({
    tenantId,
    caseId,
    blockerType,
    title: buildActionItemTitle(blockerType),
  })
}

export function convertActionItemToTask(actionItemId, tenantId, assigneeId = null) {
  const actionItem = findActionItemById(actionItemId, tenantId)
  if (!actionItem) return { error: 'ACTION_ITEM_NOT_FOUND' }
  if (actionItem.status === ActionItemStatus.CONVERTED_TO_TASK) return { error: 'ACTION_ITEM_ALREADY_CONVERTED' }
  if (actionItem.status !== ActionItemStatus.OPEN) return { error: 'ACTION_ITEM_NOT_OPEN' }

  const task = createTask({
    tenantId,
    caseId: actionItem.caseId,
    title: actionItem.title,
    assigneeId,
    status: assigneeId ? TaskStatus.ASSIGNED : TaskStatus.OPEN,
  })

  actionItem.status = ActionItemStatus.CONVERTED_TO_TASK
  actionItem.convertedTaskId = task.taskId
  actionItem.updatedAt = new Date().toISOString()

  return {
    actionItem,
    task,
  }
}

export function dispatchInternalNotification({
  tenantId,
  caseId,
  notificationType,
  recipientRole,
  recipientActorId = null,
  payload,
  notificationId = crypto.randomUUID(),
}) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) return null

  const now = new Date().toISOString()
  const record = {
    notificationId,
    tenantId,
    caseId,
    channel: 'internal',
    notificationType,
    recipientRole,
    recipientActorId,
    payload,
    deliveryStatus: NotificationDeliveryStatus.PENDING,
    deliveryAttempts: 0,
    lastAttemptAt: null,
    deliveredAt: null,
    failureReason: null,
    dispatchedAt: now,
  }

  notifications.push(record)
  return record
}

export function markNotificationDelivered(notificationId, tenantId) {
  const notification = findNotificationById(notificationId, tenantId)
  if (!notification) return null

  const retryCheck = canRetryNotificationDelivery(notification)
  if (!retryCheck.ok) return { error: retryCheck.error }

  const now = new Date().toISOString()
  notification.deliveryStatus = NotificationDeliveryStatus.SENT
  notification.deliveryAttempts += 1
  notification.lastAttemptAt = now
  notification.deliveredAt = now
  notification.failureReason = null
  return notification
}

export function markNotificationDeliveryFailed(notificationId, tenantId, failureReason) {
  const notification = findNotificationById(notificationId, tenantId)
  if (!notification) return null

  const retryCheck = canRetryNotificationDelivery(notification)
  if (!retryCheck.ok) return { error: retryCheck.error }

  const now = new Date().toISOString()
  notification.deliveryStatus = NotificationDeliveryStatus.FAILED
  notification.deliveryAttempts += 1
  notification.lastAttemptAt = now
  notification.deliveredAt = null
  notification.failureReason = failureReason
  return notification
}

export function retryNotificationDelivery(notificationId, tenantId, outcome = 'sent', failureReason = 'retry_failed') {
  const notification = findNotificationById(notificationId, tenantId)
  if (!notification) return { error: 'NOTIFICATION_NOT_FOUND' }

  const retryCheck = canRetryNotificationDelivery(notification)
  if (!retryCheck.ok) return { error: retryCheck.error }

  if (outcome === 'failed') {
    const failed = markNotificationDeliveryFailed(notificationId, tenantId, failureReason)
    if (failed?.error) return failed
    return { notification: failed }
  }

  const delivered = markNotificationDelivered(notificationId, tenantId)
  if (delivered?.error) return delivered
  return { notification: delivered }
}

export function correctNotificationDelivery(notificationId, tenantId, correction = 'mark_sent') {
  const notification = findNotificationById(notificationId, tenantId)
  if (!notification) return { error: 'NOTIFICATION_NOT_FOUND' }

  const now = new Date().toISOString()
  if (correction === 'mark_sent') {
    notification.deliveryStatus = NotificationDeliveryStatus.SENT
    notification.deliveredAt = now
    notification.lastAttemptAt = now
    notification.failureReason = null
    return { notification }
  }

  if (correction === 'reopen') {
    notification.deliveryStatus = NotificationDeliveryStatus.PENDING
    notification.deliveredAt = null
    notification.failureReason = null
    return { notification }
  }

  return { error: 'NOTIFICATION_CORRECTION_INVALID' }
}

export function reconcilePendingNotifications(tenantId = null) {
  const scoped = notifications.filter((item) => !tenantId || item.tenantId === tenantId)
  const reopened = scoped.filter((item) => item.deliveryStatus === NotificationDeliveryStatus.FAILED && item.deliveryAttempts < 3)
  const pending = scoped.filter((item) => item.deliveryStatus === NotificationDeliveryStatus.PENDING)
  const exhausted = scoped.filter((item) => item.deliveryStatus === NotificationDeliveryStatus.FAILED && item.deliveryAttempts >= 3)

  reopened.forEach((item) => {
    item.deliveryStatus = NotificationDeliveryStatus.PENDING
    item.deliveredAt = null
    item.failureReason = null
  })

  return {
    reopened,
    pending: [...pending, ...reopened],
    exhausted,
  }
}

function canRetryNotificationDelivery(notification) {
  if (notification.deliveryStatus === NotificationDeliveryStatus.SENT) {
    return { ok: false, error: 'NOTIFICATION_ALREADY_DELIVERED' }
  }
  if (notification.deliveryAttempts >= 3) {
    return { ok: false, error: 'NOTIFICATION_MAX_RETRIES_EXCEEDED' }
  }
  return { ok: true }
}

function buildActionItemTitle(blockerType) {
  if (blockerType === BlockerType.MISSING_MATERIAL) return 'Collect missing client materials'
  if (blockerType === BlockerType.REVIEW_REQUIRED) return 'Resolve review return items'
  if (blockerType === BlockerType.APPROVAL_REQUIRED) return 'Resolve approval rejection items'
  if (blockerType === BlockerType.SECURITY_HOLD) return 'Resolve security hold items'
  return 'Resolve blocker'
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
  visaCase.caseStatus = CaseStatus.APPROVAL_IN_PROGRESS
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

export function serializeClientAccessToken(record) {
  if (!record) return null

  return {
    clientAccessTokenId: record.clientAccessTokenId,
    tenantId: record.tenantId,
    caseId: record.caseId,
    clientId: record.clientId,
    actorId: record.actorId,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    expiresAt: record.expiresAt,
    openedAt: record.openedAt,
    revokedAt: record.revokedAt,
  }
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
