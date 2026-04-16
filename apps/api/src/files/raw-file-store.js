import crypto from 'node:crypto'
import { DocumentVersionStatus, ScanStatus, ValidationStatus } from '../../../../packages/shared-types/src/index.js'

const rawFileObjects = []
const documentVersions = []

export function createRawFileObject({ tenantId, actorId, caseId, materialSlotId, originalFileName }) {
  const now = new Date().toISOString()
  const record = {
    rawFileObjectId: crypto.randomUUID(),
    tenantId,
    actorId,
    caseId,
    materialSlotId,
    originalFileName,
    validationStatus: ValidationStatus.PENDING,
    validationReasonCode: null,
    validationUpdatedAt: null,
    scanStatus: ScanStatus.PENDING,
    scanReasonCode: null,
    scanUpdatedAt: null,
    documentVersionStatus: DocumentVersionStatus.PENDING_ADMISSION,
    createdAt: now,
    updatedAt: now,
  }

  rawFileObjects.push(record)
  return record
}

export function listRawFileObjects(tenantId = null) {
  return rawFileObjects.filter((item) => !tenantId || item.tenantId === tenantId)
}

export function findRawFileObject(rawFileObjectId, tenantId = null) {
  return rawFileObjects.find((item) => item.rawFileObjectId === rawFileObjectId && (!tenantId || item.tenantId === tenantId)) || null
}

export function updateRawFileStatuses(rawFileObjectId, tenantId, patch) {
  const record = findRawFileObject(rawFileObjectId, tenantId)
  if (!record) return null

  Object.assign(record, patch, {
    updatedAt: new Date().toISOString(),
  })
  return record
}

export function listDocumentVersions(tenantId = null) {
  return documentVersions.filter((item) => !tenantId || item.tenantId === tenantId)
}

export function createDocumentVersionFromRawFile(rawFileObject, actorId) {
  const now = new Date().toISOString()
  const record = {
    documentVersionId: crypto.randomUUID(),
    tenantId: rawFileObject.tenantId,
    caseId: rawFileObject.caseId,
    materialSlotId: rawFileObject.materialSlotId,
    rawFileObjectId: rawFileObject.rawFileObjectId,
    actorId,
    originalFileName: rawFileObject.originalFileName,
    documentVersionStatus: DocumentVersionStatus.ADMITTED,
    createdAt: now,
    updatedAt: now,
  }

  documentVersions.push(record)
  updateRawFileStatuses(rawFileObject.rawFileObjectId, {
    documentVersionStatus: DocumentVersionStatus.ADMITTED,
  })
  return record
}
