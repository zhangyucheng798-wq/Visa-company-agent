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
  '/audit/compensations': {
    roles: [Role.ADMIN, Role.REVIEWER, Role.APPROVER],
    requireTenant: true,
  },
  '/audit/compensations/resolve': {
    roles: [Role.ADMIN, Role.REVIEWER, Role.APPROVER],
    requireTenant: true,
  },
  '/cases/start-intake': {
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  '/cases/send-supplement-request': {
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  '/cases/return-to-internal': {
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  '/cases/submit-for-review': {
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  '/cases/review-decision': {
    roles: [Role.ADMIN, Role.REVIEWER],
    requireTenant: true,
  },
  '/cases/review-returned': {
    roles: [Role.ADMIN, Role.REVIEWER],
    requireTenant: true,
  },
  '/cases/submit-for-approval': {
    roles: [Role.ADMIN, Role.APPROVER],
    requireTenant: true,
  },
  '/cases/approval-decision': {
    roles: [Role.ADMIN, Role.APPROVER],
    requireTenant: true,
  },
  '/cases/approval-rejection': {
    roles: [Role.ADMIN, Role.APPROVER],
    requireTenant: true,
  },
  '/cases/close': {
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
})

export const ProtectedRoutePrefixes = Object.freeze([
  {
    prefix: '/reviews',
    roles: [Role.ADMIN, Role.REVIEWER],
    requireTenant: true,
  },
  {
    prefix: '/approvals',
    roles: [Role.ADMIN, Role.APPROVER],
    requireTenant: true,
  },
  {
    prefix: '/ops/',
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  {
    prefix: '/client-access-tokens',
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  {
    prefix: '/client-access/revoke',
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  {
    prefix: '/tasks',
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  {
    prefix: '/notifications',
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
  {
    prefix: '/files/',
    roles: [Role.ADMIN, Role.CASE_OPERATOR],
    requireTenant: true,
  },
])

export function matchProtectedRoute(url) {
  return ProtectedRoutes[url] || ProtectedRoutePrefixes.find((item) => url.startsWith(item.prefix)) || null
}
