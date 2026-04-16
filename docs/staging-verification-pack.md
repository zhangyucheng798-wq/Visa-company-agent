# Staging Verification Pack

## Purpose
Provide a minimum staging checklist before demo, release review, or environment sign-off.

## Scope
This pack covers:
- API reachability and guarded-route behavior
- request/correlation trace propagation
- audit and notification recovery baselines
- worker reconciliation and alert baseline output
- file security controls
- recovery and rollback documentation readiness

## Preconditions
- Deploy the candidate build to staging.
- Know the staging base URL or local port mapping.
- Prepare at least two tenant identities and one reviewer/admin split for negative checks.
- Capture a dedicated request ID and correlation ID for each verification run.

## Verification Checklist
### 1. Health and reachability
- `GET /health` returns 200.
- Response includes `x-request-id` and `x-correlation-id` when request context exists.
- Response headers include `cache-control: no-store`, `pragma: no-cache`, and `x-content-type-options: nosniff` where applicable.

### 2. Auth, RBAC, and tenant isolation
- Protected case routes reject unauthenticated requests.
- File routes reject unauthorized roles.
- Tenant B cannot read or mutate tenant A file objects.
- Reviewer actors cannot perform admin/operator-only file mutations.

### 3. Workflow baseline
- A case can be created and moved into intake.
- A raw file upload can be created for the correct slot.
- Scan or validation writeback updates only the same-tenant raw object.
- Document admission succeeds only after required checks pass.

### 4. Observability baseline
- API emits JSON `request_completed` logs.
- Worker emits JSON logs for reconciliation and alert-baseline modes.
- Request ID and correlation ID are visible in responses and logs.

### 5. Recovery baseline
- Recovery runbook is present at `docs/runbooks/recovery-runbook.md`.
- Migration rollback runbook is present at `docs/runbooks/migration-rollback-runbook.md`.
- At least one rollback plan note exists under `infra/db/rollback-plans`.

## Suggested Commands
### API
```bash
PORT=3112 node apps/api/src/main.js
```

### Workers
```bash
WORKER_JOB=reconciliation node apps/workers/src/main.js
WORKER_JOB=alert-baseline node apps/workers/src/main.js
```

## Evidence to Capture
- Health response.
- One successful protected-route response.
- One unauthorized/RBAC negative response.
- One tenant-isolation negative response.
- One API structured log line.
- One worker reconciliation log line.
- One worker alert-baseline log line.
- References to the recovery and rollback runbooks used for fallback.

## Exit Criteria
Staging verification passes when:
- All checklist items were executed or intentionally waived.
- Negative security checks fail in the expected guarded way.
- Observability outputs are present.
- Recovery and rollback documentation is available to operators.
- Remaining issues are documented before demo or release sign-off.
