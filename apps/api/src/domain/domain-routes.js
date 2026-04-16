import crypto from 'node:crypto'
import { AuditActionCode } from '../../../../packages/shared-audit/src/index.js'
import { MaterialSlotStatus } from '../../../../packages/shared-types/src/index.js'
import { buildAuditContext } from '../audit/audit-context.js'
import { enforceAuditWritePolicy } from '../audit/audit-guards.js'
import { writeAuditRecord } from '../audit/audit-service.js'
import { createRawFileObject } from '../files/raw-file-store.js'
import { validateUploadSlotScope } from '../files/slot-scope.js'
import {
  closeCase,
  createBeneficiary,
  createClient,
  rejectApprovalDecision,
  assignCaseOwner,
  createMaterialSlotsForCase,
  createVisaCase,
  findBeneficiaryById,
  findCaseById,
  findClientAccessTokenByValue,
  findClientById,
  issueClientAccessToken,
  listApprovalsByCase,
  listApprovalsByTenant,
  listBeneficiariesByTenant,
  listCasesByTenant,
  listClientAccessTokensByTenant,
  listClientsByTenant,
  listMaterialSlotsByCase,
  listReviewsByCase,
  listReviewsByTenant,
  markClientAccessTokenOpened,
  recordApprovalDecision,
  recordReviewDecision,
  rejectReviewDecision,
  returnToInternalProcessing,
  revokeClientAccessToken,
  sendSupplementRequest,
  startIntake,
  getApprovalSubmissionPreview,
  getCaseClosurePreview,
  getReviewSubmissionPreview,
  submitForApproval,
  submitForReview,
  updateMaterialSlotStatus,
} from './entity-store.js'
import {
  canCloseCase,
  canRecordApprovalDecision,
  canRejectApprovalDecision,
  canRecordReviewDecision,
  canReturnReviewDecision,
  canReturnToInternalProcessing,
  canSendSupplementRequest,
  canStartIntake,
  canSubmitForApproval,
  canSubmitForReview,
} from './transition-service.js'

export function handleDomainRoutes(req, res, context, sendJson) {
  if (req.url === '/clients' && req.method === 'POST') {
    const preview = {
      clientId: crypto.randomUUID(),
      fullName: req.headers['x-client-name'] || 'Demo Client',
      email: req.headers['x-client-email'] || 'demo.client@example.com',
      phone: req.headers['x-client-phone'] || null,
    }
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CLIENT_CREATED,
      targetId: preview.clientId,
      clientId: preview.clientId,
      reasonCode: 'PHASE2_CLIENT_CREATED',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const client = createClient({
      tenantId: context.tenantId,
      clientId: preview.clientId,
      fullName: preview.fullName,
      email: preview.email,
      phone: preview.phone,
    })

    return sendJson(res, 201, {
      requestId: context.requestId,
      client,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/clients' && req.method === 'GET') {
    return sendJson(res, 200, {
      requestId: context.requestId,
      items: listClientsByTenant(context.tenantId),
    })
  }

  if (req.url === '/beneficiaries' && req.method === 'POST') {
    const preview = {
      beneficiaryId: crypto.randomUUID(),
      fullName: req.headers['x-beneficiary-name'] || 'Demo Beneficiary',
      passportNumber: req.headers['x-passport-number'] || 'P12345678',
      nationality: req.headers['x-nationality'] || 'CN',
    }
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.BENEFICIARY_CREATED,
      targetId: preview.beneficiaryId,
      reasonCode: 'PHASE2_BENEFICIARY_CREATED',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const beneficiary = createBeneficiary({
      tenantId: context.tenantId,
      beneficiaryId: preview.beneficiaryId,
      fullName: preview.fullName,
      passportNumber: preview.passportNumber,
      nationality: preview.nationality,
    })

    return sendJson(res, 201, {
      requestId: context.requestId,
      beneficiary,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/beneficiaries' && req.method === 'GET') {
    return sendJson(res, 200, {
      requestId: context.requestId,
      items: listBeneficiariesByTenant(context.tenantId),
    })
  }

  if (req.url === '/cases' && req.method === 'POST') {
    const clientId = req.headers['x-client-id']
    const beneficiaryId = req.headers['x-beneficiary-id']

    const client = findClientById(clientId, context.tenantId)
    const beneficiary = findBeneficiaryById(beneficiaryId, context.tenantId)

    if (!client || !beneficiary) {
      return sendJson(res, 400, {
        code: 'CASE_DEPENDENCY_MISSING',
        message: 'clientId and beneficiaryId must exist inside the current tenant',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = {
      caseId: crypto.randomUUID(),
      clientId,
    }
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_CREATED,
      targetId: preview.caseId,
      caseId: preview.caseId,
      clientId: preview.clientId,
      reasonCode: 'PHASE2_CASE_CREATED',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const visaCase = createVisaCase({
      tenantId: context.tenantId,
      clientId,
      beneficiaryId,
      visaType: req.headers['x-visa-type'] || 'tourist',
      countryCode: req.headers['x-country-code'] || 'US',
      caseId: preview.caseId,
    })

    return sendJson(res, 201, {
      requestId: context.requestId,
      case: visaCase,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/cases' && req.method === 'GET') {
    return sendJson(res, 200, {
      requestId: context.requestId,
      items: listCasesByTenant(context.tenantId),
    })
  }

  if (req.url === '/reviews' && req.method === 'GET') {
    const caseId = req.headers['x-case-id']
    const items = caseId
      ? listReviewsByCase(caseId, context.tenantId)
      : listReviewsByTenant(context.tenantId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      items,
    })
  }

  if (req.url === '/approvals' && req.method === 'GET') {
    const caseId = req.headers['x-case-id']
    const items = caseId
      ? listApprovalsByCase(caseId, context.tenantId)
      : listApprovalsByTenant(context.tenantId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      items,
    })
  }

  if (req.url === '/ops/workbench' && req.method === 'GET') {
    const caseId = req.headers['x-case-id']
    const cases = caseId
      ? [findCaseById(caseId, context.tenantId)].filter(Boolean)
      : listCasesByTenant(context.tenantId)
    const clientAccessTokens = listClientAccessTokensByTenant(context.tenantId)
    const items = cases.map((visaCase) => ({
      case: visaCase,
      client: findClientById(visaCase.clientId, context.tenantId),
      beneficiary: findBeneficiaryById(visaCase.beneficiaryId, context.tenantId),
      materialSlots: listMaterialSlotsByCase(visaCase.caseId, context.tenantId),
      reviews: listReviewsByCase(visaCase.caseId, context.tenantId),
      approvals: listApprovalsByCase(visaCase.caseId, context.tenantId),
      clientAccessTokens: clientAccessTokens.filter((item) => item.caseId === visaCase.caseId),
    }))

    return sendJson(res, 200, {
      requestId: context.requestId,
      summary: {
        caseCount: items.length,
        reviewCount: items.reduce((total, item) => total + item.reviews.length, 0),
        approvalCount: items.reduce((total, item) => total + item.approvals.length, 0),
        clientAccessTokenCount: items.reduce((total, item) => total + item.clientAccessTokens.length, 0),
      },
      items,
    })
  }

  if (req.url === '/ops/queue' && req.method === 'GET') {
    const ownerScope = req.headers['x-owner-scope'] || 'all'
    const riskLevel = req.headers['x-risk-level']
    const caseStatus = req.headers['x-case-status']
    const items = listCasesByTenant(context.tenantId).filter((visaCase) => {
      if (ownerScope === 'mine' && visaCase.ownerId !== context.actorId) return false
      if (ownerScope === 'team' && !visaCase.ownerId) return false
      if (riskLevel && visaCase.riskLevel !== riskLevel) return false
      if (caseStatus && visaCase.caseStatus !== caseStatus) return false
      return true
    })

    return sendJson(res, 200, {
      requestId: context.requestId,
      filters: {
        ownerScope,
        riskLevel: riskLevel || null,
        caseStatus: caseStatus || null,
      },
      items,
    })
  }

  if (req.url === '/ops/assign' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const ownerId = req.headers['x-owner-id'] || context.actorId
    const visaCase = assignCaseOwner(caseId, context.tenantId, ownerId)

    if (!visaCase) {
      return sendJson(res, 404, {
        code: 'CASE_NOT_FOUND',
        message: 'Case not found in current tenant',
        request_id: context.requestId,
        retryable: false,
      })
    }

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: visaCase,
    })
  }

  if (req.url === '/ops/dashboard' && req.method === 'GET') {
    const items = listCasesByTenant(context.tenantId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      summary: {
        totalCases: items.length,
        unassignedCases: items.filter((item) => !item.ownerId).length,
        assignedCases: items.filter((item) => item.ownerId).length,
        awaitingClientCases: items.filter((item) => item.caseStatus === 'awaiting_client').length,
        internalProcessingCases: items.filter((item) => item.caseStatus === 'internal_processing').length,
        reviewInProgressCases: items.filter((item) => item.caseStatus === 'review_in_progress').length,
        approvalInProgressCases: items.filter((item) => item.caseStatus === 'approval_in_progress').length,
        readyForNextStepCases: items.filter((item) => item.caseStatus === 'ready_for_next_step').length,
        closedCases: items.filter((item) => item.caseStatus === 'closed').length,
        lowRiskCases: items.filter((item) => item.riskLevel === 'low').length,
        mediumRiskCases: items.filter((item) => item.riskLevel === 'medium').length,
        highRiskCases: items.filter((item) => item.riskLevel === 'high').length,
      },
      items,
    })
  }

  if (req.url === '/cases/detail' && req.method === 'GET') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)

    if (!visaCase) {
      return sendJson(res, 404, {
        code: 'CASE_NOT_FOUND',
        message: 'Case not found in current tenant',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const client = findClientById(visaCase.clientId, context.tenantId)
    const beneficiary = findBeneficiaryById(visaCase.beneficiaryId, context.tenantId)
    const materialSlots = listMaterialSlotsByCase(caseId, context.tenantId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: visaCase,
      client,
      beneficiary,
      materialSlots,
    })
  }

  if (req.url === '/client-access-tokens' && req.method === 'GET') {
    return sendJson(res, 200, {
      requestId: context.requestId,
      items: listClientAccessTokensByTenant(context.tenantId),
    })
  }

  if (req.url === '/client-access-tokens' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)

    if (!visaCase) {
      return sendJson(res, 404, {
        code: 'CASE_NOT_FOUND',
        message: 'Case not found in current tenant',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = {
      clientAccessTokenId: crypto.randomUUID(),
      token: crypto.randomUUID(),
    }
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CLIENT_TOKEN_ISSUED,
      targetId: preview.clientAccessTokenId,
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
      reasonCode: 'PHASE3_CLIENT_ACCESS_TOKEN_ISSUED',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const tokenRecord = issueClientAccessToken({
      tenantId: context.tenantId,
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
      actorId: context.actorId,
      clientAccessTokenId: preview.clientAccessTokenId,
      token: preview.token,
    })

    return sendJson(res, 201, {
      requestId: context.requestId,
      clientAccessToken: tokenRecord,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/client-access/open' && req.method === 'POST') {
    const token = req.headers['x-client-access-token']
    const tokenRecord = findClientAccessTokenByValue(token)

    if (!tokenRecord) {
      return sendJson(res, 404, {
        code: 'CLIENT_LINK_INVALID',
        message: 'Client access link is invalid',
        request_id: context.requestId,
        retryable: false,
      })
    }

    if (tokenRecord.status === 'revoked') {
      return sendJson(res, 409, {
        code: 'CLIENT_LINK_REVOKED',
        message: 'Client access link has been revoked',
        request_id: context.requestId,
        retryable: false,
      })
    }

    if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      return sendJson(res, 409, {
        code: 'CLIENT_LINK_EXPIRED',
        message: 'Client access link has expired',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditContext = buildAuditContext({
      requestContext: {
        ...context,
        tenantId: tokenRecord.tenantId,
        actorId: tokenRecord.clientId,
        actorRole: 'client',
      },
      actionCode: AuditActionCode.CLIENT_LINK_OPEN,
      targetId: tokenRecord.clientAccessTokenId,
      caseId: tokenRecord.caseId,
      clientId: tokenRecord.clientId,
      reasonCode: 'PHASE3_CLIENT_LINK_OPEN',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const openedToken = markClientAccessTokenOpened(token)

    return sendJson(res, 200, {
      requestId: context.requestId,
      clientAccessToken: {
        clientAccessTokenId: openedToken.clientAccessTokenId,
        caseId: openedToken.caseId,
        clientId: openedToken.clientId,
        status: openedToken.status,
        expiresAt: openedToken.expiresAt,
        openedAt: openedToken.openedAt,
        revokedAt: openedToken.revokedAt,
      },
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/client-access/revoke' && req.method === 'POST') {
    const token = req.headers['x-client-access-token']
    const tokenRecord = findClientAccessTokenByValue(token)

    if (!tokenRecord || tokenRecord.tenantId !== context.tenantId) {
      return sendJson(res, 404, {
        code: 'CLIENT_LINK_INVALID',
        message: 'Client access link is invalid',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CLIENT_LINK_REVOKED,
      targetId: tokenRecord.clientAccessTokenId,
      caseId: tokenRecord.caseId,
      clientId: tokenRecord.clientId,
      reasonCode: 'PHASE3_CLIENT_LINK_REVOKED',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const revokedToken = revokeClientAccessToken(token)

    return sendJson(res, 200, {
      requestId: context.requestId,
      clientAccessToken: revokedToken,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/client-portal/summary' && req.method === 'GET') {
    const token = req.headers['x-client-access-token']
    const tokenRecord = findClientAccessTokenByValue(token)

    if (!tokenRecord) {
      return sendJson(res, 404, {
        code: 'CLIENT_LINK_INVALID',
        message: 'Client access link is invalid',
        request_id: context.requestId,
        retryable: false,
      })
    }

    if (tokenRecord.status === 'revoked') {
      return sendJson(res, 409, {
        code: 'CLIENT_LINK_REVOKED',
        message: 'Client access link has been revoked',
        request_id: context.requestId,
        retryable: false,
      })
    }

    if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      return sendJson(res, 409, {
        code: 'CLIENT_LINK_EXPIRED',
        message: 'Client access link has expired',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const visaCase = findCaseById(tokenRecord.caseId, tokenRecord.tenantId)
    const client = findClientById(tokenRecord.clientId, tokenRecord.tenantId)
    const beneficiary = visaCase
      ? findBeneficiaryById(visaCase.beneficiaryId, tokenRecord.tenantId)
      : null
    const materialSlots = visaCase
      ? listMaterialSlotsByCase(visaCase.caseId, tokenRecord.tenantId)
      : []

    if (!visaCase || !client || !beneficiary) {
      return sendJson(res, 404, {
        code: 'CLIENT_LINK_INVALID',
        message: 'Client access link no longer resolves to a valid portal view',
        request_id: context.requestId,
        retryable: false,
      })
    }

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: visaCase,
      client,
      beneficiary,
      materialSlots,
      clientAccessToken: {
        clientAccessTokenId: tokenRecord.clientAccessTokenId,
        caseId: tokenRecord.caseId,
        clientId: tokenRecord.clientId,
        status: tokenRecord.status,
        expiresAt: tokenRecord.expiresAt,
        openedAt: tokenRecord.openedAt,
        revokedAt: tokenRecord.revokedAt,
      },
    })
  }

  if (req.url === '/client-portal/upload' && req.method === 'POST') {
    const token = req.headers['x-client-access-token']
    const materialSlotId = req.headers['x-material-slot-id']
    const tokenRecord = findClientAccessTokenByValue(token)

    if (!tokenRecord) {
      return sendJson(res, 404, {
        code: 'CLIENT_LINK_INVALID',
        message: 'Client access link is invalid',
        request_id: context.requestId,
        retryable: false,
      })
    }

    if (tokenRecord.status === 'revoked') {
      return sendJson(res, 409, {
        code: 'CLIENT_LINK_REVOKED',
        message: 'Client access link has been revoked',
        request_id: context.requestId,
        retryable: false,
      })
    }

    if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      return sendJson(res, 409, {
        code: 'CLIENT_LINK_EXPIRED',
        message: 'Client access link has expired',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const slotScope = validateUploadSlotScope({
      tenantId: tokenRecord.tenantId,
      caseId: tokenRecord.caseId,
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

    const rawFileObject = createRawFileObject({
      tenantId: tokenRecord.tenantId,
      actorId: tokenRecord.clientId,
      caseId: tokenRecord.caseId,
      materialSlotId,
      originalFileName: req.headers['x-file-name'] || 'client-upload.pdf',
    })
    const slot = updateMaterialSlotStatus(materialSlotId, tokenRecord.tenantId, MaterialSlotStatus.UPLOADED)

    return sendJson(res, 201, {
      requestId: context.requestId,
      rawFileObject,
      slot,
      clientAccessToken: {
        clientAccessTokenId: tokenRecord.clientAccessTokenId,
        caseId: tokenRecord.caseId,
        clientId: tokenRecord.clientId,
        status: tokenRecord.status,
        expiresAt: tokenRecord.expiresAt,
        openedAt: tokenRecord.openedAt,
        revokedAt: tokenRecord.revokedAt,
      },
    })
  }

  if (req.url === '/client-portal/submit' && req.method === 'POST') {
    const token = req.headers['x-client-access-token']
    const tokenRecord = findClientAccessTokenByValue(token)

    if (!tokenRecord) {
      return sendJson(res, 404, {
        code: 'CLIENT_LINK_INVALID',
        message: 'Client access link is invalid',
        request_id: context.requestId,
        retryable: false,
      })
    }

    if (tokenRecord.status === 'revoked') {
      return sendJson(res, 409, {
        code: 'CLIENT_LINK_REVOKED',
        message: 'Client access link has been revoked',
        request_id: context.requestId,
        retryable: false,
      })
    }

    if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      return sendJson(res, 409, {
        code: 'CLIENT_LINK_EXPIRED',
        message: 'Client access link has expired',
        request_id: context.requestId,
        retryable: false,
      })
    }

    const visaCase = findCaseById(tokenRecord.caseId, tokenRecord.tenantId)
    const precheck = canReturnToInternalProcessing(visaCase)
    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const updatedCase = returnToInternalProcessing(tokenRecord.caseId, tokenRecord.tenantId)
    const auditContext = buildAuditContext({
      requestContext: {
        ...context,
        tenantId: tokenRecord.tenantId,
        actorId: tokenRecord.clientId,
        actorRole: 'client',
      },
      actionCode: AuditActionCode.CLIENT_SUPPLEMENT_SUBMITTED,
      targetId: updatedCase.caseId,
      caseId: updatedCase.caseId,
      clientId: updatedCase.clientId,
      reasonCode: 'PHASE3_CLIENT_SUPPLEMENT_SUBMITTED',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: updatedCase,
      audit: auditWriteResult.value,
      clientAccessToken: {
        clientAccessTokenId: tokenRecord.clientAccessTokenId,
        caseId: tokenRecord.caseId,
        clientId: tokenRecord.clientId,
        status: tokenRecord.status,
        expiresAt: tokenRecord.expiresAt,
        openedAt: tokenRecord.openedAt,
        revokedAt: tokenRecord.revokedAt,
      },
    })
  }

  if (req.url === '/cases/start-intake' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canStartIntake(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_START_INTAKE,
      targetId: visaCase.caseId,
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
      reasonCode: 'PHASE2_START_INTAKE',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const updatedCase = startIntake(caseId, context.tenantId)
    const materialSlots = createMaterialSlotsForCase({
      caseId,
      tenantId: context.tenantId,
    })

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: updatedCase,
      materialSlots,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/cases/send-supplement-request' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canSendSupplementRequest(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_SEND_SUPPLEMENT_REQUEST,
      targetId: visaCase.caseId,
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
      reasonCode: 'PHASE2_SEND_SUPPLEMENT_REQUEST',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const updatedCase = sendSupplementRequest(caseId, context.tenantId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: updatedCase,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/cases/return-to-internal' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canReturnToInternalProcessing(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_RETURNED_TO_INTERNAL_PROCESSING,
      targetId: visaCase.caseId,
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
      reasonCode: 'PHASE4_RETURN_TO_INTERNAL_PROCESSING',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const updatedCase = returnToInternalProcessing(caseId, context.tenantId)
    return sendJson(res, 200, {
      requestId: context.requestId,
      case: updatedCase,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/cases/submit-for-review' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canSubmitForReview(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = getReviewSubmissionPreview(caseId, context.tenantId)
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_SUBMITTED_FOR_REVIEW,
      targetId: preview.caseId,
      caseId: preview.caseId,
      clientId: preview.clientId,
      reasonCode: 'PHASE4_SUBMIT_FOR_REVIEW',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const updatedCase = submitForReview(caseId, context.tenantId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: updatedCase,
      audit: auditWriteResult.value,
    })
  }

  if ((req.url === '/cases/review-decision' || req.url === '/reviews/approve') && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canRecordReviewDecision(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = {
      reviewId: crypto.randomUUID(),
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
    }
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.REVIEW_DECISION_RECORDED,
      targetId: preview.reviewId,
      caseId: preview.caseId,
      clientId: preview.clientId,
      reasonCode: 'PHASE4_REVIEW_APPROVED',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const result = recordReviewDecision(caseId, context.tenantId, context.actorId, preview.reviewId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: result.case,
      review: result.review,
      audit: auditWriteResult.value,
    })
  }

  if ((req.url === '/cases/review-returned' || req.url === '/reviews/return') && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const reasonCode = req.headers['x-reason-code'] || 'PHASE4_REVIEW_RETURNED'
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canReturnReviewDecision(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = {
      reviewId: crypto.randomUUID(),
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
    }
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.REVIEW_RETURNED,
      targetId: preview.reviewId,
      caseId: preview.caseId,
      clientId: preview.clientId,
      reasonCode,
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const result = rejectReviewDecision(caseId, context.tenantId, context.actorId, reasonCode, preview.reviewId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: result.case,
      review: result.review,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/cases/submit-for-approval' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canSubmitForApproval(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = getApprovalSubmissionPreview(caseId, context.tenantId)
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_SUBMITTED_FOR_APPROVAL,
      targetId: preview.caseId,
      caseId: preview.caseId,
      clientId: preview.clientId,
      reasonCode: 'PHASE4_SUBMIT_FOR_APPROVAL',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const updatedCase = submitForApproval(caseId, context.tenantId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: updatedCase,
      audit: auditWriteResult.value,
    })
  }

  if ((req.url === '/cases/approval-decision' || req.url === '/approvals/approve') && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const reasonCode = req.headers['x-reason-code'] || 'PHASE4_APPROVAL_APPROVED'
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canRecordApprovalDecision(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = {
      approvalId: crypto.randomUUID(),
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
    }
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.APPROVAL_DECISION_RECORDED,
      targetId: preview.approvalId,
      caseId: preview.caseId,
      clientId: preview.clientId,
      reasonCode,
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const result = recordApprovalDecision(caseId, context.tenantId, context.actorId, reasonCode, preview.approvalId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: result.case,
      approval: result.approval,
      audit: auditWriteResult.value,
    })
  }

  if (req.url === '/cases/close' && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canCloseCase(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = getCaseClosurePreview(caseId, context.tenantId)
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_CLOSED,
      targetId: preview.caseId,
      caseId: preview.caseId,
      clientId: preview.clientId,
      reasonCode: 'PHASE4_CASE_CLOSED',
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const updatedCase = closeCase(caseId, context.tenantId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: updatedCase,
      audit: auditWriteResult.value,
    })
  }

  if ((req.url === '/cases/approval-rejection' || req.url === '/approvals/reject') && req.method === 'POST') {
    const caseId = req.headers['x-case-id']
    const reasonCode = req.headers['x-reason-code'] || 'PHASE4_APPROVAL_REJECTED'
    const visaCase = findCaseById(caseId, context.tenantId)
    const precheck = canRejectApprovalDecision(visaCase)

    if (!precheck.ok) {
      return sendJson(res, precheck.error.code === 'CASE_NOT_FOUND' ? 404 : 409, {
        ...precheck.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const preview = {
      approvalId: crypto.randomUUID(),
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
    }
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.APPROVAL_REJECTION_RECORDED,
      targetId: preview.approvalId,
      caseId: preview.caseId,
      clientId: preview.clientId,
      reasonCode,
    })

    if (!auditContext.ok) {
      return sendJson(res, 500, {
        ...auditContext.error,
        request_id: context.requestId,
        retryable: false,
      })
    }

    const auditWriteResult = writeAuditRecord(auditContext.value)
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
    if (auditFailure) {
      return sendJson(res, auditFailure.status, auditFailure.body)
    }

    const result = rejectApprovalDecision(caseId, context.tenantId, context.actorId, reasonCode, preview.approvalId)

    return sendJson(res, 200, {
      requestId: context.requestId,
      case: result.case,
      approval: result.approval,
      audit: auditWriteResult.value,
    })
  }

  return false
}
