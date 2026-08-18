# Migration startup behavior

The application uses a simple, standardized Prisma first-boot migration flow.

## Config

```yaml
RUN_MIGRATIONS_ON_STARTUP: "true"
RUN_SEED_ON_STARTUP: "true"
```

After the first successful deployment:

```yaml
RUN_MIGRATIONS_ON_STARTUP: "true"
RUN_SEED_ON_STARTUP: "false"
```

## What happens on startup

When `RUN_MIGRATIONS_ON_STARTUP=true`, the entrypoint runs:

```bash
node scripts/prisma-startup-migrate.mjs
```

The script:

1. Checks Prisma migration status.
2. Skips migration when the DB is already up to date.
3. Runs `prisma migrate deploy` when pending migrations exist.
4. Uses only Prisma's standard `_prisma_migrations` table.

## Important standardization decision

This build does not use `schema_migrations`.

Migration history must be stored in:

```text
_prisma_migrations
```

For a fresh staging deployment, empty the database/schema and let Prisma initialize it.

## Expected logs

When up to date:

```text
[entrypoint] Checking Prisma migration status...
[entrypoint] No pending Prisma migrations. Skipping migrate deploy.
```

When migrations are pending:

```text
[entrypoint] Pending Prisma migrations detected.
[entrypoint] Running Prisma migrate deploy...
[entrypoint] Prisma migrate deploy completed.
```

If the DB is not clean and has no Prisma history:

```text
[entrypoint] The database is not empty and does not have standard Prisma migration history.
[entrypoint] Standardized mode uses _prisma_migrations only and does not read schema_migrations.
```
