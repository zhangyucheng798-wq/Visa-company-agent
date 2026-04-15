import crypto from 'node:crypto'
import { CaseStatus, ClientVisibleStatus, MaterialSlotStatus, RiskLevel } from '../../../../packages/shared-types/src/index.js'

const clients = []
const beneficiaries = []
const cases = []
const materialSlots = []
const clientAccessTokens = []

export function createClient({ tenantId, fullName, email, phone = null }) {
  const record = {
    clientId: crypto.randomUUID(),
    tenantId,
    fullName,
    email,
    phone,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

export function createBeneficiary({ tenantId, fullName, passportNumber, nationality }) {
  const record = {
    beneficiaryId: crypto.randomUUID(),
    tenantId,
    fullName,
    passportNumber,
    nationality,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

export function createVisaCase({ tenantId, clientId, beneficiaryId, visaType, countryCode }) {
  const now = new Date().toISOString()
  const record = {
    caseId: crypto.randomUUID(),
    tenantId,
    clientId,
    beneficiaryId,
    visaType,
    countryCode,
    caseStatus: CaseStatus.DRAFT,
    clientVisibleStatus: ClientVisibleStatus.INTAKE_STARTED,
    riskLevel: RiskLevel.LOW,
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

export function issueClientAccessToken({ tenantId, caseId, clientId, actorId, expiresInHours = 24 }) {
  const now = new Date()
  const record = {
    clientAccessTokenId: crypto.randomUUID(),
    tenantId,
    caseId,
    clientId,
    actorId,
    token: crypto.randomUUID(),
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
