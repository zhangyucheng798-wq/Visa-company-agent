import { Role } from '../../../../packages/shared-auth/src/index.js'

export const ProtectedRoutes = Object.freeze({
  '/protected/health': {
    roles: [Role.ADMIN, Role.CASE_OPERATOR, Role.REVIEWER, Role.APPROVER],
    requireTenant: true,
  },
  '/audit/logs': {
    roles: [Role.ADMIN, Role.REVIEWER, Role.APPROVER],
    requireTenant: true,
  },
})
