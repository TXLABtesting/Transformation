// ============================================================================
// تحويل صفوف قاعدة البيانات إلى الأشكال التي تتوقعها الواجهة (وبالعكس)
// لنسخة الوزارة والمشاريع الاستراتيجية — منفصل عن ملفات المسارات (route.ts)
// لأن Next.js لا يسمح بتصدير دوال مساعدة منها.
// ============================================================================

const arr = (v: unknown) => (Array.isArray(v) ? v : []);

// ---- الوزارة: مدخلات الحصر -------------------------------------------------
export type MocaEntryRow = {
  id: string; unitId: string; unitSector: string; wf: string;
  retType: string | null; retNote: string | null; retAt: Date | null;
  fields: unknown; execBatch: string | null; startDate: string | null; endDate: string | null;
  batchWf: string | null; batchRet: string | null; batchNote: string | null;
  createdAt: Date; submittedAt: Date | null; decidedAt: Date | null;
};

/** الأعمدة الثابتة — ما عداها يُحفظ ضمن fields (حقول نموذج الوزارة) */
export const MOCA_ENTRY_COLS = new Set([
  'id', 'unitId', 'unitSector', 'wf', 'ret', 'execBatch', 'startDate', 'endDate',
  'batchWf', 'batchRet', 'batchNote', 'createdAt', 'submittedAt', 'decidedAt', 'updatedAt', 'send',
]);

export function mocaEntryToClient(r: MocaEntryRow) {
  const f = (r.fields && typeof r.fields === 'object' ? r.fields : {}) as Record<string, unknown>;
  return {
    ...f,
    id: r.id,
    unitId: r.unitId,
    unitSector: r.unitSector,
    wf: r.wf,
    ret: r.retType ? { type: r.retType, note: r.retNote || '', at: (r.retAt || new Date()).toISOString() } : null,
    execBatch: r.execBatch || undefined,
    startDate: r.startDate || undefined,
    endDate: r.endDate || undefined,
    batchWf: r.batchWf || undefined,
    batchRet: r.batchRet || undefined,
    batchNote: r.batchNote || undefined,
    createdAt: r.createdAt.toISOString(),
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : undefined,
    decidedAt: r.decidedAt ? r.decidedAt.toISOString() : undefined,
  };
}

// ---- الوزارة: حالات الاستخدام ----------------------------------------------
export type MocaUseCaseRow = {
  id: string; entryId: string | null; unitId: string; unitSector: string;
  mainProcess: string; subProcess: string; status: string; updates: unknown; createdAt: Date;
};

export const mocaUseCaseToClient = (r: MocaUseCaseRow) => ({
  id: r.id,
  entryId: r.entryId || undefined,
  unitId: r.unitId,
  unitSector: r.unitSector,
  mainProcess: r.mainProcess,
  subProcess: r.subProcess,
  status: r.status,
  updates: arr(r.updates),
  createdAt: r.createdAt.toISOString(),
});

// ---- المشاريع الاستراتيجية --------------------------------------------------
export type ProjDefRow = {
  id: string; name: string; lead: string; member: string; startMonth: string; endMonth: string;
  memberId?: string | null; memberEmail?: string | null;
};

export const projDefToClient = (r: ProjDefRow) => ({
  id: r.id, name: r.name, lead: r.lead, member: r.member, start: r.startMonth, end: r.endMonth,
  memberId: r.memberId || undefined, memberEmail: r.memberEmail || undefined,
});

export type ProjFormRow = {
  id: string; projId: string; ownerName: string; entityResp: string; description: string;
  outputs: unknown; phases: unknown; team: unknown; wf: string;
  retNote: string | null; retAt: Date | null; log: unknown;
};

export const projFormToClient = (r: ProjFormRow) => ({
  id: r.id,
  projId: r.projId,
  owner: r.ownerName,
  entityResp: r.entityResp,
  desc: r.description,
  outputs: arr(r.outputs) as string[],
  phases: arr(r.phases),
  team: arr(r.team),
  wf: r.wf,
  ret: r.retNote ? { note: r.retNote, at: (r.retAt || new Date()).getTime() } : null,
  log: arr(r.log),
});
