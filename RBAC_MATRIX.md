# RBAC matrix

## Roles

- `system_admin` — full system access.
- `program_admin` — program-wide access except low-level settings.
- `entity_representative` — scoped entity workflow access.
- `entity_coordinator` — scoped entity/stream workflow access.
- `stream_owner` — stream review/approval access.
- `ai_committee` — committee review, funding and AI review access.
- `viewer` — scoped read-only access.
- `auditor` — scoped read/export/audit access.

## Permission examples

- `users:view`
- `users:create`
- `users:update`
- `users:disable`
- `roles:view`
- `roles:assign`
- `entities:view`
- `streams:view`
- `items:view`
- `items:create`
- `items:update`
- `items:submit`
- `items:approve`
- `items:reject`
- `items:export`
- `funding:view`
- `funding:approve`
- `nominations:view`
- `reports:view`
- `reports:export`
- `ai_review:run`
- `audit:view`
- `settings:update`

The seed script creates the initial role-permission mappings.
