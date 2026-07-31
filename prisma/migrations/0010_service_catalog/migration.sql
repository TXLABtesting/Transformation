-- دليل الخدمات الاتحادية: main/sub services per entity (services-stream dropdowns)
CREATE TABLE "service_catalog" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "main_service" TEXT NOT NULL,
    "sub_service" TEXT NOT NULL,
    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_catalog_entity_id_main_service_sub_service_key" ON "service_catalog"("entity_id", "main_service", "sub_service");

CREATE INDEX "service_catalog_entity_id_idx" ON "service_catalog"("entity_id");

ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
