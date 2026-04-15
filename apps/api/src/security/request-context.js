import crypto from 'node:crypto'
import { parseAuthHeaders } from '../../../../packages/shared-auth/src/index.js'

export function buildRequestContext(req) {
  const auth = parseAuthHeaders(req.headers)
  return {
    requestId: req.headers['x-request-id'] || crypto.randomUUID(),
    correlationId: req.headers['x-correlation-id'] || crypto.randomUUID(),
    tenantId: auth.tenantId,
    actorId: auth.actorId,
    actorRole: auth.actorRole,
    isAuthenticated: auth.isAuthenticated,
  }
}
