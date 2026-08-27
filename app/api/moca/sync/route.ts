// ============================================================================
// مزامنة بيانات نسخة الوزارة مع قاعدة البيانات.
// الخادم هو الحكم: لا يكتب المستخدم إلا ما تسمح به صلاحيته —
//  - منسق الوزارة: محتوى مدخلات وحدته فقط (إنشاء/تعديل/حذف/إرسال/توزيع)
//  - اللجنة والمشرف: حقول القرار فقط (اعتماد/إعادة/رفض واعتماد التوزيع)
// أي صف خارج نطاق المستخدم يُتجاهل تماماً ولا يتأثر بكتابته.
// ============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';
import { isGlobalRole } from '@/lib/security/rbac';
import { assertMocaView, canWriteMoca, mocaUnitScopeOf } from '@/lib/security/moca-access';
import { MOCA_ENTRY_COLS } from '@/lib/server/moca-proj-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type InEntry = Record<string, unknown> & { id?: string; unitId?: string; unitSector?: string; wf?: string };
type InUseCase = Record<string, unknown> & { id?: string; unitId?: string };

const str = (v: unknown) => (v === undefined || v === null ? undefined : String(v));
const dt = (v: unknown) => {
  const t = v ? Date.parse(String(v)) : NaN;
  return Number.isNaN(t) ? undefined : new Date(t);
};

export async function POST(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertMocaView(u);
    const body = (await req.json()) as { entries?: InEntry[]; useCases?: InUseCase[] };
    const entries = Array.isArray(body.entries) ? body.entries.slice(0, 3000) : [];
    const useCases = Array.isArray(body.useCases) ? body.useCases.slice(0, 3000) : [];
    const global = isGlobalRole(u);
    const scope = mocaUnitScopeOf(u);
    const writer = canWriteMoca(u);

    if (!global && !writer) return NextResponse.json({ ok: true, skipped: true });

    // ---- اللجنة/المشرف: حقول القرار فقط على الصفوف القائمة ----
    if (global) {
      for (const e of entries) {
        const id = str(e.id);
        if (!id) continue;
        const cur = await prisma.mocaEntry.findUnique({ where: { id }, select: { id: true } });
        if (!cur) continue;
        const ret = (e.ret || null) as { type?: string; note?: string; at?: string } | null;
        await prisma.mocaEntry.update({
          where: { id },
          data: {
            wf: str(e.wf),
            retType: ret ? String(ret.type || 'info') : null,
            retNote: ret ? String(ret.note || '') : null,
            retAt: ret ? dt(ret.at) ?? new Date() : null,
            decidedAt: dt(e.decidedAt) ?? new Date(),
            batchWf: str(e.batchWf) ?? null,
            batchRet: str(e.batchRet) ?? null,
            batchNote: str(e.batchNote) ?? null,
          },
        });
      }
      return NextResponse.json({ ok: true, mode: 'decisions' });
    }

    // ---- منسق الوزارة: محتوى وحدته فقط ----
    if (!scope || !scope.unitId) return NextResponse.json({ ok: true, skipped: true });
    const inScope = (unitId?: string, unitSector?: string) =>
      unitId === scope.unitId && (!scope.unitSector || unitSector === scope.unitSector);

    const mine = entries.filter((e) => inScope(str(e.unitId), str(e.unitSector)));
    const keepIds: string[] = [];

    for (const e of mine) {
      const id = str(e.id);
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(e)) if (!MOCA_ENTRY_COLS.has(k)) fields[k] = v;
      const ret = (e.ret || null) as { type?: string; note?: string; at?: string } | null;
      const data = {
        unitId: scope.unitId,
        unitSector: scope.unitSector || String(e.unitSector || ''),
        // المنسق لا يعتمد: أي حالة غير مسودة/قيد الاعتماد تُترك للخادم
        wf: e.wf === 'pending' ? 'pending' : e.wf === 'approved' ? undefined : 'draft',
        retType: ret ? String(ret.type || 'info') : null,
        retNote: ret ? String(ret.note || '') : null,
        retAt: ret ? dt(ret.at) ?? new Date() : null,
        fields: fields as object,
        execBatch: str(e.execBatch) ?? null,
        startDate: str(e.startDate) ?? null,
        endDate: str(e.endDate) ?? null,
        // اعتماد التوزيع قرار اللجنة — المنسق يرسل مسودة/قيد الاعتماد فقط
        batchWf: e.batchWf === 'approved' ? undefined : (str(e.batchWf) ?? null),
        submittedAt: dt(e.submittedAt),
        createdById: u.id,
      };
      if (id) {
        const cur = await prisma.mocaEntry.findUnique({
          where: { id },
          select: { unitId: true, unitSector: true, wf: true },
        });
        if (cur) {
          // لا يُعدّل المنسق مدخلاً خارج وحدته
          if (!inScope(cur.unitId, cur.unitSector)) continue;
          await prisma.mocaEntry.update({ where: { id }, data });
          keepIds.push(id);
          continue;
        }
        // معرّف من المتصفح لصف جديد — يُنشأ بالمعرّف نفسه ليبقى الربط ثابتاً
        await prisma.mocaEntry.create({ data: { ...data, id, wf: data.wf || 'draft' } });
        keepIds.push(id);
        continue;
      }
      const created = await prisma.mocaEntry.create({ data: { ...data, wf: data.wf || 'draft' } });
      keepIds.push(created.id);
    }

    // ما حُذف محلياً يُحذف على الخادم — ضمن نطاق المنسق وغير المعتمد فقط
    await prisma.mocaEntry.deleteMany({
      where: {
        unitId: scope.unitId,
        ...(scope.unitSector ? { unitSector: scope.unitSector } : {}),
        wf: { not: 'approved' },
        id: { notIn: keepIds.length ? keepIds : ['__none__'] },
      },
    });

    // ---- حالات الاستخدام ضمن النطاق نفسه ----
    const myUc = useCases.filter((c) => inScope(str(c.unitId), str(c.unitSector)));
    const ucKeep: string[] = [];
    for (const c of myUc) {
      const id = str(c.id);
      const data = {
        entryId: str(c.entryId) ?? null,
        unitId: scope.unitId,
        unitSector: scope.unitSector || String(c.unitSector || ''),
        mainProcess: String(c.mainProcess || ''),
        subProcess: String(c.subProcess || ''),
        status: String(c.status || ''),
        updates: (Array.isArray(c.updates) ? c.updates : []) as object,
        createdById: u.id,
      };
      if (id) {
        const cur = await prisma.mocaUseCase.findUnique({ where: { id }, select: { unitId: true, unitSector: true } });
        if (cur) {
          if (!inScope(cur.unitId, cur.unitSector)) continue;
          await prisma.mocaUseCase.update({ where: { id }, data });
        } else {
          await prisma.mocaUseCase.create({ data: { ...data, id } });
        }
        ucKeep.push(id);
        continue;
      }
      const created = await prisma.mocaUseCase.create({ data });
      ucKeep.push(created.id);
    }
    await prisma.mocaUseCase.deleteMany({
      where: {
        unitId: scope.unitId,
        ...(scope.unitSector ? { unitSector: scope.unitSector } : {}),
        id: { notIn: ucKeep.length ? ucKeep : ['__none__'] },
      },
    });

    return NextResponse.json({ ok: true, mode: 'content', entries: keepIds.length, useCases: ucKeep.length });
  } catch (e) {
    return handleApiError(e);
  }
}
