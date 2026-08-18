# Data isolation model

V3 now includes backend helpers for enforcing entity and stream scoping.

A user from Entity A must not be able to list, open, mutate, approve, export, or infer records belonging to Entity B unless the user has a global role.

Global roles:

- `system_admin`
- `program_admin`

Scoped roles:

- `entity_representative`
- `entity_coordinator`
- `stream_owner`
- `ai_committee`
- `viewer`
- `auditor`

Scopes are loaded from:

- `user_entity_scopes`
- `user_stream_scopes`
- fallback `users.entity_id`
- fallback `users.stream_id`

Backend helpers are in:

- `lib/security/rbac.ts`
- `lib/security/auth.ts`

Important helpers:

- `buildItemScopeWhere(user)`
- `assertEntity(user, entityId)`
- `assertStream(user, streamId)`
- `canAccessAllEntities(user)`

The full `/api/state` blob is restricted to global users because it may contain cross-entity data. Production workflow screens should gradually use the relational APIs instead of syncing the whole Zustand state.
