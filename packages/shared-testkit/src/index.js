export function createTenantFixture(overrides = {}) {
  return {
    tenantId: 'tenant_test_001',
    userId: 'user_test_001',
    ...overrides,
  }
}
