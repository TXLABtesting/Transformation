-- CreateTable: role_assignment_rules
-- Allows admins/entity reps to pre-configure email-to-role mappings
-- so that users automatically get their role on first login.

CREATE TABLE IF NOT EXISTS "role_assignment_rules" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role_code" TEXT NOT NULL,
  "entity_id" TEXT,
  "stream_id" TEXT,
  "display_name" TEXT,
  "is_consumed" BOOLEAN NOT NULL DEFAULT false,
  "consumed_at" TIMESTAMP(3),
  "consumed_by" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_assignment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "role_assignment_rules_email_key"
ON "role_assignment_rules"("email");

CREATE INDEX IF NOT EXISTS "role_assignment_rules_role_code_idx"
ON "role_assignment_rules"("role_code");

CREATE INDEX IF NOT EXISTS "role_assignment_rules_is_consumed_idx"
ON "role_assignment_rules"("is_consumed");

-- Note: No foreign keys on entity_id/stream_id to avoid deployment failures
-- when a rule references an entity or stream that may not yet exist.
-- The application layer validates these references at runtime.
