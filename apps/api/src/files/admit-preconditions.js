import { DocumentVersionStatus, ErrorCode, ScanStatus, ValidationStatus } from '../../../../packages/shared-types/src/index.js'

export function checkDocumentAdmissionPreconditions(rawFileObject) {
  if (!rawFileObject) {
    return {
      ok: false,
      error: {
        code: ErrorCode.DOCUMENT_VERSION_REJECTED,
        message: 'Raw file object not found',
      },
    }
  }

  if (rawFileObject.documentVersionStatus !== DocumentVersionStatus.PENDING_ADMISSION) {
    return {
      ok: false,
      error: {
        code: ErrorCode.DOCUMENT_VERSION_ALREADY_ADMITTED,
        message: 'Raw file object has already been admitted',
      },
    }
  }

  if (rawFileObject.validationStatus !== ValidationStatus.PASSED) {
    return {
      ok: false,
      error: {
        code: ErrorCode.FILE_VALIDATION_FAILED,
        message: 'File validation must pass before admission',
      },
    }
  }

  if (rawFileObject.scanStatus !== ScanStatus.PASSED) {
    return {
      ok: false,
      error: {
        code: ErrorCode.FILE_SCAN_FAILED,
        message: 'File scan must pass before admission',
      },
    }
  }

  return { ok: true }
}
