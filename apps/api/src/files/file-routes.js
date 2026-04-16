import { AuditActionCode } from '../../../../packages/shared-audit/src/index.js'
import { MaterialSlotStatus, ScanStatus, ValidationStatus } from '../../../../packages/shared-types/src/index.js'
import { buildAuditContext } from '../audit/audit-context.js'
import { enforceAuditWritePolicy } from '../audit/audit-guards.js'
import { writeAuditRecord } from '../audit/audit-service.js'
import { updateMaterialSlotStatus } from '../domain/entity-store.js'
import { checkDocumentAdmissionPreconditions } from './admit-preconditions.js'
import { createDocumentVersionFromRawFile, createRawFileObject, findRawFileObject, listDocumentVersions, listRawFileObjects, updateRawFileStatuses } from './raw-file-store.js'
import { validateUploadSlotScope } from './slot-scope.js'

function resolveValidationStatus(status) {
  if (status === ValidationStatus.PASSED || status === ValidationStatus.FAILED) {
    return status
  }

  return null
}

function resolveScanStatus(status) {
  if (status === ScanStatus.PASSED || status === ScanStatus.FAILED) {
    return status
  }

  return null
}

export function handleFileRoutes(req, res, context, sendJson) {
  if (req.url === '/files/raw' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const materialSlotId = req.headers['x-material-slot-id']

    const slotScope = validateUploadSlotScope({
      tenantId: context.tenantId,
      caseId,
      materialSlotId,
    })

    if (!slotScope.ok) {
      return sendJson(res, slotScope.error.status, {
        code: slotScope.error.code,
        message: slotScope.error.message,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const record = createRawFileObject({
      tenantId: context.tenantId,
      actorId: context.actorId,
      caseId,
      materialSlotId,
      originalFileName: req.headers['x-file-name'] || 'demo.pdf',
    })
    const slot = updateMaterialSlotStatus(materialSlotId, context.tenantId, MaterialSlotStatus.UPLOADED)

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.FILE_UPLOAD_RECEIVED,
      targetId: record.rawFileObjectId,
      caseId: record.caseId,
      reasonCode: 'PHASE2_SLOT_BOUND_RAW_FILE_UPLOAD',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId, auditContext.value)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    return sendJson(res, 201, {
      requestId: context.requestId,
      rawFileObject: record,
      audit: auditWriteResult.value,
      slot,
    })
  }

  if (req.url === '/files/raw' && req.method === 'GET') {
    return sendJson(res, 200, {
      requestId: context.requestId,
      items: listRawFileObjects(context.tenantId),
    })
  }

  if (req.url === '/files/raw/validation-result' && req.method === 'POST') {
    const rawFileObjectId = req.headers['x-raw-file-object-id']
    const validationStatus = resolveValidationStatus(req.headers['x-validation-status'])

    if (!validationStatus) {
      return sendJson(res, 400, {
        code: 'INVALID_VALIDATION_STATUS',
        message: 'Validation status must be passed or failed',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const updated = updateRawFileStatuses(rawFileObjectId, context.tenantId, {
      validationStatus,
      validationReasonCode: req.headers['x-validation-reason-code'] || null,
      validationUpdatedAt: new Date().toISOString(),
    })

    if (!updated) {
      return sendJson(res, 404, {
        code: 'RAW_FILE_NOT_FOUND',
        message: 'Raw file object not found',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const slot = validationStatus === ValidationStatus.FAILED
      ? updateMaterialSlotStatus(updated.materialSlotId, context.tenantId, MaterialSlotStatus.REJECTED)
      : null

    return sendJson(res, 200, {
      requestId: context.requestId,
      rawFileObject: updated,
      slot,
    })
  }

  if (req.url === '/files/raw/scan-result' && req.method === 'POST') {
    const rawFileObjectId = req.headers['x-raw-file-object-id']
    const scanStatus = resolveScanStatus(req.headers['x-scan-status'])

    if (!scanStatus) {
      return sendJson(res, 400, {
        code: 'INVALID_SCAN_STATUS',
        message: 'Scan status must be passed or failed',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const updated = updateRawFileStatuses(rawFileObjectId, context.tenantId, {
      scanStatus,
      scanReasonCode: req.headers['x-scan-reason-code'] || null,
      scanUpdatedAt: new Date().toISOString(),
    })

    if (!updated) {
      return sendJson(res, 404, {
        code: 'RAW_FILE_NOT_FOUND',
        message: 'Raw file object not found',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const slot = scanStatus === ScanStatus.FAILED
      ? updateMaterialSlotStatus(updated.materialSlotId, context.tenantId, MaterialSlotStatus.REJECTED)
      : null

    return sendJson(res, 200, {
      requestId: context.requestId,
      rawFileObject: updated,
      slot,
    })
  }

  if (req.url === '/files/admit-check' && req.method === 'GET') {
    const rawFileObjectId = req.headers['x-raw-file-object-id']
    const rawFileObject = findRawFileObject(rawFileObjectId, context.tenantId)
    const result = checkDocumentAdmissionPreconditions(rawFileObject)

    if (!result.ok) {
      return sendJson(res, 409, {
        ...result.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    return sendJson(res, 200, {
      requestId: context.requestId,
      admissible: true,
      rawFileObjectId,
    })
  }

  if (req.url === '/files/document-versions' && req.method === 'GET') {
    return sendJson(res, 200, {
      requestId: context.requestId,
      items: listDocumentVersions(context.tenantId),
    })
  }

  if (req.url === '/files/admit' && req.method === 'POST') {
    const rawFileObjectId = req.headers['x-raw-file-object-id']
    const rawFileObject = findRawFileObject(rawFileObjectId, context.tenantId)
    const result = checkDocumentAdmissionPreconditions(rawFileObject)

    if (!result.ok) {
      return sendJson(res, 409, {
        ...result.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const documentVersion = createDocumentVersionFromRawFile(rawFileObject, context.actorId)
    const slot = updateMaterialSlotStatus(rawFileObject.materialSlotId, context.tenantId, MaterialSlotStatus.ACCEPTED)
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.DOCUMENT_VERSION_ADMITTED,
      targetId: documentVersion.documentVersionId,
      caseId: documentVersion.caseId,
      reasonCode: 'PHASE2_DOCUMENT_VERSION_ADMISSION',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId, auditContext.value)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    return sendJson(res, 201, {
      requestId: context.requestId,
      rawFileObject: findRawFileObject(rawFileObjectId),
      documentVersion,
      audit: auditWriteResult.value,
      slot,
    })
  }

  return false
}
