// ============================================================================
// حالة نسخة وزارة شؤون مجلس الوزراء — مخزن مستقل تماماً
// مفتاح تخزين خاص (aigp_moca_state) حتى لا تتداخل مع منصة الجهات الاتحادية.
// ============================================================================
'use client';
import { create } from 'zustand';
import {
  MOCA_UNITS,
  MOCA_FIELDS,
  mocaMissing,
  mocaUnitById,
  type MocaEntry,
  type MocaRole,
  type MocaWf,
} from './moca';

const KEY = 'aigp_moca_state';

export type MocaConfirm = {
  title: string;
  body: string;
  okLabel: string;
  danger?: boolean;
  onOk: () => void;
} | null;

export type MocaBulkRow = {
  data: Partial<MocaEntry>;
  missing: string[];
};

export type MocaState = {
  _hydrated: boolean;
  role: MocaRole;
  unitId: string;
  unitSector: string;
  entries: MocaEntry[];
  toast: string;
  // واجهة
  view: 'list' | 'form' | 'bulk';
  editingId: string | null;
  draft: Partial<MocaEntry>;
  reqHighlight: number;
  detailId: string | null;
  bulkRows: MocaBulkRow[];
  bulkLoaded: boolean;
  bulkError: string;
  confirm: MocaConfirm;
  returnTarget: { id: string; kind: 'info' | 'reject' } | null;
  // فلاتر
  fUnit: string;
  fStatus: string;
  fTransform: string;
  search: string;
  // إجراءات
  hydrate: () => void;
  setRole: (r: MocaRole) => void;
  setScope: (unitId: string, sector: string) => void;
  openForm: (id?: string) => void;
  closeForm: () => void;
  setDraft: (k: string, v: unknown) => void;
  saveDraft: (send: boolean) => void;
  openDetail: (id: string | null) => void;
  submitEntry: (id: string) => void;
  submitMany: (ids: string[]) => void;
  removeEntry: (id: string) => void;
  approveEntry: (id: string) => void;
  /** يفتح نافذة الملاحظة قبل الإعادة أو الرفض */
  openReturn: (id: string, kind: 'info' | 'reject') => void;
  closeReturn: () => void;
  openBulk: () => void;
  closeBulk: () => void;
  setBulkRows: (rows: MocaBulkRow[], err?: string) => void;
  saveBulk: () => void;
  setFilter: (k: 'fUnit' | 'fStatus' | 'fTransform' | 'search', v: string) => void;
  setConfirm: (c: MocaConfirm) => void;
  showToast: (m: string) => void;
};

const now = () => new Date().toISOString();
const uid = () => 'm-' + Math.random().toString(36).slice(2, 10);

const blankDraft = (unitId: string, unitSector: string): Partial<MocaEntry> => {
  const d: Partial<MocaEntry> = { unitId, unitSector };
  for (const f of MOCA_FIELDS) d[f.key] = '';
  // القطاع المعني يُعبّأ مسبقاً بقطاع المنسق إن وُجد
  if (unitSector) d.sector = unitSector;
  return d;
};

export const useMoca = create<MocaState>((set, get) => {
  const persist = () => {
    if (typeof window === 'undefined') return;
    const s = get();
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ role: s.role, unitId: s.unitId, unitSector: s.unitSector, entries: s.entries })
      );
    } catch {
      /* التخزين ممتلئ — تُتجاهل */
    }
  };

  const toast = (m: string) => {
    set({ toast: m });
    setTimeout(() => {
      if (get().toast === m) set({ toast: '' });
    }, 2600);
  };

  return {
    _hydrated: false,
    role: 'coord',
    unitId: MOCA_UNITS[0].id,
    unitSector: '',
    entries: [],
    toast: '',
    view: 'list',
    editingId: null,
    draft: {},
    reqHighlight: 0,
    detailId: null,
    bulkRows: [],
    bulkLoaded: false,
    bulkError: '',
    confirm: null,
    returnTarget: null,
    fUnit: 'all',
    fStatus: 'all',
    fTransform: 'all',
    search: '',

    hydrate: () => {
      if (get()._hydrated) return;
      let saved: Partial<MocaState> | null = null;
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
        if (raw) saved = JSON.parse(raw) as Partial<MocaState>;
      } catch {
        saved = null;
      }
      set({
        _hydrated: true,
        role: (saved?.role as MocaRole) || 'coord',
        unitId: (saved?.unitId as string) || MOCA_UNITS[0].id,
        unitSector: (saved?.unitSector as string) || '',
        entries: Array.isArray(saved?.entries) ? (saved!.entries as MocaEntry[]) : [],
      });
    },

    setRole: (r) => {
      set({ role: r, view: 'list', detailId: null });
      persist();
    },

    setScope: (unitId, sector) => {
      const u = mocaUnitById(unitId);
      const s = u.sectors?.length ? sector || u.sectors[0] : '';
      set({ unitId, unitSector: s, detailId: null });
      persist();
    },

    openForm: (id) => {
      const s = get();
      if (id) {
        const e = s.entries.find((x) => x.id === id);
        if (!e) return;
        set({ view: 'form', editingId: id, draft: { ...e }, reqHighlight: 0, detailId: null });
      } else {
        set({ view: 'form', editingId: null, draft: blankDraft(s.unitId, s.unitSector), reqHighlight: 0, detailId: null });
      }
    },

    closeForm: () => set({ view: 'list', editingId: null, draft: {}, reqHighlight: 0 }),

    setDraft: (k, v) => set((s) => ({ draft: { ...s.draft, [k]: v } })),

    saveDraft: (send) => {
      const s = get();
      const d = s.draft;
      const missing = mocaMissing(d);
      if (send && missing.length) {
        set({ reqHighlight: s.reqHighlight + 1 });
        return toast('يرجى استكمال الحقول المطلوبة: ' + missing.slice(0, 3).join('، ') + (missing.length > 3 ? '…' : ''));
      }
      const wf: MocaWf = send ? 'pending' : 'draft';
      if (s.editingId) {
        set((st) => ({
          entries: st.entries.map((e) =>
            e.id === s.editingId
              ? ({ ...e, ...d, wf, ret: send ? null : e.ret, submittedAt: send ? now() : e.submittedAt } as MocaEntry)
              : e
          ),
        }));
      } else {
        const e: MocaEntry = {
          ...(d as MocaEntry),
          id: uid(),
          unitId: s.unitId,
          unitSector: s.unitSector,
          wf,
          ret: null,
          createdAt: now(),
          submittedAt: send ? now() : undefined,
        };
        set((st) => ({ entries: [e, ...st.entries] }));
      }
      set({ view: 'list', editingId: null, draft: {}, reqHighlight: 0 });
      persist();
      toast(send ? 'تم الإرسال لاعتماد اللجنة الوطنية' : 'تم الحفظ كمسودة');
    },

    openDetail: (id) => set({ detailId: id }),

    submitEntry: (id) => {
      const e = get().entries.find((x) => x.id === id);
      if (!e) return;
      const missing = mocaMissing(e);
      if (missing.length) return toast('لا يمكن الإرسال — حقول ناقصة: ' + missing.slice(0, 3).join('، '));
      set((st) => ({
        entries: st.entries.map((x) => (x.id === id ? { ...x, wf: 'pending', ret: null, submittedAt: now() } : x)),
      }));
      persist();
      toast('تم الإرسال لاعتماد اللجنة الوطنية');
    },

    submitMany: (ids) => {
      const st = get();
      const pick = st.entries.filter((e) => ids.includes(e.id) && e.wf === 'draft');
      const ok = pick.filter((e) => !mocaMissing(e).length).map((e) => e.id);
      if (ok.length) {
        set((s2) => ({
          entries: s2.entries.map((x) => (ok.includes(x.id) ? { ...x, wf: 'pending', ret: null, submittedAt: now() } : x)),
        }));
        persist();
      }
      const short = pick.length - ok.length;
      toast(
        ok.length
          ? 'تم إرسال ' + ok.length + (ok.length === 1 ? ' مدخل' : ' مدخلات') + ' لاعتماد اللجنة الوطنية' + (short ? ' — و' + short + ' بحاجة إلى استكمال' : '')
          : 'لم يُرسل أي مدخل — نرجو استكمال الحقول الناقصة أولاً'
      );
    },

    removeEntry: (id) => {
      const e = get().entries.find((x) => x.id === id);
      if (!e) return;
      if (e.wf === 'approved') return toast('لا يمكن إزالة مدخل معتمد');
      set({
        confirm: {
          title: 'إزالة المدخل',
          body: 'سيتم إزالة «' + String(e.subProcess || e.mainProcess || '') + '» نهائياً.',
          okLabel: 'إزالة نهائياً',
          danger: true,
          onOk: () => {
            set((st) => ({
              entries: st.entries.filter((x) => x.id !== id),
              detailId: st.detailId === id ? null : st.detailId,
              confirm: null,
            }));
            persist();
            toast('تمت إزالة المدخل');
          },
        },
      });
    },

    approveEntry: (id) => {
      set((st) => ({
        entries: st.entries.map((x) => (x.id === id ? { ...x, wf: 'approved', ret: null, decidedAt: now() } : x)),
      }));
      persist();
      toast('تم اعتماد المدخل');
    },

    openReturn: (id, kind) => set({ returnTarget: { id, kind } }),
    closeReturn: () => set({ returnTarget: null }),

    openBulk: () => set({ view: 'bulk', bulkRows: [], bulkLoaded: false, bulkError: '' }),
    closeBulk: () => set({ view: 'list', bulkRows: [], bulkLoaded: false, bulkError: '' }),
    setBulkRows: (rows, err) => set({ bulkRows: rows, bulkLoaded: true, bulkError: err || '' }),

    // كل الصفوف تُحفظ مسودات — لا شيء يذهب مباشرة للاعتماد
    saveBulk: () => {
      const s = get();
      if (!s.bulkRows.length) return toast('لا توجد صفوف صالحة للحفظ');
      const add: MocaEntry[] = s.bulkRows.map((r) => ({
        ...(r.data as MocaEntry),
        id: uid(),
        unitId: s.unitId,
        unitSector: s.unitSector,
        wf: 'draft' as MocaWf,
        ret: null,
        createdAt: now(),
      }));
      set((st) => ({ entries: [...add, ...st.entries], view: 'list', bulkRows: [], bulkLoaded: false }));
      persist();
      toast('تم حفظ ' + add.length + ' مدخلاً كمسودات — راجعها ثم أرسلها للاعتماد');
    },

    setFilter: (k, v) => set({ [k]: v } as unknown as Partial<MocaState>),
    setConfirm: (c) => set({ confirm: c }),
    showToast: toast,
  };
});

/** المدخلات المعروضة للدور الحالي بعد تطبيق الفلاتر */
export function mocaVisibleEntries(s: MocaState): MocaEntry[] {
  const base =
    s.role === 'coord'
      ? s.entries.filter((e) => e.unitId === s.unitId && (!s.unitSector || e.unitSector === s.unitSector))
      : s.entries.filter((e) => e.wf !== 'draft');
  const q = s.search.trim();
  return base.filter((e) => {
    if (s.role === 'committee' && s.fUnit !== 'all' && e.unitId !== s.fUnit) return false;
    if (s.fStatus !== 'all') {
      if (s.fStatus === 'draft' && !(e.wf === 'draft' && !e.ret)) return false;
      if (s.fStatus === 'pending' && e.wf !== 'pending') return false;
      if (s.fStatus === 'approved' && e.wf !== 'approved') return false;
      if (s.fStatus === 'info' && e.ret?.type !== 'info') return false;
      if (s.fStatus === 'rejected' && e.ret?.type !== 'reject') return false;
    }
    if (s.fTransform !== 'all' && String(e.transformability || '') !== s.fTransform) return false;
    if (q && !((String(e.mainProcess || '') + ' ' + String(e.subProcess || '')).includes(q))) return false;
    return true;
  });
}

/** إعادة/رفض مع ملاحظة — تُستدعى من نافذة الملاحظة في الواجهة */
export function mocaApplyReturn(id: string, kind: 'info' | 'reject', note: string) {
  const st = useMoca.getState();
  useMoca.setState({
    entries: st.entries.map((e) =>
      e.id === id
        ? { ...e, wf: 'draft' as MocaWf, ret: { type: kind, note: note.trim(), at: new Date().toISOString() } }
        : e
    ),
    returnTarget: null,
    detailId: null,
  });
  try {
    const s = useMoca.getState();
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ role: s.role, unitId: s.unitId, unitSector: s.unitSector, entries: s.entries })
    );
  } catch {
    /* ignore */
  }
  useMoca.getState().showToast(kind === 'reject' ? 'تم رفض المدخل وإعادته للمنسق' : 'تمت إعادة المدخل للتعديل');
}
