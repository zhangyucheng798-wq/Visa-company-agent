import { CaseStatus, ErrorCode } from '../../../../packages/shared-types/src/index.js'

export function canStartIntake(visaCase) {
  if (!visaCase) {
    return {
      ok: false,
      error: {
        code: 'CASE_NOT_FOUND',
        message: 'Case not found',
      },
    }
  }

  if (visaCase.caseStatus !== CaseStatus.DRAFT) {
    return {
      ok: false,
      error: {
        code: ErrorCode.CASE_INVALID_TRANSITION,
        message: 'Only draft cases can start intake',
      },
    }
  }

  return { ok: true }
}

export function canSendSupplementRequest(visaCase) {
  if (!visaCase) {
    return {
      ok: false,
      error: {
        code: 'CASE_NOT_FOUND',
        message: 'Case not found',
      },
    }
  }

  if (visaCase.caseStatus !== CaseStatus.INTAKE_IN_PROGRESS) {
    return {
      ok: false,
      error: {
        code: ErrorCode.CASE_INVALID_TRANSITION,
        message: 'Only intake-in-progress cases can send supplement requests',
      },
    }
  }

  return { ok: true }
}

export function canReturnToInternalProcessing(visaCase) {
  if (!visaCase) {
    return {
      ok: false,
      error: {
        code: 'CASE_NOT_FOUND',
        message: 'Case not found',
      },
    }
  }

  if (visaCase.caseStatus !== CaseStatus.AWAITING_CLIENT) {
    return {
      ok: false,
      error: {
        code: ErrorCode.CASE_INVALID_TRANSITION,
        message: 'Only awaiting-client cases can return to internal processing',
      },
    }
  }

  return { ok: true }
}
