import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateAlertBaseline, runReconciliationJobs } from '../src/main.js'

test('workers reconciliation returns expected shape', () => {
  const result = runReconciliationJobs({
    tenantId: 'tenant_demo_a',
    correlationId: 'test-worker-reconciliation',
  })

  assert.equal(result.tenantId, 'tenant_demo_a')
  assert.equal(result.correlationId, 'test-worker-reconciliation')
  assert.ok(result.notifications)
  assert.ok(Array.isArray(result.notifications.reopened))
  assert.ok(Array.isArray(result.notifications.pending))
  assert.ok(Array.isArray(result.notifications.exhausted))
  assert.ok(Array.isArray(result.auditCompensations))
})

test('workers alert baseline returns metrics and alerts array', () => {
  const result = evaluateAlertBaseline({
    tenantId: 'tenant_demo_a',
    correlationId: 'test-worker-alert',
    thresholds: {
      exhaustedNotifications: 1,
      pendingAuditCompensations: 1,
    },
  })

  assert.equal(result.tenantId, 'tenant_demo_a')
  assert.equal(result.correlationId, 'test-worker-alert')
  assert.ok(Array.isArray(result.alerts))
  assert.equal(typeof result.metrics.reopenedNotifications, 'number')
  assert.equal(typeof result.metrics.pendingNotifications, 'number')
  assert.equal(typeof result.metrics.exhaustedNotifications, 'number')
  assert.equal(typeof result.metrics.pendingAuditCompensations, 'number')
})
