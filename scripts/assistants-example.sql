-- ============================================================================
-- مثال تعبئة عمود «اسم مساعد الذكاء الاصطناعي» — للتنفيذ من فريق IT على القاعدة
-- ----------------------------------------------------------------------------
-- العمود يُقرأ من جدولين (ترحيلات 0017 → 0019) ويُلصق بالمدخلات عند كل قراءة
-- لـ GET /api/state؛ لا تخزين مؤقت ولا نسخة داخل كتلة الحالة:
--   ai_assistants               قائمة المساعدين
--   item_activity_assistants    الربط (مدخل، عملية فرعية) ↔ مساعد — متعدد إلى متعدد
--
-- المعرّفات:
--   item_id      = معرّف المدخل داخل كتلة الحالة  app_state.data->'items'[]->>'id'
--   activity_id  = معرّف العملية الفرعية داخل المدخل  activities[]->>'id'
--                  أو '' (نص فارغ) = المدخل كله (كل عملياته الفرعية)
-- ============================================================================

-- 1) استعراض المدخلات وعملياتها الفرعية بمعرّفاتها (للاختيار منها)
SELECT i->>'id'        AS item_id,
       i->>'path'      AS stream,          -- ops | strategy | services
       i->>'entity'    AS entity,
       i->>'title'     AS item_title,
       a->>'id'        AS activity_id,
       a->>'name'      AS activity_name
FROM app_state,
     jsonb_array_elements(data->'items') AS i
     LEFT JOIN LATERAL jsonb_array_elements(COALESCE(i->'activities', '[]'::jsonb)) AS a ON TRUE
WHERE app_state.id = 'singleton'
ORDER BY 2, 3, 4, 6;

-- 2) إضافة مساعدين (id نصّي حر — يُفضَّل ثابتاً ومقروءاً)
INSERT INTO ai_assistants (id, name, name_en, "desc", vendor, status, stream_id, entity_id, updated_at)
VALUES
  ('asst-hr-screening', 'مساعد فرز طلبات التوظيف', 'HR Screening Assistant', 'يفرز الطلبات ويرتّبها حسب المعايير', NULL, 'قيد التنفيذ', 'ops', NULL, now()),
  ('asst-audit',        'مساعد التدقيق الداخلي',   'Internal Audit Assistant', '', NULL, 'لم يبدأ بعد', 'ops', NULL, now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, "desc" = EXCLUDED."desc",
  vendor = EXCLUDED.vendor, status = EXCLUDED.status, stream_id = EXCLUDED.stream_id, entity_id = EXCLUDED.entity_id, updated_at = now();

-- 3) الربط
--   أ) مساعد لعملية فرعية محدّدة (المعرّفان من الاستعلام 1)
INSERT INTO item_activity_assistants (id, item_id, activity_id, assistant_id)
VALUES ('link-0001', '<item_id>', '<activity_id>', 'asst-hr-screening')
ON CONFLICT DO NOTHING;
--   ب) مساعد للمدخل كله (activity_id = '')
INSERT INTO item_activity_assistants (id, item_id, activity_id, assistant_id)
VALUES ('link-0002', '<item_id>', '', 'asst-audit')
ON CONFLICT DO NOTHING;
--   ج) العملية الفرعية نفسها بأكثر من مساعد، أو المساعد نفسه لأكثر من عملية —
--      صف لكل زوج؛ قيد التفرد (item_id, activity_id, assistant_id) يمنع التكرار.

-- 4) إزالة ربط / حذف مساعد (حذف المساعد يحذف روابطه تلقائياً — ON DELETE CASCADE)
-- DELETE FROM item_activity_assistants WHERE id = 'link-0001';
-- DELETE FROM ai_assistants WHERE id = 'asst-audit';

-- 5) مراجعة الروابط الحالية بأسمائها
SELECT l.item_id, i->>'title' AS item_title, l.activity_id,
       COALESCE(a->>'name', '(المدخل كله)') AS activity_name, s.name AS assistant
FROM item_activity_assistants l
JOIN ai_assistants s ON s.id = l.assistant_id
LEFT JOIN app_state st ON st.id = 'singleton'
LEFT JOIN LATERAL jsonb_array_elements(st.data->'items') i ON i->>'id' = l.item_id
LEFT JOIN LATERAL jsonb_array_elements(COALESCE(i->'activities', '[]'::jsonb)) a ON a->>'id' = l.activity_id
ORDER BY 2, 4, 5;
