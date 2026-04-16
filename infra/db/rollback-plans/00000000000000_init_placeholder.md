# Rollback Plan: 00000000000000_init_placeholder.sql

- Trigger conditions:
  - Migration fails before commit.
  - Post-migration validation fails.
  - Dependent application paths cannot start cleanly after migration.
- Rollback steps:
  1. Stop any follow-up migration from running.
  2. Confirm no partial schema change was committed.
  3. If a partial change exists, revert the touched objects to the pre-migration state.
  4. Re-run baseline validation before allowing further changes.
- Validation checks:
  - Confirm the database is reachable.
  - Confirm placeholder migration objects are absent or unchanged.
  - Confirm the next migration can still be applied from the expected baseline.
- Impacted tables:
  - none for placeholder drill
- Drill evidence:
  - Record operator, environment, start time, end time, and result.
