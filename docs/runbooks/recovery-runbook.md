# Recovery Runbook

## Purpose
Provide a minimum recovery procedure for service incidents affecting API routing, worker reconciliation, audit compensation handling, notification delivery, file-ingress isolation, and baseline observability.

## Trigger Conditions
Use this runbook when any of the following is true:
- API health or protected routes return unexpected 5xx/4xx responses.
- Structured request logs or trace identifiers stop appearing.
- Reconciliation jobs stop reopening retryable notification failures.
- Pending audit compensations accumulate and cannot be resolved normally.
- File upload, scan-result writeback, or document admission shows tenant-isolation or RBAC regressions.
- Alert baseline reports exhausted notifications or pending audit compensations above threshold.

## Required Inputs
- Incident start time and current impact summary.
- Affected tenant IDs, actor IDs, request IDs, and correlation IDs.
- Latest API and worker logs.
- Current deployment version or local commit under investigation.

## Recovery Workflow
1. Confirm impact scope.
   - Check `/health` first.
   - Reproduce one failing request with known headers for tenant, actor, request ID, and correlation ID.
   - Record exact status code, response body, and returned tracing headers.
2. Isolate the failure domain.
   - API-only: inspect route protection, request-context propagation, and response headers.
   - Worker-only: run reconciliation or alert-baseline job and inspect emitted JSON logs.
   - Tenant-specific: repeat the same flow with a second tenant to detect isolation regressions.
3. Stabilize user-visible operations.
   - Pause follow-up manual retries that could duplicate state changes.
   - Prefer read-only verification until the failing boundary is identified.
   - If file handling is affected, stop cross-tenant validation attempts and keep raw objects pending.
4. Recover by failure class.
   - Auth or RBAC regression: verify protected route mapping and required tenant context before changing business logic.
   - Trace/logging regression: verify request IDs, correlation IDs, and structured JSON log emission.
   - Notification recovery issue: run worker reconciliation and confirm failed-but-retryable notifications reopen as pending.
   - Audit recovery issue: inspect pending compensations, resolve valid items, and confirm no new compensations are created for the same path.
   - File security issue: verify tenant-scoped lookups and route-role enforcement before re-enabling the affected mutation.
5. Validate recovery.
   - Repeat the original failing request.
   - Confirm request and correlation IDs appear in response headers/body and logs.
   - Confirm tenant B cannot read or mutate tenant A file objects.
   - Confirm reviewer-only actors cannot call admin/operator-only file mutations.
   - Confirm worker metrics no longer exceed expected thresholds.
6. Record and hand off.
   - Capture root cause, mitigation, validation evidence, and remaining follow-up items.
   - Link any unresolved schema/data issue to the migration rollback runbook when database rollback is considered.

## Verification Commands
### API baseline check
```bash
PORT=3112 node apps/api/src/main.js
```
Then verify:
- `GET /health`
- one protected case or file route with explicit `x-request-id` and `x-correlation-id`
- one tenant-isolation negative case

### Worker reconciliation check
```bash
WORKER_JOB=reconciliation node apps/workers/src/main.js
```
Expect a JSON log with `event:"reconciliation_completed"` and notification/audit counts.

### Worker alert baseline check
```bash
WORKER_JOB=alert-baseline node apps/workers/src/main.js
```
Expect a JSON log with `event:"alert_baseline_evaluated"`, alert list, and metrics.

## Exit Criteria
Recovery is complete when all are true:
- `/health` is healthy.
- The originally failing path succeeds or fails with the expected guarded status.
- Request ID and correlation ID propagation is visible again.
- No unauthorized cross-tenant file access is reproducible.
- Pending alerts are understood, reduced, or intentionally accepted with incident notes.

## Escalation Notes
- Use the migration rollback runbook for schema or irreversible data issues.
- Treat repeated pending audit compensations as a data-integrity concern, not only a logging concern.
- Treat repeated exhausted notifications as an operational backlog requiring manual follow-through.
