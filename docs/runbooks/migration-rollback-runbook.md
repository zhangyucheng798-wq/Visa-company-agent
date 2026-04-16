# Migration Rollback Runbook

## Purpose
Provide a minimum rollback drill procedure for schema or data changes that require controlled recovery beyond normal application-level remediation.

## Prerequisites
- Identify the migration file under `infra/db/migrations` and its linked rollback note under `infra/db/rollback-plans`.
- Confirm migration classification and expected blast radius.
- Freeze follow-up migrations until the drill or rollback is complete.
- Capture who is executing, when the drill started, and which environment is being exercised.

## Drill Workflow
1. Confirm the target migration.
   - Read the migration header.
   - Confirm the referenced rollback plan path exists.
   - Record impacted tables and expected validation queries.
2. Prepare rollback inputs.
   - Save the pre-drill schema/data snapshot reference.
   - Record the exact migration version under test.
   - Define success criteria for both rollback and post-rollback validation.
3. Execute the drill.
   - Simulate the migration application window.
   - Follow the rollback steps from the matching note in `infra/db/rollback-plans`.
   - Do not resume dependent migrations until validation passes.
4. Validate rollback.
   - Run the listed validation checks.
   - Confirm impacted tables match expected pre-migration shape.
   - Record any data repair work or manual follow-up still required.
5. Close out the drill.
   - Record pass/fail result, operator, timestamps, and evidence.
   - If the drill exposes gaps, update the rollback note before the migration is allowed forward.

## Minimum Checks
- Rollback note exists and is specific to the migration.
- Trigger conditions are explicit.
- Rollback steps are ordered and reversible.
- Validation checks prove the system returned to the expected state.
- Incident or drill notes capture unresolved risk.

## Exit Criteria
The rollback drill is complete when all are true:
- The referenced rollback plan was executed end to end.
- Validation checks passed or remaining gaps were explicitly recorded.
- Follow-up migrations remain paused until the result is accepted.
- The rollback note is updated if the drill exposed missing steps.
