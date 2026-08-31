-- هوية العضو المسؤول على تعريف المشروع الاستراتيجي: معرّف حسابه وبريده —
-- بهما يُحصر ما يراه كل عضو في مشاريعه وحدها، ويُنشأ الحساب بالبريد من
-- صفحة اللجنة عند الحاجة. إضافي بالكامل على جدول proj_defs (المُنشأ في 0015)
-- ولا يمس أي جدول من البنية الأصلية.
ALTER TABLE "proj_defs" ADD COLUMN IF NOT EXISTS "member_id" TEXT;
ALTER TABLE "proj_defs" ADD COLUMN IF NOT EXISTS "member_email" TEXT;
CREATE INDEX IF NOT EXISTS "proj_defs_member_id_idx" ON "proj_defs"("member_id");
