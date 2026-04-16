import { CaseStatus, ErrorCode } from '../../../../packages/shared-types/src/index.js'

export const CaseTransitionMatrix = Object.freeze({
  [CaseStatus.DRAFT]: [CaseStatus.INTAKE_IN_PROGRESS],
  [CaseStatus.INTAKE_IN_PROGRESS]: [CaseStatus.AWAITING_CLIENT],
  [CaseStatus.AWAITING_CLIENT]: [CaseStatus.INTERNAL_PROCESSING],
  [CaseStatus.INTERNAL_PROCESSING]: [CaseStatus.REVIEW_IN_PROGRESS],
  [CaseStatus.REVIEW_IN_PROGRESS]: [CaseStatus.AWAITING_CLIENT, CaseStatus.APPROVAL_IN_PROGRESS],
  [CaseStatus.APPROVAL_IN_PROGRESS]: [CaseStatus.INTERNAL_PROCESSING, CaseStatus.READY_FOR_NEXT_STEP],
  [CaseStatus.READY_FOR_NEXT_STEP]: [CaseStatus.CLOSED],
  [CaseStatus.CLOSED]: [],
})

function missingCase() {
  return {
    ok: false,
    error: {
      code: 'CASE_NOT_FOUND',
      message: 'Case not found',
    },
  }
}

function invalidTransition(message, code = ErrorCode.CASE_INVALID_TRANSITION) {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  }
}

export function canTransitionCase(visaCase, nextStatus, message, code = ErrorCode.CASE_INVALID_TRANSITION) {
  if (!visaCase) {
    return missingCase()
  }

  const allowed = CaseTransitionMatrix[visaCase.caseStatus] || []
  if (!allowed.includes(nextStatus)) {
    return invalidTransition(message, code)
  }

  return { ok: true }
}

export function canStartIntake(visaCase) {
  return canTransitionCase(visaCase, CaseStatus.INTAKE_IN_PROGRESS, 'Only draft cases can start intake')
}

export function canSendSupplementRequest(visaCase) {
  return canTransitionCase(visaCase, CaseStatus.AWAITING_CLIENT, 'Only intake-in-progress cases can send supplement requests')
}

export function canReturnToInternalProcessing(visaCase) {
  return canTransitionCase(visaCase, CaseStatus.INTERNAL_PROCESSING, 'Only awaiting-client cases can return to internal processing')
}

export function canSubmitForReview(visaCase) {
  return canTransitionCase(visaCase, CaseStatus.REVIEW_IN_PROGRESS, 'Only internal-processing cases can be submitted for review')
}

export function canRecordReviewDecision(visaCase) {
  return canTransitionCase(visaCase, CaseStatus.APPROVAL_IN_PROGRESS, 'Only review-in-progress cases can record review decisions', ErrorCode.REVIEW_PRECONDITION_FAILED)
}

export function canSubmitForApproval(visaCase) {
  const transition = canTransitionCase(visaCase, CaseStatus.READY_FOR_NEXT_STEP, 'Only approval-in-progress cases can be submitted for approval')
  if (!transition.ok) {
    return transition
  }

  if (visaCase.approvalSubmittedAt) {
    return invalidTransition('Case has already been submitted for approval')
  }

  return { ok: true }
}

export function canRecordApprovalDecision(visaCase) {
  const transition = canTransitionCase(visaCase, CaseStatus.READY_FOR_NEXT_STEP, 'Only approval-in-progress cases can record approval decisions')
  if (!transition.ok) {
    return transition
  }

  if (!visaCase.approvalSubmittedAt) {
    return invalidTransition('Approval decision requires a submitted approval package', ErrorCode.REVIEW_PRECONDITION_FAILED)
  }

  return { ok: true }
}

export function canReturnReviewDecision(visaCase) {
  return canRecordReviewDecision(visaCase)
}

export function canCloseCase(visaCase) {
  return canTransitionCase(visaCase, CaseStatus.CLOSED, 'Only ready-for-next-step cases can be closed')
}

export function canRejectApprovalDecision(visaCase) {
  return canRecordApprovalDecision(visaCase)
}
