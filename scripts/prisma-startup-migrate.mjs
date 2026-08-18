#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const schemaPath = process.env.PRISMA_SCHEMA_PATH || "prisma/schema.prisma";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    text: true,
    shell: false,
    env: {
      ...process.env,
      PRISMA_HIDE_UPDATE_MESSAGE: "true",
      npm_config_update_notifier: "false",
      NPM_CONFIG_UPDATE_NOTIFIER: "false",
    },
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const output = `${stdout}${stderr}`;

  if (options.capture) {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  }

  return {
    code: result.status ?? 1,
    output,
  };
}

function hasText(output, patterns) {
  return patterns.some((pattern) => pattern.test(output));
}

function isUpToDate(output) {
  return hasText(output, [
    /database schema is up to date/i,
    /no pending migrations/i,
    /already in sync/i,
  ]);
}

function hasPendingMigrations(output) {
  return hasText(output, [
    /not yet been applied/i,
    /pending migration/i,
    /database schema is behind/i,
    /migrations have not yet been applied/i,
    /Following migrations have not yet been applied/i,
  ]);
}

function hasFailedMigration(output) {
  return hasText(output, [
    /P3009/i,
    /failed migrations in the target database/i,
    /found failed migrations/i,
  ]);
}

function isNonEmptyWithoutPrismaHistory(output) {
  return hasText(output, [
    /P3005/i,
    /database schema is not empty/i,
    /The database schema is not empty/i,
  ]);
}

function printStandardizationHelp(output) {
  if (hasFailedMigration(output)) {
    console.error("[entrypoint] Prisma found a failed migration record in _prisma_migrations.");
    console.error("[entrypoint] Standardized mode does not auto-resolve failed migrations.");
    console.error("[entrypoint] For a fresh staging deployment, empty the database/schema and restart the pod.");
    return;
  }

  if (isNonEmptyWithoutPrismaHistory(output)) {
    console.error("[entrypoint] The database is not empty and does not have standard Prisma migration history.");
    console.error("[entrypoint] Standardized mode uses _prisma_migrations only and does not read schema_migrations.");
    console.error("[entrypoint] For a fresh staging deployment, empty the database/schema and restart the pod.");
  }
}

function migrateDeploy() {
  console.log("[entrypoint] Running Prisma migrate deploy...");
  const deploy = run("npx", ["prisma", "migrate", "deploy", "--schema", schemaPath], { capture: true });

  if (deploy.code === 0) {
    console.log("[entrypoint] Prisma migrate deploy completed.");
    return;
  }

  printStandardizationHelp(deploy.output);
  process.exit(deploy.code);
}

function main() {
  if (process.env.RUN_MIGRATIONS_ON_STARTUP !== "true") {
    console.log("[entrypoint] RUN_MIGRATIONS_ON_STARTUP is not true. Skipping Prisma migrations.");
    return;
  }

  console.log("[entrypoint] Checking Prisma migration status...");
  const status = run("npx", ["prisma", "migrate", "status", "--schema", schemaPath], { capture: true });

  if (isUpToDate(status.output)) {
    console.log("[entrypoint] No pending Prisma migrations. Skipping migrate deploy.");
    return;
  }

  if (hasPendingMigrations(status.output)) {
    console.log("[entrypoint] Pending Prisma migrations detected.");
    migrateDeploy();
    return;
  }

  if (status.code !== 0) {
    printStandardizationHelp(status.output);
    console.log("[entrypoint] Prisma status was not clean. Running migrate deploy for the standard Prisma result...");
    migrateDeploy();
    return;
  }

  console.log("[entrypoint] Prisma status did not report pending migrations. Skipping migrate deploy.");
}

main();
