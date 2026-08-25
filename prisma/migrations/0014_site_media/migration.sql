-- وسائط الموقع العام: مخزن مرفقات لوحة المشرف (صور وفيديو الصفحات العامة).
-- جدول مستقل تماماً — لا يمس أي جدول قائم.
CREATE TABLE IF NOT EXISTS "site_media" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_media_pkey" PRIMARY KEY ("id")
);
