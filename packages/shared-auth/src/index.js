export const Role = Object.freeze({
  ADMIN: 'admin',
  CASE_OPERATOR: 'case_operator',
  REVIEWER: 'reviewer',
  APPROVER: 'approver',
  CLIENT: 'client',
})

export function parseAuthHeaders(headers = {}) {
  const actorId = headers['x-actor-id'] || null
  const actorRole = headers['x-actor-role'] || null
  const tenantId = headers['x-tenant-id'] || null

  return {
    actorId,
    actorRole,
    tenantId,
    isAuthenticated: Boolean(actorId && actorRole),
  }
}

export function hasRequiredRole(actorRole, allowedRoles = []) {
  return allowedRoles.length === 0 || allowedRoles.includes(actorRole)
}
