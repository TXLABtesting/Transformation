-- سجل الجهات المعتمد: تصنيف الجهة وترتيبها في الوثيقة، وتاريخ آخر تعديل.
-- إضافة فقط — لا تمسّ أي بيانات قائمة.
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'أخرى';
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 999;
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "entities_sort_order_idx" ON "entities"("sort_order");
