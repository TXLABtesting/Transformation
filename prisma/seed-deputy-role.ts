// ============================================================================
// Adds the "نائب رئيس المسار" (stream deputy) role to the RBAC tables.
//
// This is deliberately a separate, standalone script — NOT folded into
// prisma/seed.ts — so it does exactly one thing and nothing else: it does
// not touch entities/streams/items/settings/starter-accounts, and running
// the main seed later won't re-run or conflict with it.
//
// Per the product's own docs (docs/roles-pages-access.md §3.2): "نائب رئيس
// المسار — Same review powers as the stream head." So this role's
// permissions are copied live from whatever `stream_owner` currently has —
// not a hardcoded list — so the two can never silently drift apart.
//
// Idempotent (upsert-based): safe to run more than once, and safe to run
// again later if stream_owner's permission set changes (it will re-sync
// stream_deputy to match).
//
// Run once per environment:
//   npx tsx prisma/seed-deputy-role.ts
// ============================================================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HEAD_ROLE_CODE = 'stream_owner';
const DEPUTY_ROLE_CODE = 'stream_deputy';
const DEPUTY_ROLE_NAME_AR = 'فريق عمل المسار في المشروع (نائب)';

async function main() {
  const head = await prisma.role.findUnique({
    where: { code: HEAD_ROLE_CODE },
    include: { permissions: true },
  });
  if (!head) {
    throw new Error(
      `"${HEAD_ROLE_CODE}" role not found — run the main seed first: npx tsx prisma/seed.ts`
    );
  }

  const deputy = await prisma.role.upsert({
    where: { code: DEPUTY_ROLE_CODE },
    update: { nameAr: DEPUTY_ROLE_NAME_AR },
    create: { code: DEPUTY_ROLE_CODE, nameAr: DEPUTY_ROLE_NAME_AR },
  });

  for (const rp of head.permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: deputy.id, permissionId: rp.permissionId } },
      update: {},
      create: { roleId: deputy.id, permissionId: rp.permissionId },
    });
  }

  console.log(
    `✔ role "${DEPUTY_ROLE_CODE}" (${DEPUTY_ROLE_NAME_AR}) has ${head.permissions.length} permission(s), mirrored from "${HEAD_ROLE_CODE}".`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
