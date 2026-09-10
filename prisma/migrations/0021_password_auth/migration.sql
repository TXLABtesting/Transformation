-- تسجيل الدخول بكلمة مرور + رموز الدعوة/الاستعادة. إضافة فقط.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_set_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_logins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "auth_tokens" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "purpose"    TEXT NOT NULL DEFAULT 'register',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at"    TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "auth_tokens_user_id_idx" ON "auth_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "auth_tokens_expires_at_idx" ON "auth_tokens"("expires_at");
