import { ErrorCode } from '../../../../packages/shared-types/src/index.js'
import { hasRequiredRole } from '../../../../packages/shared-auth/src/index.js'

export function requireAuthenticated(context) {
  if (!context.isAuthenticated) {
    return buildGuardError(401, ErrorCode.ACCESS_DENIED, 'Authentication required')
  }

  return null
}

export function requireTenantContext(context) {
  if (!context.tenantId) {
    return buildGuardError(400, ErrorCode.TENANT_SCOPE_MISMATCH, 'Tenant context required')
  }

  return null
}

export function requireRoles(context, allowedRoles = []) {
  if (!hasRequiredRole(context.actorRole, allowedRoles)) {
    return buildGuardError(403, ErrorCode.ACCESS_DENIED, 'Role not allowed for this resource')
  }

  return null
}

function buildGuardError(status, code, message) {
  return {
    status,
    body: {
      code,
      message,
      retryable: false,
    },
  }
}
