#!/bin/sh
set -eu

# Optional first-boot database migration for constrained Kubernetes environments.
# Safe with replicas=1. For replicas>1, prefer a Kubernetes migration Job.
if [ "${RUN_MIGRATIONS_ON_STARTUP:-false}" = "true" ]; then
  node scripts/prisma-startup-migrate.mjs
else
  echo "[entrypoint] RUN_MIGRATIONS_ON_STARTUP is not true. Skipping Prisma migrations."
fi

# Seed is idempotent in this codebase and is used for reference data/RBAC.
# Disable in environments where seed data must be controlled separately.
if [ "${RUN_SEED_ON_STARTUP:-false}" = "true" ]; then
  echo "[entrypoint] Running Prisma seed..."
  npx tsx prisma/seed.ts
  echo "[entrypoint] Prisma seed completed."
else
  echo "[entrypoint] RUN_SEED_ON_STARTUP is not true. Skipping Prisma seed."
fi

exec "$@"
