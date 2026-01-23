---
path: /home/lima/repo/infra/utils.ts
type: util
updated: 2026-01-22
status: active
---

# utils.ts

## Purpose

Provides utility functions for SST infrastructure configuration. Determines whether the current deployment stage is a permanent (long-lived) environment versus an ephemeral preview stage.

## Exports

- `isPermanentStage`: Boolean constant that returns `true` if the current SST stage is "dev", "test", or "prod", used to conditionally configure resources for permanent vs ephemeral environments.

## Dependencies

- `$app.stage` (SST global): Provides the current deployment stage name

## Used By

TBD

## Notes

- Uses SST's global `$app.stage` variable which is available in SST config files
- Permanent stages typically get different resource configurations (e.g., retention policies, deletion protection) compared to ephemeral preview stages