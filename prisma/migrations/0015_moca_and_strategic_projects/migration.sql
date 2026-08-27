-- ============================================================================
-- 0015 — نسخة وزارة شؤون مجلس الوزراء + المشاريع الاستراتيجية
-- جداول جديدة مستقلة تماماً: لا ALTER ولا DROP على أي جدول قائم، ولا تغيير
-- في بنية الجداول الحالية أو في خطوات النشر.
-- ============================================================================

-- ---- الوزارة: حصر المهام والعمليات -----------------------------------------
CREATE TABLE IF NOT EXISTS "moca_entries" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "unit_sector" TEXT NOT NULL DEFAULT '',
    "wf" TEXT NOT NULL DEFAULT 'draft',
    "ret_type" TEXT,
    "ret_note" TEXT,
    "ret_at" TIMESTAMP(3),
    "fields" JSONB NOT NULL DEFAULT '{}',
    "exec_batch" TEXT,
    "start_date" TEXT,
    "end_date" TEXT,
    "batch_wf" TEXT,
    "batch_ret" TEXT,
    "batch_note" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "decided_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moca_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "moca_entries_unit_id_unit_sector_idx" ON "moca_entries"("unit_id", "unit_sector");
CREATE INDEX IF NOT EXISTS "moca_entries_wf_idx" ON "moca_entries"("wf");

-- ---- الوزارة: حالات الاستخدام ----------------------------------------------
CREATE TABLE IF NOT EXISTS "moca_use_cases" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT,
    "unit_id" TEXT NOT NULL,
    "unit_sector" TEXT NOT NULL DEFAULT '',
    "main_process" TEXT NOT NULL DEFAULT '',
    "sub_process" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "updates" JSONB NOT NULL DEFAULT '[]',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moca_use_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "moca_use_cases_unit_id_unit_sector_idx" ON "moca_use_cases"("unit_id", "unit_sector");

ALTER TABLE "moca_use_cases"
  ADD CONSTRAINT "moca_use_cases_entry_id_fkey"
  FOREIGN KEY ("entry_id") REFERENCES "moca_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---- المشاريع الاستراتيجية: تعريفات اللجنة ---------------------------------
CREATE TABLE IF NOT EXISTS "proj_defs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lead" TEXT NOT NULL DEFAULT '',
    "member" TEXT NOT NULL DEFAULT '',
    "start_month" TEXT NOT NULL DEFAULT '',
    "end_month" TEXT NOT NULL DEFAULT '',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proj_defs_pkey" PRIMARY KEY ("id")
);

-- ---- المشاريع الاستراتيجية: نماذج الأعضاء ----------------------------------
CREATE TABLE IF NOT EXISTS "proj_forms" (
    "id" TEXT NOT NULL,
    "proj_id" TEXT NOT NULL,
    "owner_id" TEXT,
    "owner_name" TEXT NOT NULL DEFAULT '',
    "entity_resp" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "outputs" JSONB NOT NULL DEFAULT '[]',
    "phases" JSONB NOT NULL DEFAULT '[]',
    "team" JSONB NOT NULL DEFAULT '[]',
    "wf" TEXT NOT NULL DEFAULT 'draft',
    "ret_note" TEXT,
    "ret_at" TIMESTAMP(3),
    "log" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proj_forms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "proj_forms_proj_id_key" ON "proj_forms"("proj_id");
CREATE INDEX IF NOT EXISTS "proj_forms_wf_idx" ON "proj_forms"("wf");

ALTER TABLE "proj_forms"
  ADD CONSTRAINT "proj_forms_proj_id_fkey"
  FOREIGN KEY ("proj_id") REFERENCES "proj_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---- إسناد الأعضاء إلى قادة المشاريع ---------------------------------------
-- جدول ربط مستقل بدل إضافة عمود على جدول المستخدمين (لا تغيير في بنيته)
CREATE TABLE IF NOT EXISTS "proj_member_leads" (
    "user_id" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proj_member_leads_pkey" PRIMARY KEY ("user_id")
);
