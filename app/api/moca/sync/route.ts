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
import { handleApiError, getIp } from '@/lib/security/http';
import { isGlobalRole } from '@/lib/security/rbac';
import { assertMocaView, canWriteMoca, mocaInScope, mocaScopesForUser } from '@/lib/security/moca-access';
import { writeAuditLog } from '@/lib/security/audit';
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
    // وحدات المستخدم المسندة — قد تكون أكثر من وحدة/قطاع، وبلا إسناد يعمل
    // على الوزارة كلها. الكتابة تُقصر على الوحدة الواردة إن كانت ضمن نطاقه.
    const scopes = await mocaScopesForUser(u);
    const writer = canWriteMoca(u);

    if (!global && !writer) return NextResponse.json({ ok: true, skipped: true });

    const superAdmin = u.roles.includes('system_admin');
    const audit = (action: string, metadata: object) =>
      writeAuditLog({
        actorUserId: u.id,
        action,
        resourceType: 'moca',
        ipAddress: getIp(req),
        userAgent: req.headers.get('user-agent'),
        metadata: metadata as never,
      });

    // ---- اللجنة: حقول القرار فقط على الصفوف القائمة ----
    if (global && !superAdmin) {
      const decided: string[] = [];
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
        decided.push(id);
      }
      await audit('moca_decisions', { entries: decided.length, ids: decided.slice(0, 200) });
      return NextResponse.json({ ok: true, mode: 'decisions' });
    }

    // ---- مشرف النظام: كتابة كاملة بالنيابة على كل الوحدات (مدقَّقة) ----
    // تحديث/إنشاء بالمعرّف فقط. الحذف بالغياب مقصور على ما أنشأه المشرف
    // بنفسه — صفوف المنسقين لا يمسحها غياب من متصفح غير محدّث.
    if (superAdmin) {
      const touched: string[] = [];
      for (const e of entries) {
        const id = str(e.id);
        const unitId = String(e.unitId || '');
        if (!unitId) continue;
        const fields: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(e)) if (!MOCA_ENTRY_COLS.has(k)) fields[k] = v;
        const ret = (e.ret || null) as { type?: string; note?: string; at?: string } | null;
        const data = {
          unitId,
          unitSector: String(e.unitSector || ''),
          wf: str(e.wf) || 'draft',
          retType: ret ? String(ret.type || 'info') : null,
          retNote: ret ? String(ret.note || '') : null,
          retAt: ret ? dt(ret.at) ?? new Date() : null,
          fields: fields as object,
          execBatch: str(e.execBatch) ?? null,
          startDate: str(e.startDate) ?? null,
          endDate: str(e.endDate) ?? null,
          batchWf: str(e.batchWf) ?? null,
          batchRet: str(e.batchRet) ?? null,
          batchNote: str(e.batchNote) ?? null,
          submittedAt: dt(e.submittedAt),
          decidedAt: dt(e.decidedAt),
        };
        if (id) {
          const cur = await prisma.mocaEntry.findUnique({ where: { id }, select: { id: true } });
          if (cur) await prisma.mocaEntry.update({ where: { id }, data });
          else await prisma.mocaEntry.create({ data: { ...data, id, createdById: u.id } });
          touched.push(id);
        } else {
          const created = await prisma.mocaEntry.create({ data: { ...data, createdById: u.id } });
          touched.push(created.id);
        }
      }
      await prisma.mocaEntry.deleteMany({
        where: { createdById: u.id, wf: { not: 'approved' }, id: { notIn: touched.length ? touched : ['__none__'] } },
      });
      const ucTouched: string[] = [];
      for (const c of useCases) {
        const id = str(c.id);
        const data = {
          entryId: str(c.entryId) ?? null,
          unitId: String(c.unitId || ''),
          unitSector: String(c.unitSector || ''),
          mainProcess: String(c.mainProcess || ''),
          subProcess: String(c.subProcess || ''),
          status: String(c.status || ''),
          updates: (Array.isArray(c.updates) ? c.updates : []) as object,
        };
        if (!data.unitId) continue;
        if (id) {
          const cur = await prisma.mocaUseCase.findUnique({ where: { id }, select: { id: true } });
          if (cur) await prisma.mocaUseCase.update({ where: { id }, data });
          else await prisma.mocaUseCase.create({ data: { ...data, id, createdById: u.id } });
          ucTouched.push(id);
        } else {
          const created = await prisma.mocaUseCase.create({ data: { ...data, createdById: u.id } });
          ucTouched.push(created.id);
        }
      }
      await prisma.mocaUseCase.deleteMany({
        where: { createdById: u.id, id: { notIn: ucTouched.length ? ucTouched : ['__none__'] } },
      });
      await audit('moca_admin_sync', { entries: touched.length, useCases: ucTouched.length });
      return NextResponse.json({ ok: true, mode: 'admin', entries: touched.length, useCases: ucTouched.length });
    }

    // ---- منسق الوزارة: محتوى وحدته إن أُسندت له، وإلا محتوى الوزارة كلها ----
    // في الحالتين لا يطال إلا جداول الوزارة، ولا يعتمد شيئاً بنفسه.
    const inScope = (unitId?: string, unitSector?: string) =>
      !scopes.length ? !!unitId : mocaInScope(scopes, { unitId, unitSector });

    const mine = entries.filter((e) => inScope(str(e.unitId), str(e.unitSector)));
    const keepIds: string[] = [];

    for (const e of mine) {
      const id = str(e.id);
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(e)) if (!MOCA_ENTRY_COLS.has(k)) fields[k] = v;
      const ret = (e.ret || null) as { type?: string; note?: string; at?: string } | null;
      const data = {
        // الوحدة كما وردت — «mine» مصفاة أصلاً على وحدات المستخدم المسندة
        unitId: String(e.unitId || ''),
        unitSector: String(e.unitSector || ''),
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
    const scopeWhere = (sc: { unitId: string; unitSector: string }) =>
      sc.unitSector ? { unitId: sc.unitId, unitSector: sc.unitSector } : { unitId: sc.unitId };
    await prisma.mocaEntry.deleteMany({
      where: {
        ...(scopes.length === 0 ? {} : scopes.length === 1 ? scopeWhere(scopes[0]) : { OR: scopes.map(scopeWhere) }),
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
        unitId: String(c.unitId || ''),
        unitSector: String(c.unitSector || ''),
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
        ...(scopes.length === 0 ? {} : scopes.length === 1 ? scopeWhere(scopes[0]) : { OR: scopes.map(scopeWhere) }),
        id: { notIn: ucKeep.length ? ucKeep : ['__none__'] },
      },
    });

    await audit('moca_content_sync', { entries: keepIds.length, useCases: ucKeep.length });
    return NextResponse.json({ ok: true, mode: 'content', entries: keepIds.length, useCases: ucKeep.length });
  } catch (e) {
    return handleApiError(e);
  }
}
