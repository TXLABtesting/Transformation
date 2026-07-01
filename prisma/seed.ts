// Seeds Postgres for the server (Docker) deployment: the real federal entities
// registry + the prototype's 14 demo items. Idempotent (upserts by id).
import { PrismaClient } from '@prisma/client';
import { seedItems } from '../lib/seed';
import { entOf, DEFAULT_ENTITY } from '../lib/domain';
import { FEDERAL_ENTITIES } from '../lib/entities';

const prisma = new PrismaClient();

async function main() {
  // 1) Entities: the real 34 federal entities + the two prototype entities.
  const names = Array.from(new Set([DEFAULT_ENTITY, ...FEDERAL_ENTITIES]));
  const entityByName = new Map<string, string>();
  for (const nameAr of names) {
    const e = await prisma.entity.upsert({
      where: { nameAr },
      update: {},
      create: { nameAr },
    });
    entityByName.set(nameAr, e.id);
  }

  // 2) Items (prototype seed, verbatim).
  for (const it of seedItems()) {
    const entName = entOf(it, DEFAULT_ENTITY);
    const entityId = entityByName.get(entName) || null;
    const { id, phases, milestones, launches, execChecklist, steps, links, log, ret, nom, funded, fundCancel, fyi, ...rest } =
      it as Record<string, unknown> & { id: string };
    await prisma.item.upsert({
      where: { id },
      update: {},
      create: {
        id,
        ...(rest as object),
        entityId,
        phases: (phases as object) ?? undefined,
        milestones: (milestones as object) ?? undefined,
        launches: (launches as object) ?? undefined,
        execChecklist: (execChecklist as object) ?? undefined,
        steps: (steps as object) ?? undefined,
        links: (links as object) ?? undefined,
        log: (log as object) ?? undefined,
        ret: (ret as object) ?? undefined,
        nom: (nom as object) ?? undefined,
        funded: (funded as object) ?? undefined,
        fundCancel: (fundCancel as object) ?? undefined,
        fyi: (fyi as object) ?? undefined,
      } as never,
    });
  }

  console.log(`Seeded ${names.length} entities and ${seedItems().length} items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
