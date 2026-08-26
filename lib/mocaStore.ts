// ============================================================================
// حالة نسخة وزارة شؤون مجلس الوزراء — مخزن مستقل تماماً
// مفتاح تخزين خاص (aigp_moca_state) حتى لا تتداخل مع منصة الجهات الاتحادية.
// ============================================================================
'use client';
import { create } from 'zustand';
import {
  MOCA_UNITS,
  MOCA_FIELDS,
  MOCA_BATCHES,
  mocaMissing,
  mocaUnitById,
  mocaAutoSector,
  mocaScopeFromEntity,
  mocaPlacementLocked,
  mocaPlacementState,
  MOCA_UC_STATUSES,
  type MocaEntry,
  type MocaRole,
  type MocaWf,
  type MocaUseCase,
} from './moca';

const KEY = 'aigp_moca_state';
// نسخة البيانات: رفع الرقم يعيد ضبط بيانات الوزارة المخزنة في المتصفحات
// (تنظيف بيانات العرض) — الإدخالات الجديدة بعدها تُحفظ طبيعياً
const MOCA_DATA_V = 3;

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
  useCases: MocaUseCase[];
  toast: string;
  // واجهة
  view: 'list' | 'form' | 'bulk' | 'batches' | 'usecases';
  editingId: string | null;
  draft: Partial<MocaEntry>;
  reqHighlight: number;
  detailId: string | null;
  bulkRows: MocaBulkRow[];
  bulkLoaded: boolean;
  bulkError: string;
  confirm: MocaConfirm;
  returnTarget: { id: string; kind: 'info' | 'reject' } | null;
  placeReturnTarget: { id: string; kind: 'info' | 'reject' } | null;
  // فلاتر
  fUnit: string;
  fStatus: string;
  fTransform: string;
  search: string;
  // إجراءات
  hydrate: () => void;
  setRole: (r: MocaRole) => void;
  setScope: (unitId: string, sector: string) => void;
  syncSession: (r: MocaRole, entityName?: string) => void;
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
  // دفعات الإطلاق
  openBatches: () => void;
  closeBatches: () => void;
  assignBatch: (id: string, batch: string) => void;
  setBatchDate: (id: string, k: 'startDate' | 'endDate', v: string) => void;
  submitPlacements: (ids?: string[]) => void;
  approvePlacement: (id: string) => void;
  openPlaceReturn: (id: string, kind: 'info' | 'reject') => void;
  closePlaceReturn: () => void;
  // حالات الاستخدام
  openUseCases: () => void;
  closeUseCases: () => void;
  addUseCase: (entryId: string) => void;
  setUseCaseStatus: (id: string, status: string) => void;
  /** التاريخ يُلتقط تلقائياً لحظة الإضافة */
  addUcUpdate: (id: string, text: string, vendor: string) => void;
  removeUseCase: (id: string) => void;
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
  // النِّسب تبدأ من صفر لأن شريط التمرير يعرض قيمة دائماً
  for (const f of MOCA_FIELDS) d[f.key] = f.type === 'percent' ? '0' : '';
  // القطاع المعني يُعبَّأ آلياً من نطاق المنسق — حقل غير قابل للتحرير
  d.sector = mocaAutoSector(unitId, unitSector);
  return d;
};

export const useMoca = create<MocaState>((set, get) => {
  const persist = () => {
    if (typeof window === 'undefined') return;
    const s = get();
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ v: MOCA_DATA_V, role: s.role, unitId: s.unitId, unitSector: s.unitSector, entries: s.entries, useCases: s.useCases })
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
    useCases: [],
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
    placeReturnTarget: null,
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
      const freshData = (saved as { v?: number } | null)?.v !== MOCA_DATA_V;
      set({
        _hydrated: true,
        role: (saved?.role as MocaRole) || 'coord',
        unitId: (saved?.unitId as string) || MOCA_UNITS[0].id,
        unitSector: (saved?.unitSector as string) || '',
        entries: !freshData && Array.isArray(saved?.entries) ? (saved!.entries as MocaEntry[]) : [],
        useCases: !freshData && Array.isArray(saved?.useCases) ? (saved!.useCases as MocaUseCase[]) : [],
      });
    },

    // تبديل الدور/النطاق متاح في النسخة التجريبية فقط — في النسخة الحية
    // يُشتقان من جلسة الدخول (syncSession) ولا يظهر مبدّل في الواجهة.
    setRole: (r) => {
      if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1') return;
      set({ role: r, view: 'list', detailId: null });
      persist();
    },

    setScope: (unitId, sector) => {
      if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1') return;
      const u = mocaUnitById(unitId);
      const s = u.sectors?.length ? sector || u.sectors[0] : '';
      set({ unitId, unitSector: s, detailId: null });
      persist();
    },

    // النسخة الحية: صفحة /moca تستدعيها بعد قراءة جلسة المنصة لتثبيت الدور
    // والنطاق من سجل المستخدم — لا مبدّل ولا قيم مفترضة في الواجهة.
    syncSession: (r, entityName) => {
      const s = get();
      const scope = mocaScopeFromEntity(entityName, { unitId: s.unitId, unitSector: s.unitSector });
      const same = s.role === r && scope.unitId === s.unitId && scope.unitSector === s.unitSector;
      if (same) return;
      set({ role: r, ...scope, view: 'list', detailId: null });
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
      // القطاع المعني يُفرض دائماً من نطاق المستخدم
      const d = { ...s.draft, sector: mocaAutoSector(s.unitId, s.unitSector) };
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

    // ---- دفعات الإطلاق: توزيع المدخلات المعتمدة ودورة اعتماد التوزيع ----
    openBatches: () => set({ view: 'batches', detailId: null, editingId: null, draft: {} }),
    closeBatches: () => set({ view: 'list' }),

    assignBatch: (id, batch) => {
      const e = get().entries.find((x) => x.id === id);
      if (!e) return;
      if (mocaPlacementLocked(e)) return toast('التوزيع قيد الاعتماد أو معتمد — لا يمكن تغييره');
      if (batch && e.wf !== 'approved') return toast('يُوزَّع على دفعات الإطلاق المدخل المعتمد فقط');
      set((st) => ({
        entries: st.entries.map((x) => {
          if (x.id !== id) return x;
          if (!batch) {
            return {
              ...x,
              execBatch: undefined,
              startDate: undefined,
              endDate: undefined,
              batchWf: undefined,
              batchRet: undefined,
              batchNote: undefined,
            };
          }
          const b = MOCA_BATCHES.find((bb) => bb.name === batch);
          const clamp = (v?: string) => {
            if (!b || !v) return b ? b.start : v;
            return v < b.start ? b.start : v > b.end ? b.end : v;
          };
          return {
            ...x,
            execBatch: batch,
            startDate: clamp(x.startDate) || b?.start,
            endDate: x.endDate && b && x.endDate >= b.start && x.endDate <= b.end ? x.endDate : b?.end,
            batchWf: 'draft' as const,
            batchRet: undefined,
            batchNote: undefined,
          };
        }),
      }));
      persist();
    },

    setBatchDate: (id, k, v) => {
      const e = get().entries.find((x) => x.id === id);
      if (!e) return;
      if (mocaPlacementLocked(e)) return toast('التوزيع قيد الاعتماد أو معتمد — لا يمكن تغييره');
      const b = MOCA_BATCHES.find((bb) => bb.name === e.execBatch);
      let val = v;
      if (b && val) {
        if (val < b.start || val > b.end) {
          val = val < b.start ? b.start : b.end;
          toast('التاريخ خارج نافذة الدفعة (' + b.period + ') — تم ضبطه على حدودها');
        }
      }
      set((st) => ({ entries: st.entries.map((x) => (x.id === id ? { ...x, [k]: val } : x)) }));
      persist();
    },

    submitPlacements: (ids) => {
      const st = get();
      const scope = st.entries.filter(
        (e) =>
          mocaPlacementState(e) === 'draft' &&
          (!ids || ids.includes(e.id)) &&
          (st.role !== 'coord' || (e.unitId === st.unitId && (!st.unitSector || e.unitSector === st.unitSector)))
      );
      if (!scope.length) return toast('لا توجد توزيعات مسودة لإرسالها');
      const ok = scope.map((e) => e.id);
      set((s2) => ({
        entries: s2.entries.map((x) =>
          ok.includes(x.id) ? { ...x, batchWf: 'pending' as const, batchRet: undefined } : x
        ),
      }));
      persist();
      toast(ok.length === 1 ? 'تم إرسال التوزيع لاعتماد اللجنة الوطنية' : 'تم إرسال ' + ok.length + ' توزيعات لاعتماد اللجنة الوطنية');
    },

    approvePlacement: (id) => {
      const e = get().entries.find((x) => x.id === id);
      if (!e || mocaPlacementState(e) !== 'pending') return;
      set((st) => ({
        entries: st.entries.map((x) =>
          x.id === id ? { ...x, batchWf: 'approved' as const, batchRet: undefined, batchNote: undefined } : x
        ),
      }));
      persist();
      toast('تم اعتماد التوزيع — أصبح مقفلاً');
    },

    openPlaceReturn: (id, kind) => set({ placeReturnTarget: { id, kind } }),
    closePlaceReturn: () => set({ placeReturnTarget: null }),

    // ---- حالات الاستخدام: متابعة ما تعمل عليه الجهات على مهامها المعتمدة ----
    openUseCases: () => set({ view: 'usecases', detailId: null, editingId: null, draft: {} }),
    closeUseCases: () => set({ view: 'list' }),

    addUseCase: (entryId) => {
      const s = get();
      const e = s.entries.find((x) => x.id === entryId);
      if (!e) return;
      if (e.wf !== 'approved') return toast('تُبنى حالات الاستخدام على المدخلات المعتمدة فقط');
      if (s.useCases.some((u) => u.entryId === entryId)) return toast('لهذه المهمة الفرعية حالة استخدام مسجلة');
      const uc: MocaUseCase = {
        id: 'uc-' + Math.random().toString(36).slice(2, 10),
        unitId: e.unitId,
        unitSector: e.unitSector,
        entryId,
        mainProcess: String(e.mainProcess || ''),
        subProcess: String(e.subProcess || ''),
        status: MOCA_UC_STATUSES[0],
        updates: [],
        createdAt: now(),
      };
      set((st) => ({ useCases: [uc, ...st.useCases] }));
      persist();
      toast('تمت إضافة حالة الاستخدام — أضف تحديثاتها');
    },

    setUseCaseStatus: (id, status) => {
      set((st) => ({ useCases: st.useCases.map((u) => (u.id === id ? { ...u, status } : u)) }));
      persist();
    },

    addUcUpdate: (id, text, vendor) => {
      const t = text.trim();
      if (!t) return toast('يرجى كتابة نص التحديث');
      // تاريخ التحديث يُلتقط تلقائياً لحظة الإضافة
      set((st) => ({
        useCases: st.useCases.map((u) =>
          u.id === id ? { ...u, updates: [...u.updates, { text: t, vendor: vendor.trim(), at: now() }] } : u
        ),
      }));
      persist();
      toast('تمت إضافة التحديث');
    },

    removeUseCase: (id) => {
      const uc = get().useCases.find((u) => u.id === id);
      if (!uc) return;
      set({
        confirm: {
          title: 'إزالة حالة الاستخدام',
          body: 'سيتم إزالة حالة الاستخدام «' + (uc.subProcess || uc.mainProcess) + '» وجميع تحديثاتها نهائياً.',
          okLabel: 'إزالة نهائياً',
          danger: true,
          onOk: () => {
            set((st) => ({ useCases: st.useCases.filter((u) => u.id !== id), confirm: null }));
            persist();
            toast('تمت إزالة حالة الاستخدام');
          },
        },
      });
    },

    openBulk: () => set({ view: 'bulk', bulkRows: [], bulkLoaded: false, bulkError: '' }),
    closeBulk: () => set({ view: 'list', bulkRows: [], bulkLoaded: false, bulkError: '' }),
    // القطاع المعني يُفرض من نطاق المستخدم لا من الملف، ثم يُعاد احتساب النواقص
    setBulkRows: (rows, err) => {
      const s = get();
      const sector = mocaAutoSector(s.unitId, s.unitSector);
      const fixed = rows.map((r) => {
        const data = { ...r.data, sector };
        return { data, missing: mocaMissing(data) };
      });
      set({ bulkRows: fixed, bulkLoaded: true, bulkError: err || '' });
    },

    // كل الصفوف تُحفظ مسودات — لا شيء يذهب مباشرة للاعتماد
    saveBulk: () => {
      const s = get();
      if (!s.bulkRows.length) return toast('لا توجد صفوف صالحة للحفظ');
      const add: MocaEntry[] = s.bulkRows.map((r) => ({
        ...(r.data as MocaEntry),
        id: uid(),
        unitId: s.unitId,
        unitSector: s.unitSector,
        // القطاع المعني من نطاق المستخدم لا من الملف
        sector: mocaAutoSector(s.unitId, s.unitSector),
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

/** حالات الاستخدام المعروضة للدور الحالي — المنسق يرى نطاقه، واللجنة الكل */
export function mocaVisibleUseCases(s: MocaState): MocaUseCase[] {
  return s.role === 'coord'
    ? s.useCases.filter((u) => u.unitId === s.unitId && (!s.unitSector || u.unitSector === s.unitSector))
    : s.useCases;
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

/** إعادة/رفض توزيع على دفعة مع ملاحظة إلزامية — يعود التوزيع مسودة قابلة للتعديل */
export function mocaApplyPlaceReturn(id: string, kind: 'info' | 'reject', note: string) {
  const st = useMoca.getState();
  useMoca.setState({
    entries: st.entries.map((e) =>
      e.id === id ? { ...e, batchWf: 'draft' as const, batchRet: kind, batchNote: note.trim() } : e
    ),
    placeReturnTarget: null,
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
  useMoca.getState().showToast(kind === 'reject' ? 'تم رفض التوزيع وإعادته للمنسق' : 'تمت إعادة التوزيع للتعديل');
}
