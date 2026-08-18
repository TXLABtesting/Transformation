-- Production RBAC, scoped access and audit logs for V3 hardening.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "access_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "external_sub" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "users_auth_provider_external_sub_idx" ON "users"("auth_provider", "external_sub");
CREATE INDEX IF NOT EXISTS "users_entity_id_idx" ON "users"("entity_id");
CREATE INDEX IF NOT EXISTS "users_stream_id_idx" ON "users"("stream_id");

CREATE TABLE IF NOT EXISTS "roles" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name_ar" TEXT NOT NULL,
  "description" TEXT,
  "is_system" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "roles_code_key" ON "roles"("code");

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_code_key" ON "permissions"("code");

CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");
CREATE INDEX IF NOT EXISTS "user_roles_role_id_idx" ON "user_roles"("role_id");
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_user_id_fkey";
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_role_id_fkey";
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);
ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_role_id_fkey";
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_permission_id_fkey";
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "user_entity_scopes" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_entity_scopes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_entity_scopes_user_id_entity_id_key" ON "user_entity_scopes"("user_id", "entity_id");
CREATE INDEX IF NOT EXISTS "user_entity_scopes_entity_id_idx" ON "user_entity_scopes"("entity_id");
ALTER TABLE "user_entity_scopes" DROP CONSTRAINT IF EXISTS "user_entity_scopes_user_id_fkey";
ALTER TABLE "user_entity_scopes" ADD CONSTRAINT "user_entity_scopes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_entity_scopes" DROP CONSTRAINT IF EXISTS "user_entity_scopes_entity_id_fkey";
ALTER TABLE "user_entity_scopes" ADD CONSTRAINT "user_entity_scopes_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "user_stream_scopes" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "stream_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_stream_scopes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_stream_scopes_user_id_stream_id_key" ON "user_stream_scopes"("user_id", "stream_id");
CREATE INDEX IF NOT EXISTS "user_stream_scopes_stream_id_idx" ON "user_stream_scopes"("stream_id");
ALTER TABLE "user_stream_scopes" DROP CONSTRAINT IF EXISTS "user_stream_scopes_user_id_fkey";
ALTER TABLE "user_stream_scopes" ADD CONSTRAINT "user_stream_scopes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_stream_scopes" DROP CONSTRAINT IF EXISTS "user_stream_scopes_stream_id_fkey";
ALTER TABLE "user_stream_scopes" ADD CONSTRAINT "user_stream_scopes_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "action" TEXT NOT NULL,
  "resource_type" TEXT,
  "resource_id" TEXT,
  "entity_id" TEXT,
  "stream_id" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_stream_id_idx" ON "audit_logs"("stream_id");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_user_id_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
