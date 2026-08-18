# First-boot migration

This build uses standard Prisma migration behavior for Kubernetes environments where replicas are set to `1`.

Use these ConfigMap values:

```yaml
RUN_MIGRATIONS_ON_STARTUP: "true"
RUN_SEED_ON_STARTUP: "true"
```

After the first successful deployment, seed can normally be disabled:

```yaml
RUN_MIGRATIONS_ON_STARTUP: "true"
RUN_SEED_ON_STARTUP: "false"
```

## Standardized migration table

This build uses Prisma's standard migration table only:

```text
_prisma_migrations
```

It does **not** read or bridge legacy/custom tables such as:

```text
schema_migrations
```

If this is a fresh staging deployment, empty the database/schema first and let Prisma create `_prisma_migrations` automatically.

## Startup behavior

The entrypoint runs `scripts/prisma-startup-migrate.mjs`.

It does this:

1. Runs `prisma migrate status`.
2. If no migrations are pending, it skips migration.
3. If migrations are pending, it runs `prisma migrate deploy`.
4. If the DB is non-empty without `_prisma_migrations`, it fails clearly and asks for a clean DB/schema.
5. If `_prisma_migrations` has failed migration records, it fails clearly and asks for cleanup before retrying.

Keep Kubernetes as:

```yaml
replicas: 1
strategy:
  type: Recreate
```

For replicas greater than 1, prefer a separate Kubernetes migration Job.
