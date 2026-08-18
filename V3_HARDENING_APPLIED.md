# V3 hardening pass applied

This package keeps the V3 Next.js/Prisma/Arabic workflow implementation and adds a production security foundation.

## Implemented in this pass

- Added backend-managed auth routes:
  - `GET /api/auth/login`
  - `GET /callback` for Workspace ONE / confidential-client OIDC
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Retained UAE PASS routes and changed UAE PASS callback to create the same signed session cookie.
- Added signed HttpOnly session cookie helpers using HMAC SHA-256.
- Added production env validation for required secrets/provider config.
- Added Prisma RBAC models:
  - `roles`
  - `permissions`
  - `user_roles`
  - `role_permissions`
  - `user_entity_scopes`
  - `user_stream_scopes`
  - `audit_logs`
- Extended `users` with production access fields:
  - `status`
  - `access_enabled`
  - `auth_provider`
  - `external_sub`
  - `last_login_at`
- Added migration `0006_rbac_security`.
- Seed now creates roles, permissions and role-permission mappings.
- Added backend auth/RBAC/data-isolation helpers under `lib/security`.
- Added scoped admin APIs for users, roles, permissions, entities, streams and audit logs.
- Added scoped item APIs and server-side item workflow actions.
- Added health/readiness endpoints:
  - `GET /api/health`
  - `GET /api/ready`
- Hardened `/api/ai-review` with authentication, permission check and audit logging.
- Restricted `/api/state` so non-global users cannot read/write the full cross-entity app-state blob.
- Updated Kubernetes probes to use `/api/health` and `/api/ready`.
- Updated environment examples and Kubernetes ConfigMap/Secret examples.

## Important limitations remaining

This is a practical hardening foundation, not a complete rewrite of every V3 workflow.

Remaining work:

- Wire all frontend Zustand mutations to the new relational APIs.
- Build full admin screens for user/role/scope management.
- Add CSRF protection for cookie-auth mutating requests.
- Add app-level rate-limiting middleware or enforce at ingress.
- Add automated tests for cross-entity isolation and workflow transitions.
- Add endpoints for every launch-plan, funding, nomination and report mutation.
- Fully validate provider-specific ID tokens in UAE PASS flow. Workspace ONE ID tokens are verified through JWKS when present.

## Production reminders

- Do not use `AUTH_PROVIDER=mock` in production.
- Use `prisma migrate deploy`, not `prisma db push --accept-data-loss`.
- Store `DATABASE_URL`, `SESSION_SECRET`, `OIDC_CLIENT_SECRET`, and `BOOTSTRAP_ADMIN_EMAILS` in Kubernetes Secret.
- Set `NEXT_PUBLIC_DATA_MODE=api` in production.


## Migration behavior update

Automatic startup migrations, automatic startup seed execution, custom baseline handling, and legacy `schema_migrations` bridging have been removed.

The app container now starts Next.js directly with:

```bash
npm run start
```

The image still includes Prisma CLI dependencies, `prisma/schema.prisma`, `prisma/migrations`, and `prisma/seed.ts`, so operators can run migrations manually from the running pod:

```bash
kubectl exec -n <namespace> deploy/<deployment-name> -- npx prisma migrate deploy
```

Seed can be run manually only when required:

```bash
kubectl exec -n <namespace> deploy/<deployment-name> -- npx tsx prisma/seed.ts
```

Migration tracking is standardized on Prisma's `_prisma_migrations` table. Do not use `schema_migrations` for this app.


## Public application URL

Set `APP_BASE_URL` to the public HTTPS origin of the application, for example `https://aigp-stg.moca.gov.ae`. The OIDC callback uses this value when redirecting users back to the app after login.
