-- ربط المساعد على مستوى المدخل كله يُخزَّن بقيمة فارغة ('') بدل NULL حتى يطبَّق
-- قيد التفرد (item_id, activity_id, assistant_id) عليه أيضاً (NULL لا يُقارَن في القيد).
UPDATE "item_activity_assistants" SET "activity_id" = '' WHERE "activity_id" IS NULL;
ALTER TABLE "item_activity_assistants" ALTER COLUMN "activity_id" SET DEFAULT '';
ALTER TABLE "item_activity_assistants" ALTER COLUMN "activity_id" SET NOT NULL;
