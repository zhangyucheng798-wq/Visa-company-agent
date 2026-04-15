import { AuditActionCode } from '../../../../packages/shared-audit/src/index.js'
import { buildAuditContext } from '../audit/audit-context.js'
import { enforceAuditWritePolicy } from '../audit/audit-guards.js'
import { writeAuditRecord } from '../audit/audit-service.js'
import {
  createBeneficiary,
  createClient,
  createMaterialSlotsForCase,
  createVisaCase,
  findBeneficiaryById,
  findCaseById,
  findClientAccessTokenByValue,
  findClientById,
  issueClientAccessToken,
  listBeneficiariesByTenant,
  listCasesByTenant,
  listClientAccessTokensByTenant,
  listClientsByTenant,
  listMaterialSlotsByCase,
  markClientAccessTokenOpened,
  returnToInternalProcessing,
  revokeClientAccessToken,
  sendSupplementRequest,
  startIntake,
} from './entity-store.js'
import { canReturnToInternalProcessing, canSendSupplementRequest, canStartIntake } from './transition-service.js'

export function handleDomainRoutes(req, res, context, sendJson) {
  if (req.url === '/clients' && req.method === 'POST') {
    const client = createClient({
      tenantId: context.tenantId,
      fullName: req.headers['x-client-name'] || 'Demo Client',
      email: req.headers['x-client-email'] || 'demo.client@example.com',
      phone: req.headers['x-client-phone'] || null,
    })

    return sendJson(res, 201, {
      requestId: context.requestId,
      client,
    })
  }

  if (req.url === '/clients' && req.method === 'GET') {
    return sendJson(res, 200, {
      requestId: context.requestId,
      items: listClientsByTenant(context.tenantId),
    })
  }

  if (req.url === '/beneficiaries' && req.method === 'POST') {
    const beneficiary = createBeneficiary({
      tenantId: context.tenantId,
      fullName: req.headers['x-beneficiary-name'] || 'Demo Beneficiary',
      passportNumber: req.headers['x-passport-number'] || 'P12345678',
      nationality: req.headers['x-nationality'] || 'CN',
    })

    return sendJson(res, 201, {
      requestId: context.requestId,
      beneficiary,
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

    const visaCase = createVisaCase({
      tenantId: context.tenantId,
      clientId,
      beneficiaryId,
      visaType: req.headers['x-visa-type'] || 'tourist',
      countryCode: req.headers['x-country-code'] || 'US',
    })

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_CREATED,
      targetId: visaCase.caseId,
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
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

    const tokenRecord = issueClientAccessToken({
      tenantId: context.tenantId,
      caseId: visaCase.caseId,
      clientId: visaCase.clientId,
      actorId: context.actorId,
    })

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CLIENT_TOKEN_ISSUED,
      targetId: tokenRecord.clientAccessTokenId,
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

    const openedToken = markClientAccessTokenOpened(token)
    return sendJson(res, 200, {
      requestId: context.requestId,
      clientAccessToken: openedToken,
    })
  }

  if (req.url === '/client-access/revoke' && req.method === 'POST') {
    const token = req.headers['x-client-access-token']
    const tokenRecord = revokeClientAccessToken(token)

    if (!tokenRecord) {
      return sendJson(res, 404, {
        code: 'CLIENT_LINK_INVALID',
        message: 'Client access link is invalid',
        request_id: context.requestId,
        retryable: false,
      })
    }

    return sendJson(res, 200, {
      requestId: context.requestId,
      clientAccessToken: tokenRecord,
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

    const updatedCase = startIntake(caseId, context.tenantId)
    const materialSlots = createMaterialSlotsForCase({
      caseId,
      tenantId: context.tenantId,
    })

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_START_INTAKE,
      targetId: updatedCase.caseId,
      caseId: updatedCase.caseId,
      clientId: updatedCase.clientId,
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

    const updatedCase = sendSupplementRequest(caseId, context.tenantId)
    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_SEND_SUPPLEMENT_REQUEST,
      targetId: updatedCase.caseId,
      caseId: updatedCase.caseId,
      clientId: updatedCase.clientId,
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

    const updatedCase = returnToInternalProcessing(caseId, context.tenantId)
    return sendJson(res, 200, {
      requestId: context.requestId,
      case: updatedCase,
    })
  }

  return false
}
