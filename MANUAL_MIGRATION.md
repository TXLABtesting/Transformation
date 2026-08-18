# Manual Prisma Migration and Seed

This build does not run migrations or seed automatically on pod startup.
The app container starts Next.js directly:

```bash
npm run start
```

Prisma CLI, the Prisma schema, migration files, seed file, and seed support files are included in the runtime image so you can run them manually through `kubectl exec`.

## Run migrations manually

```bash
kubectl exec -n ai-governance-portal deploy/ai-governance-portal-stg-app -- npx prisma migrate deploy
```

## Run seed manually

```bash
kubectl exec -n ai-governance-portal deploy/ai-governance-portal-stg-app -- npx tsx prisma/seed.ts
```

`prisma/seed.ts` imports files from `lib/`, so the Dockerfile copies `lib/` and `tsconfig.json` into the runtime image.

## Database migration table

This app uses Prisma's standard migration table:

```text
_prisma_migrations
```

Do not use `schema_migrations` for this app.

## Clean staging reset

If staging must be reset, reset the schema fully instead of deleting tables only:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO "<DB_USER>";
```

Then run:

```bash
kubectl exec -n ai-governance-portal deploy/ai-governance-portal-stg-app -- npx prisma migrate deploy
kubectl exec -n ai-governance-portal deploy/ai-governance-portal-stg-app -- npx tsx prisma/seed.ts
```


## Public application URL

Set `APP_BASE_URL` to the public HTTPS origin of the application, for example `https://aigp-stg.moca.gov.ae`. The OIDC callback uses this value when redirecting users back to the app after login.
