-- مدخلات المنصة (العمليات/المهام/الخدمات) تُحفظ في كتلة الحالة app_state.data.items
-- وليس في جدول items؛ لذلك يشير item_id إلى معرّف المدخل داخل الكتلة ولا يحمل
-- مفتاحاً أجنبياً. (المفتاح السابق كان يرفض أي ربط لمدخل غير موجود في جدول items.)
ALTER TABLE "item_activity_assistants" DROP CONSTRAINT IF EXISTS "item_activity_assistants_item_id_fkey";
CREATE INDEX IF NOT EXISTS "item_activity_assistants_item_id_idx" ON "item_activity_assistants"("item_id");
