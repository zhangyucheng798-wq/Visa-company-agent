# Demo Readiness Gate

## Purpose
Define the minimum go/no-go gate before a customer-facing demo or stakeholder walkthrough.

## Gate Inputs
- Completed staging verification pack: `docs/staging-verification-pack.md`
- Available recovery runbook: `docs/runbooks/recovery-runbook.md`
- Available migration rollback runbook: `docs/runbooks/migration-rollback-runbook.md`
- Latest candidate build identifier or commit
- Named operator responsible for the demo check

## Go / No-Go Checklist
### Go only if all are true
- Health and guarded-route checks passed.
- Tenant isolation negative checks passed.
- Structured API and worker logs were observed.
- Request ID and correlation ID propagation was confirmed.
- Recovery and rollback documents are reachable by the operator.
- Any open alerts are understood and judged acceptable for demo scope.
- Any known defects have a workaround that does not violate security or tenant isolation.

### No-Go conditions
- Health endpoint is unstable.
- Unauthorized access checks succeed unexpectedly.
- Cross-tenant file access or mutation is reproducible.
- Worker reconciliation or alert-baseline output is missing or malformed.
- Operators cannot reach the recovery or rollback procedure.
- An unresolved defect blocks the intended demo path.

## Minimum Evidence
- Screenshot or saved response for `/health`.
- One successful protected-route response.
- One expected 401/403/404 negative response proving guardrails.
- One structured API log line.
- One structured worker log line.
- The exact request ID and correlation ID used during the check.

## Decision Record
Capture:
- decision: go or no-go
- operator
- timestamp
- candidate version
- blocked flows
- accepted risks
- fallback runbook to use if the demo degrades

## Fallback Rule
If the demo degrades during execution:
1. Stop the affected flow.
2. Use the recovery runbook for application-level issues.
3. Use the migration rollback runbook only for schema/data rollback scenarios.
4. Resume only after the guard condition is restored or the scenario is explicitly changed.
