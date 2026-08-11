-- per-نشاط full details: JSON array of ActivityDetail on every item.
-- Each child (نشاط / خدمة فرعية) carries its own sector/dept/section,
-- automation, matrix and أولوية التحول; the legacy flat columns keep
-- mirroring the FIRST entry for compatibility with older records/reports.
ALTER TABLE "items" ADD COLUMN "activities" JSONB;
