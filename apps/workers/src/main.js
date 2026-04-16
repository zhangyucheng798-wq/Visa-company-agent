import crypto from 'node:crypto'
import { reconcilePendingAuditCompensations } from '../../api/src/audit/audit-service.js'
import { reconcilePendingNotifications } from '../../api/src/domain/entity-store.js'

export function runReconciliationJobs({ tenantId = null, correlationId = crypto.randomUUID() } = {}) {
  const notifications = reconcilePendingNotifications(tenantId)
  const auditCompensations = reconcilePendingAuditCompensations(tenantId)

  return {
    tenantId,
    correlationId,
    notifications,
    auditCompensations,
  }
}

export function evaluateAlertBaseline({
  tenantId = null,
  correlationId = crypto.randomUUID(),
  thresholds = {},
} = {}) {
  const result = runReconciliationJobs({ tenantId, correlationId })
  const exhaustedNotificationThreshold = Number(thresholds.exhaustedNotifications || 1)
  const pendingAuditCompensationThreshold = Number(thresholds.pendingAuditCompensations || 1)
  const alerts = []

  if (result.notifications.exhausted.length >= exhaustedNotificationThreshold) {
    alerts.push({
      code: 'NOTIFICATION_DELIVERY_EXHAUSTED',
      severity: 'high',
      count: result.notifications.exhausted.length,
      threshold: exhaustedNotificationThreshold,
    })
  }

  if (result.auditCompensations.length >= pendingAuditCompensationThreshold) {
    alerts.push({
      code: 'AUDIT_COMPENSATION_PENDING',
      severity: 'high',
      count: result.auditCompensations.length,
      threshold: pendingAuditCompensationThreshold,
    })
  }

  return {
    tenantId: result.tenantId,
    correlationId: result.correlationId,
    alerts,
    metrics: {
      reopenedNotifications: result.notifications.reopened.length,
      pendingNotifications: result.notifications.pending.length,
      exhaustedNotifications: result.notifications.exhausted.length,
      pendingAuditCompensations: result.auditCompensations.length,
    },
  }
}

if (process.env.WORKER_JOB === 'reconciliation') {
  const result = runReconciliationJobs({
    tenantId: process.env.WORKER_TENANT_ID || null,
    correlationId: process.env.WORKER_CORRELATION_ID || crypto.randomUUID(),
  })
  console.log(JSON.stringify({
    app: 'workers',
    event: 'reconciliation_completed',
    tenantId: result.tenantId,
    correlationId: result.correlationId,
    reopenedNotifications: result.notifications.reopened.length,
    pendingNotifications: result.notifications.pending.length,
    exhaustedNotifications: result.notifications.exhausted.length,
    pendingAuditCompensations: result.auditCompensations.length,
  }))
} else if (process.env.WORKER_JOB === 'alert-baseline') {
  const result = evaluateAlertBaseline({
    tenantId: process.env.WORKER_TENANT_ID || null,
    correlationId: process.env.WORKER_CORRELATION_ID || crypto.randomUUID(),
    thresholds: {
      exhaustedNotifications: process.env.ALERT_THRESHOLD_EXHAUSTED_NOTIFICATIONS || 1,
      pendingAuditCompensations: process.env.ALERT_THRESHOLD_PENDING_AUDIT_COMPENSATIONS || 1,
    },
  })
  console.log(JSON.stringify({
    app: 'workers',
    event: 'alert_baseline_evaluated',
    tenantId: result.tenantId,
    correlationId: result.correlationId,
    alerts: result.alerts,
    metrics: result.metrics,
  }))
} else {
  console.log(JSON.stringify({ app: 'workers', event: 'worker_ready' }))
}
