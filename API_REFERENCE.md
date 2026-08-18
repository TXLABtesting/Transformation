# API reference added in V3 hardening pass

## Auth

- `GET /api/auth/login`
- `GET /callback`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Health

- `GET /api/health`
- `GET /api/ready`

## Admin

- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id`
- `POST /api/admin/users/:id/enable`
- `POST /api/admin/users/:id/disable`
- `POST /api/admin/users/:id/roles`
- `DELETE /api/admin/users/:id/roles/:roleId`
- `GET /api/admin/roles`
- `GET /api/admin/permissions`
- `GET /api/admin/entities`
- `GET /api/admin/streams`
- `GET /api/admin/audit-logs`

## End-user workflow foundation

- `GET /api/items`
- `POST /api/items`
- `GET /api/items/:id`
- `PATCH /api/items/:id`
- `DELETE /api/items/:id`
- `POST /api/items/:id/submit`
- `POST /api/items/:id/approve`
- `POST /api/items/:id/reject`
- `POST /api/items/:id/return`
- `GET /api/launch-plans`
- `GET /api/funding`
- `GET /api/nominations`
- `POST /api/ai-review`

All protected APIs use the signed session cookie and backend-loaded roles/scopes.
