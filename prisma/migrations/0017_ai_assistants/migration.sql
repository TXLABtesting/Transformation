-- مساعدو الذكاء الاصطناعي وربطهم بالعمليات الفرعية — إضافي بالكامل، لا يمس
-- أي جدول قائم. العمود «اسم مساعد الذكاء الاصطناعي» في قوائم الحصر يُقرأ من
-- هذين الجدولين لاحقاً (فارغ حتى تُدخل البيانات من الخادم).
CREATE TABLE IF NOT EXISTS "ai_assistants" (
  "id"         TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "name_en"    TEXT,
  "desc"       TEXT NOT NULL DEFAULT '',
  "vendor"     TEXT,
  "status"     TEXT NOT NULL DEFAULT 'لم يبدأ بعد',
  "stream_id"  TEXT,
  "entity_id"  TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_assistants_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_assistants_stream_id_idx" ON "ai_assistants"("stream_id");
CREATE INDEX IF NOT EXISTS "ai_assistants_entity_id_idx" ON "ai_assistants"("entity_id");

-- علاقة متعددة-إلى-متعددة: (مدخل، عملية فرعية) ↔ مساعد.
-- activity_id = معرّف العملية الفرعية داخل items.activities (Json)؛ NULL = المدخل كله.
CREATE TABLE IF NOT EXISTS "item_activity_assistants" (
  "id"           TEXT NOT NULL,
  "item_id"      TEXT NOT NULL,
  "activity_id"  TEXT,
  "assistant_id" TEXT NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "item_activity_assistants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "item_activity_assistants_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "item_activity_assistants_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "ai_assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "item_activity_assistants_item_id_activity_id_assistant_id_key" ON "item_activity_assistants"("item_id", "activity_id", "assistant_id");
CREATE INDEX IF NOT EXISTS "item_activity_assistants_assistant_id_idx" ON "item_activity_assistants"("assistant_id");
