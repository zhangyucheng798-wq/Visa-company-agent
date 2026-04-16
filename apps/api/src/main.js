import http from 'node:http'
import { buildAuditContext } from './audit/audit-context.js'
import { enforceAuditWritePolicy } from './audit/audit-guards.js'
import { getAuditCompensationSnapshot, getAuditLogSnapshot, listAuditCompensationsByStatus, listAuditCompensationsByTenant, resolveAuditCompensation, writeAuditRecord } from './audit/audit-service.js'
import { handleDomainRoutes } from './domain/domain-routes.js'
import { handleFileRoutes } from './files/file-routes.js'
import { buildRequestContext } from './security/request-context.js'
import { requireAuthenticated, requireRoles, requireTenantContext } from './security/auth-guards.js'
import { matchProtectedRoute, ProtectedRoutes } from './security/protected-routes.js'
import { AuditActionCode } from '../../../packages/shared-audit/src/index.js'

const port = Number(process.env.PORT || 3001)

const server = http.createServer((req, res) => {
  const context = buildRequestContext(req)
  res.requestContext = context

  if (req.url === '/health') {
    return sendJson(res, 200, {
      app: 'api',
      status: 'ok',
      path: req.url,
      requestId: context.requestId,
    })
  }

  const publicDomainRoutes = ['/client-access/open', '/client-portal/summary', '/client-portal/upload', '/client-portal/submit']
  if (publicDomainRoutes.includes(req.url)) {
    const handled = handleDomainRoutes(req, res, context, sendJson)
    if (handled !== false) {
      return handled
    }
  }

  if (
    req.url.startsWith('/clients') ||
    req.url.startsWith('/beneficiaries') ||
    req.url.startsWith('/cases') ||
    req.url.startsWith('/reviews') ||
    req.url.startsWith('/approvals') ||
    req.url.startsWith('/ops/') ||
    req.url.startsWith('/client-access-tokens') ||
    req.url.startsWith('/client-access/') ||
    req.url.startsWith('/tasks') ||
    req.url.startsWith('/notifications')
  ) {
    const authError = requireAuthenticated(context)
    if (authError) {
      return sendJson(res, authError.status, {
        ...authError.body,
        request_id: context.requestId,
      })
    }

    const tenantError = requireTenantContext(context)
    if (tenantError) {
      return sendJson(res, tenantError.status, {
        ...tenantError.body,
        request_id: context.requestId,
      })
    }

    const protectedRoute = matchProtectedRoute(req.url)
    if (protectedRoute) {
      const roleError = requireRoles(context, protectedRoute.roles)
      if (roleError) {
        return sendJson(res, roleError.status, {
          ...roleError.body,
          request_id: context.requestId,
        })
      }
    }

    const handled = handleDomainRoutes(req, res, context, sendJson)
    if (handled !== false) {
      return handled
    }
  }

  if (req.url.startsWith('/files/')) {
    const authError = requireAuthenticated(context)
    if (authError) {
      return sendJson(res, authError.status, {
        ...authError.body,
        request_id: context.requestId,
      })
    }

    const tenantError = requireTenantContext(context)
    if (tenantError) {
      return sendJson(res, tenantError.status, {
        ...tenantError.body,
        request_id: context.requestId,
      })
    }

    const protectedRoute = matchProtectedRoute(req.url)
    if (protectedRoute) {
      const roleError = requireRoles(context, protectedRoute.roles)
      if (roleError) {
        return sendJson(res, roleError.status, {
          ...roleError.body,
          request_id: context.requestId,
        })
      }
    }

    const handled = handleFileRoutes(req, res, context, sendJson)
    if (handled !== false) {
      return handled
    }
  }

  const protectedRoute = matchProtectedRoute(req.url)
  if (protectedRoute) {
    const authError = requireAuthenticated(context)
    if (authError) {
      return sendJson(res, authError.status, {
        ...authError.body,
        request_id: context.requestId,
      })
    }

    if (protectedRoute.requireTenant) {
      const tenantError = requireTenantContext(context)
      if (tenantError) {
        return sendJson(res, tenantError.status, {
          ...tenantError.body,
          request_id: context.requestId,
        })
      }
    }

    const roleError = requireRoles(context, protectedRoute.roles)
    if (roleError) {
      return sendJson(res, roleError.status, {
        ...roleError.body,
        request_id: context.requestId,
      })
    }

    if (req.url === '/audit/logs') {
      return sendJson(res, 200, {
        items: getAuditLogSnapshot().filter((item) => item.tenantId === context.tenantId),
        requestId: context.requestId,
      })
    }

    if (req.url === '/audit/compensations' && req.method === 'GET') {
      const status = req.headers['x-compensation-status']
      const items = status
        ? listAuditCompensationsByStatus(status, context.tenantId)
        : listAuditCompensationsByTenant(context.tenantId)

      return sendJson(res, 200, {
        items,
        requestId: context.requestId,
      })
    }

    if (req.url === '/audit/compensations/resolve' && req.method === 'POST') {
      const compensationId = req.headers['x-compensation-id']
      const resolutionNote = req.headers['x-resolution-note'] || null
      const compensation = resolveAuditCompensation(compensationId, context.tenantId, resolutionNote)

      if (!compensation) {
        return sendJson(res, 404, {
          code: 'AUDIT_COMPENSATION_NOT_FOUND',
          message: 'Pending audit compensation not found in current tenant',
          request_id: context.requestId,
          retryable: false,
        })
      }

      return sendJson(res, 200, {
        compensation,
        requestId: context.requestId,
      })
    }

    const auditContext = buildAuditContext({
      requestContext: context,
      actionCode: AuditActionCode.CASE_START_INTAKE,
      targetId: 'case_demo_001',
      caseId: 'case_demo_001',
      reasonCode: 'PHASE1_AUDIT_SMOKE',
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

    return sendJson(res, 200, {
      app: 'api',
      status: 'ok',
      path: req.url,
      requestId: context.requestId,
      tenantId: context.tenantId,
      actorId: context.actorId,
      actorRole: context.actorRole,
      audit: auditWriteResult.value,
    })
  }

  return sendJson(res, 404, {
    code: 'NOT_FOUND',
    message: 'Route not found',
    request_id: context.requestId,
    retryable: false,
  })
})

server.listen(port, () => {
  const address = server.address()
  const listeningPort = address && typeof address === 'object' ? address.port : port
  console.log(JSON.stringify({ app: 'api', event: 'server_listening', port: listeningPort }))
})

function sendJson(res, status, body) {
  const context = res.requestContext || null
  const responseBody = {
    ...body,
    ...(context && !('requestId' in body) && !('request_id' in body) ? { requestId: context.requestId } : {}),
    ...(context && !('correlationId' in body) && !('correlation_id' in body)
      ? ('request_id' in body ? { correlation_id: context.correlationId } : { correlationId: context.correlationId })
      : {}),
  }

  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    pragma: 'no-cache',
    'x-content-type-options': 'nosniff',
    ...(context ? { 'x-request-id': context.requestId, 'x-correlation-id': context.correlationId } : {}),
  })
  if (context) {
    console.log(JSON.stringify({
      app: 'api',
      event: 'request_completed',
      method: res.req?.method || null,
      path: res.req?.url || null,
      status,
      requestId: context.requestId,
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      actorId: context.actorId,
    }))
  }
  res.end(JSON.stringify(responseBody))
}
