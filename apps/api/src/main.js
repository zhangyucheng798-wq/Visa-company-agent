import http from 'node:http'
import { buildAuditContext } from './audit/audit-context.js'
import { enforceAuditWritePolicy } from './audit/audit-guards.js'
import { getAuditLogSnapshot, writeAuditRecord } from './audit/audit-service.js'
import { handleDomainRoutes } from './domain/domain-routes.js'
import { handleFileRoutes } from './files/file-routes.js'
import { buildRequestContext } from './security/request-context.js'
import { requireAuthenticated, requireRoles, requireTenantContext } from './security/auth-guards.js'
import { ProtectedRoutes } from './security/protected-routes.js'
import { AuditActionCode } from '../../../packages/shared-audit/src/index.js'

const port = Number(process.env.PORT || 3001)

const server = http.createServer((req, res) => {
  const context = buildRequestContext(req)

  if (req.url === '/health') {
    return sendJson(res, 200, {
      app: 'api',
      status: 'ok',
      path: req.url,
      requestId: context.requestId,
    })
  }

  if (req.url === '/audit/logs') {
    return sendJson(res, 200, {
      items: getAuditLogSnapshot(),
      requestId: context.requestId,
    })
  }

  if (req.url.startsWith('/clients') || req.url.startsWith('/beneficiaries') || req.url.startsWith('/cases')) {
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

    const handled = handleFileRoutes(req, res, context, sendJson)
    if (handled !== false) {
      return handled
    }
  }

  const protectedRoute = ProtectedRoutes[req.url]
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
    const auditFailure = enforceAuditWritePolicy(auditWriteResult, context.requestId)
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
  console.log(`api listening on :${port}`)
})

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}
