'use client';
// ============================================================================
// Central state store (Zustand) — faithful port of the prototype's state +
// methods. UI flags + domain data live here; the big derived view-model is
// computed in lib/viewModel.ts. Persists to localStorage (key `aitp_state`),
// reseeding items when SEED_V changes.
// ============================================================================
import { create } from 'zustand';
import {
  type Item,
  type ItemType,
  type RoleKey,
  type ProgramPhase,
  type LogEntry,
  type WfState,
  type Launch,
  PATHS,
  ROLE,
  SEED_V,
  DEFAULT_ENTITY,
  DEFAULT_PROGRAM_PHASES,
  blankItem,
  blankOwner,
  wfOf,
  execAllDone,
  launchAllDone,
  entOf,
  isEntityApproved,
  PATH_REPS,
  LAUNCH_TYPES,
} from './domain';
import { seedItems } from './seed';
import { runItemReview, runScopeReview, runBulkReview, type ReviewResult } from './ai';

export type MStep = 'path' | 'type' | 'method' | 'form' | 'review' | 'bulk' | 'bulkReview' | 'done';

export type Owner = { name: string; position: string; email: string; phone: string; self: boolean };
export type Setup = {
  rep: { name: string; position: string; email: string; phone: string };
  owners: Record<string, Owner>;
};

export type BulkRow = { title: string; desc: string; _v?: string; _note?: string };

export type AssignState = {
  batch: string;
  launchMode: 'existing' | 'new';
  launchKey: string;
  newLaunch: { title: string; ltype: string; date: string; desc: string };
};

export type UiState = {
  // create wizard
  modalOpen: boolean;
  mStep: MStep;
  draft: Item | null;
  fStep: number; // 1..5
  editingId: string | null;
  editCtx: { role: RoleKey; origWf: WfState } | null;
  aiLoading: boolean;
  aiResult: ReviewResult | null;
  bulkRows: BulkRow[];
  bulkLoading: boolean;
  bulkLoaded: boolean;
  // panels / modals
  detailId: string | null;
  teamOpen: boolean;
  deadlinesOpen: boolean;
  rankOpen: boolean;
  notifOpen: boolean;
  profileOpen: boolean;
  basketOpen: boolean;
  basketTab: 'sel' | 'app';
  dActionMenuOpen: boolean;
  menuOpenId: string | null; // card ⋯ menu
  // selection / funding
  fundSel: string[];
  // coordinator bulk-assign (execution batch + launch plan)
  assignSel: string[];
  assign: AssignState | null;
  cancelFund: { id: string; note: string } | null;
  reqModal: { id: string; mode: 'reject' | 'info'; note: string } | null;
  subReview: { id: string; phase: string; loading: boolean; result: { ready: string[]; improve: string[] } | null } | null;
  // rank modal
  rankRows: { id: string; title: string }[];
  rankDragFrom: number | null;
  // detail view
  dViewStep: number | null;
  // filters
  filter: string; // type filter
  statusFilter: string;
  entFilter: string;
  activePath: string; // 'all' | pathId
  stepFilter: number | null;
  // setup wizard
  setupStep: number; // 1|2
  // toast
  toastMsg: string;
};

type State = {
  view: 'login' | 'setup' | 'dashboard';
  lang: 'ar' | 'en';
  role: RoleKey;
  myPath: string;
  entityName: string;
  setupDone: boolean;
  items: Item[];
  readNotifs: string[];
  programStep: number;
  programPhases: ProgramPhase[];
  phase: { name: string; start: string; deadline: string; setBy: string };
  setup: Setup;
  ui: UiState;
  _tick: number; // countdown re-render
  _hydrated: boolean;
};

type Actions = {
  hydrate: () => void;
  save: () => void;
  toast: (m: string) => void;
  // auth / view
  loginUaePass: () => void;
  logout: () => void;
  toggleLang: () => void;
  // setup
  setSetupStep: (n: number) => void;
  updRep: (k: keyof Setup['rep'], v: string) => void;
  updOwner: (pid: string, k: keyof Owner, v: string) => void;
  toggleSelf: (pid: string) => void;
  finishSetup: () => void;
  skipSetup: () => void;
  // role
  setRole: (r: RoleKey) => void;
  // dropdowns / panels
  toggleNotifs: () => void;
  openNotifItem: (id: string) => void;
  toggleProfile: () => void;
  openTeam: () => void;
  closeTeam: () => void;
  goEditTeam: () => void;
  openBasket: () => void;
  closeBasket: () => void;
  setBasketTab: (t: 'sel' | 'app') => void;
  openDeadlines: () => void;
  closeDeadlines: () => void;
  setPhaseName: (i: number, v: string) => void;
  setPhaseDeadline: (i: number, v: string) => void;
  // filters
  setActivePath: (p: string) => void;
  setFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setEntFilter: (v: string) => void;
  toggleStepFilter: (n: number) => void;
  // create wizard
  openCreate: () => void;
  closeModal: () => void;
  mSetPath: (pid: string) => void;
  mSetType: (t: ItemType) => void;
  chooseManual: () => void;
  chooseBulk: () => void;
  mBack: () => void;
  setDraftField: (k: keyof Item, v: unknown) => void;
  fNext: () => void;
  fPrev: () => void;
  setFStep: (n: number) => void;
  saveDraftOnly: () => void;
  addSub: (phaseIdx: number) => void;
  updSub: (phaseIdx: number, subIdx: number, k: string, v: string) => void;
  removeSub: (phaseIdx: number, subIdx: number) => void;
  updPhaseDate: (phaseIdx: number, k: 'start' | 'end', v: string) => void;
  addLaunch: () => void;
  addSharedLaunch: (payload: { title: string; ltype: string; date: string; desc: string }) => void;
  updLaunch: (i: number, k: string, v: string) => void;
  removeLaunch: (i: number) => void;
  runAiReview: () => Promise<void>;
  backToForm: () => void;
  submitItem: () => void;
  bulkDemo: () => Promise<void>;
  submitBulk: () => void;
  // rank
  openRank: () => void;
  closeRank: () => void;
  saveRank: () => void;
  rankDragStart: (i: number) => void;
  rankDragEnter: (i: number) => void;
  rankDragEnd: () => void;
  // detail
  openDetail: (id: string) => void;
  closeDetail: () => void;
  editItem: (id: string) => void;
  focusDetailStep: (n: number) => void;
  toggleDActionMenu: () => void;
  detailField: (id: string, k: keyof Item, v: unknown) => void;
  setExecItem: (id: string, key: string, patch: Partial<{ status: string; newDate: string; reason: string }>) => void;
  goToLaunch: (id: string) => void;
  toggleLaunchDone: (id: string, idx: number) => void;
  finishLaunch: (id: string) => void;
  submitScope: (id: string) => void;
  doSubmitScope: (id: string) => void;
  // workflow
  approveItem: (id: string) => void;
  rejectItem: (id: string, info?: boolean) => void;
  reqInfoItem: (id: string) => void;
  setReqNote: (v: string) => void;
  confirmReqModal: () => void;
  closeReqModal: () => void;
  // scope AI review
  confirmSubReview: () => void;
  closeSubReview: () => void;
  // card ⋯ menu
  toggleMenu: (id: string) => void;
  // basket / funding
  nominateItem: (id: string) => void;
  withdrawNom: (id: string) => void;
  fundItem: (id: string, direct?: boolean) => void;
  toggleFund: (id: string) => void;
  declineNom: (id: string) => void;
  toggleFundSel: (id: string) => void;
  clearFundSel: () => void;
  commitSelection: () => void;
  // coordinator bulk-assign
  toggleAssignSel: (id: string) => void;
  clearAssignSel: () => void;
  openAssign: () => void;
  setAssign: (patch: Partial<AssignState>) => void;
  closeAssign: () => void;
  applyAssign: () => void;
  openCancelFund: (id: string) => void;
  setCancelFundNote: (v: string) => void;
  confirmCancelFund: () => void;
  closeCancelFund: () => void;
  // exports
  exportExcel: () => void;
  exportPpt: () => void;
};

export type Store = State & Actions;

const PERSIST_KEY = 'aitp_state';
const API_MODE = process.env.NEXT_PUBLIC_DATA_MODE === 'api';

// Fire-and-forget sync of the persisted blob to Postgres (server mode only).
function apiPut(data: unknown) {
  if (!API_MODE || typeof window === 'undefined') return;
  fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}

function defaultSetup(): Setup {
  const owners: Record<string, Owner> = {};
  PATHS.forEach((p) => (owners[p.id] = blankOwner()));
  return {
    rep: {
      name: 'أحمد محمد العامري',
      position: 'مدير إدارة التحول الرقمي',
      email: 'a.alameri@entity.gov.ae',
      phone: '+971 50 123 4567',
    },
    owners,
  };
}

function defaultUi(): UiState {
  return {
    modalOpen: false,
    mStep: 'path',
    draft: null,
    fStep: 1,
    editingId: null,
    editCtx: null,
    aiLoading: false,
    aiResult: null,
    bulkRows: [],
    bulkLoading: false,
    bulkLoaded: false,
    detailId: null,
    teamOpen: false,
    deadlinesOpen: false,
    rankOpen: false,
    notifOpen: false,
    profileOpen: false,
    basketOpen: false,
    basketTab: 'sel',
    dActionMenuOpen: false,
    menuOpenId: null,
    fundSel: [],
    assignSel: [],
    assign: null,
    cancelFund: null,
    reqModal: null,
    subReview: null,
    rankRows: [],
    rankDragFrom: null,
    dViewStep: null,
    filter: 'all',
    statusFilter: 'all',
    entFilter: 'all',
    activePath: 'all',
    stepFilter: null,
    setupStep: 1,
    toastMsg: '',
  };
}

function initialState(): State {
  return {
    view: 'login',
    lang: 'ar',
    role: 'entity',
    myPath: 'ops',
    entityName: DEFAULT_ENTITY,
    setupDone: false,
    items: seedItems(),
    readNotifs: [],
    programStep: 1,
    programPhases: DEFAULT_PROGRAM_PHASES.map((p) => ({ ...p })),
    phase: {
      name: 'المرحلة الأولى — تسجيل وتجميع البيانات',
      start: '2026-07-01',
      deadline: '2026-07-15',
      setBy: 'فريق الذكاء الاصطناعي',
    },
    setup: defaultSetup(),
    ui: defaultUi(),
    _tick: 0,
    _hydrated: false,
  };
}

// Role coercion helper (coord behaves like path for data logic)
export const logicRole = (r: RoleKey): RoleKey => (r === 'coord' ? 'path' : r);

export const actorName = (s: State): string => {
  if (s.role === 'entity') return s.setup.rep.name || 'ممثل الجهة';
  if (s.role === 'ai') return 'اللجنة الوطنية';
  // رئيس المسار: the real stream head, per stream
  if (s.role === 'path') return PATH_REPS[s.myPath] || 'رئيس المسار';
  const owner = s.setup.owners[s.myPath];
  if (owner?.name) return owner.name;
  return 'منسق المسار في الجهة';
};
export const actorRole = (s: State): string => {
  if (s.role === 'entity') return 'ممثل الجهة';
  if (s.role === 'ai') return 'اللجنة الوطنية';
  if (s.role === 'coord') return 'منسق المسار في الجهة';
  return 'رئيس المسار';
};

function withLog(s: State, it: Item, action: string, note?: string): LogEntry[] {
  const entry: LogEntry = {
    action,
    by: actorName(s),
    role: actorRole(s),
    at: Date.now(),
    note: note || '',
  };
  return [...(it.log || []), entry];
}

export const useStore = create<Store>((set, get) => {
  const persist = () => {
    if (typeof window === 'undefined') return;
    const s = get();
    const data = {
      view: s.view,
      lang: s.lang,
      entityName: s.entityName,
      role: s.role,
      myPath: s.myPath,
      setupDone: s.setupDone,
      seedV: SEED_V,
      items: s.items,
      phase: s.phase,
      setup: s.setup,
      readNotifs: s.readNotifs,
      programStep: s.programStep,
      programPhases: s.programPhases,
    };
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota */
    }
    apiPut(data);
  };

  // mutate a single item by id
  const patchItem = (id: string, patch: Partial<Item> | ((it: Item) => Partial<Item>)) => {
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? { ...it, ...(typeof patch === 'function' ? patch(it) : patch) } : it
      ),
    }));
    persist();
  };
  const findItem = (id: string) => get().items.find((i) => i.id === id);
  const setUi = (patch: Partial<UiState>) => set((s) => ({ ui: { ...s.ui, ...patch } }));
  const toast = (m: string) => {
    setUi({ toastMsg: m });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (get().ui.toastMsg === m) setUi({ toastMsg: '' });
      }, 2600);
    }
  };

  return {
    ...initialState(),

    hydrate: () => {
      if (typeof window === 'undefined') return;
      let saved: Record<string, unknown> | null = null;
      try {
        const raw = localStorage.getItem(PERSIST_KEY);
        if (raw) saved = JSON.parse(raw);
      } catch {
        saved = null;
      }
      if (saved) {
        const items = saved.seedV === SEED_V && Array.isArray(saved.items) ? (saved.items as Item[]) : seedItems();
        set((s) => ({
          ...s,
          view: (saved!.view as State['view']) || 'login',
          lang: (saved!.lang as State['lang']) || 'ar',
          entityName: (saved!.entityName as string) || DEFAULT_ENTITY,
          role: (saved!.role as RoleKey) || 'entity',
          myPath: (saved!.myPath as string) || 'ops',
          setupDone: !!saved!.setupDone,
          items,
          phase: (saved!.phase as State['phase']) || s.phase,
          setup: (saved!.setup as Setup) || s.setup,
          readNotifs: (saved!.readNotifs as string[]) || [],
          programStep: (saved!.programStep as number) || 1,
          // programPhases config always reloads fresh (labels editable via code)
          programPhases: DEFAULT_PROGRAM_PHASES.map((p) => ({ ...p })),
          _hydrated: true,
        }));
      } else {
        set({ _hydrated: true });
      }
      // in API/Postgres mode, prefer server state when present
      if (API_MODE) {
        fetch('/api/state')
          .then((r) => r.json())
          .then((res) => {
            const d = res?.data;
            if (!d) return;
            const items = d.seedV === SEED_V && Array.isArray(d.items) ? (d.items as Item[]) : seedItems();
            set((s) => ({
              ...s,
              view: d.view || s.view,
              entityName: d.entityName || s.entityName,
              role: d.role || s.role,
              myPath: d.myPath || s.myPath,
              setupDone: !!d.setupDone,
              items,
              phase: d.phase || s.phase,
              setup: d.setup || s.setup,
              readNotifs: d.readNotifs || [],
              programStep: d.programStep || 1,
            }));
          })
          .catch(() => {});
      }
      // countdown ticker
      if (!(window as unknown as { _aitpTick?: number })._aitpTick) {
        (window as unknown as { _aitpTick?: number })._aitpTick = window.setInterval(
          () => set((s) => ({ _tick: s._tick + 1 })),
          1000
        );
      }
    },

    save: persist,
    toast,

    // ---- auth / view ----
    loginUaePass: () => {
      const s = get();
      set({ view: s.setupDone ? 'dashboard' : 'setup' });
      persist();
    },
    logout: () => {
      set({ view: 'login', ui: { ...defaultUi() } });
      persist();
    },
    toggleLang: () => set((s) => ({ lang: s.lang === 'ar' ? 'en' : 'ar' })),

    // ---- setup ----
    setSetupStep: (n) => setUi({ setupStep: n }),
    updRep: (k, v) =>
      set((s) => ({ setup: { ...s.setup, rep: { ...s.setup.rep, [k]: v } } })),
    updOwner: (pid, k, v) =>
      set((s) => ({
        setup: {
          ...s.setup,
          owners: { ...s.setup.owners, [pid]: { ...s.setup.owners[pid], [k]: v } },
        },
      })),
    toggleSelf: (pid) =>
      set((s) => ({
        setup: {
          ...s.setup,
          owners: {
            ...s.setup.owners,
            [pid]: { ...s.setup.owners[pid], self: !s.setup.owners[pid].self },
          },
        },
      })),
    finishSetup: () => {
      set({ setupDone: true, view: 'dashboard' });
      persist();
      toast('تم حفظ فريق العمل');
    },
    skipSetup: () => {
      set({ setupDone: true, view: 'dashboard' });
      persist();
    },

    // ---- role ----
    setRole: (r) => {
      set((s) => ({
        role: r,
        ui: { ...s.ui, activePath: 'all', entFilter: 'all', stepFilter: null, statusFilter: 'all' },
      }));
      persist();
    },

    // ---- dropdowns / panels ----
    toggleNotifs: () =>
      set((s) => {
        const opening = !s.ui.notifOpen;
        if (!opening) {
          // closing: mark visible notifs read — handled in viewModel via markRead
        }
        return { ui: { ...s.ui, notifOpen: opening, profileOpen: false } };
      }),
    openNotifItem: (id) => setUi({ notifOpen: false, detailId: id }),
    toggleProfile: () => set((s) => ({ ui: { ...s.ui, profileOpen: !s.ui.profileOpen, notifOpen: false } })),
    openTeam: () => setUi({ teamOpen: true, profileOpen: false }),
    closeTeam: () => setUi({ teamOpen: false }),
    goEditTeam: () => {
      set({ view: 'setup' });
      setUi({ teamOpen: false, setupStep: 1 });
    },
    openBasket: () => setUi({ basketOpen: true }),
    closeBasket: () => setUi({ basketOpen: false }),
    setBasketTab: (t) => setUi({ basketTab: t }),
    openDeadlines: () => setUi({ deadlinesOpen: true }),
    closeDeadlines: () => {
      setUi({ deadlinesOpen: false });
      persist();
    },
    setPhaseName: (i, v) =>
      set((s) => {
        const pp = s.programPhases.map((p, idx) => (idx === i ? { ...p, n: v } : p));
        return { programPhases: pp };
      }),
    setPhaseDeadline: (i, v) =>
      set((s) => {
        const pp = s.programPhases.map((p, idx) => (idx === i ? { ...p, deadline: v } : p));
        return { programPhases: pp };
      }),

    // ---- filters ----
    setActivePath: (p) => setUi({ activePath: p, filter: 'all', stepFilter: null }),
    setFilter: (v) => setUi({ filter: v }),
    setStatusFilter: (v) => setUi({ statusFilter: v }),
    setEntFilter: (v) => setUi({ entFilter: v }),
    toggleStepFilter: (n) => set((s) => ({ ui: { ...s.ui, stepFilter: s.ui.stepFilter === n ? null : n } })),

    // ---- create wizard ----
    openCreate: () => {
      const s = get();
      const common = {
        modalOpen: true,
        draft: null as Item | null,
        editingId: null,
        editCtx: null,
        fStep: 1,
        aiResult: null,
        detailId: null,
        teamOpen: false,
        profileOpen: false,
        notifOpen: false,
      };
      if (s.role === 'coord') {
        // path-rep (coord) skips path selection → straight to type within own stream
        setUi({ ...common, mStep: 'type', draft: blankItem('project', s.myPath), activePath: s.myPath });
      } else {
        setUi({ ...common, mStep: 'path' });
      }
    },
    closeModal: () => setUi({ modalOpen: false, draft: null, editingId: null }),
    mSetPath: (pid) => {
      set((s) => ({ ui: { ...s.ui, draft: blankItem('project', pid), mStep: 'type' } }));
    },
    mSetType: (t) => {
      const s = get();
      const path = s.ui.draft?.path || s.myPath;
      set((st) => ({ ui: { ...st.ui, draft: blankItem(t, path), mStep: 'method' } }));
    },
    chooseManual: () => setUi({ mStep: 'form', fStep: 1 }),
    chooseBulk: () => setUi({ mStep: 'bulk' }),
    mBack: () => {
      const s = get();
      const order: MStep[] = ['path', 'type', 'method', 'form'];
      const idx = order.indexOf(s.ui.mStep);
      if (s.ui.mStep === 'bulk') return setUi({ mStep: 'method' });
      if (s.ui.mStep === 'bulkReview') return setUi({ mStep: 'bulk' });
      if (idx > 0) {
        // coord: don't go back past type
        const min = s.role === 'coord' ? 1 : 0;
        setUi({ mStep: order[Math.max(min, idx - 1)] });
      }
    },
    setDraftField: (k, v) =>
      set((s) => (s.ui.draft ? { ui: { ...s.ui, draft: { ...s.ui.draft, [k]: v } } } : {})),
    fNext: () => {
      const s = get();
      if (s.ui.fStep < 5) {
        setUi({ fStep: s.ui.fStep + 1 });
        return;
      }
      // scope + budget are required before an item can be submitted for approval
      const d = s.ui.draft;
      if (d && (!(d.scopeOfWork || '').trim() || !(d.budget || '').trim())) {
        setUi({ fStep: 4 });
        return toast('يجب إدخال نطاق العمل والميزانية قبل الإرسال للاعتماد');
      }
      get().submitItem();
    },
    fPrev: () => {
      const s = get();
      if (s.ui.fStep <= 1) return get().mBack();
      setUi({ fStep: s.ui.fStep - 1 });
    },
    setFStep: (n: number) => {
      // only allow jumping back to an already-completed step
      const s = get();
      if (n >= 1 && n < s.ui.fStep) setUi({ fStep: n });
    },
    saveDraftOnly: () => {
      if (!get().ui.draft) return;
      commitDraft(get, set, persist, toast, 'مسودة', true);
      setUi({ modalOpen: false, draft: null, editingId: null });
    },
    addSub: (pi) =>
      set((s) => {
        if (!s.ui.draft) return {};
        const phases = (s.ui.draft.phases || []).map((p, i) =>
          i === pi ? { ...p, subs: [...(p.subs || []), { name: '', start: '', end: '' }] } : p
        );
        return { ui: { ...s.ui, draft: { ...s.ui.draft, phases } } };
      }),
    updSub: (pi, si, k, v) =>
      set((s) => {
        if (!s.ui.draft) return {};
        const phases = (s.ui.draft.phases || []).map((p, i) =>
          i === pi
            ? { ...p, subs: (p.subs || []).map((sub, j) => (j === si ? { ...sub, [k]: v } : sub)) }
            : p
        );
        return { ui: { ...s.ui, draft: { ...s.ui.draft, phases } } };
      }),
    removeSub: (pi, si) =>
      set((s) => {
        if (!s.ui.draft) return {};
        const phases = (s.ui.draft.phases || []).map((p, i) =>
          i === pi ? { ...p, subs: (p.subs || []).filter((_, j) => j !== si) } : p
        );
        return { ui: { ...s.ui, draft: { ...s.ui.draft, phases } } };
      }),
    updPhaseDate: (pi, k, v) =>
      set((s) => {
        if (!s.ui.draft) return {};
        const phases = (s.ui.draft.phases || []).map((p, i) => (i === pi ? { ...p, [k]: v } : p));
        return { ui: { ...s.ui, draft: { ...s.ui.draft, phases } } };
      }),
    addLaunch: () =>
      set((s) => {
        if (!s.ui.draft) return {};
        const launches = [
          ...(s.ui.draft.launches || []),
          { title: '', ltype: LAUNCH_TYPES[0], date: '', desc: '', phase: '', status: 'مخطط', done: false },
        ];
        return { ui: { ...s.ui, draft: { ...s.ui.draft, launches } } };
      }),
    addSharedLaunch: (payload) =>
      set((s) => {
        if (!s.ui.draft) return {};
        const launches = [
          ...(s.ui.draft.launches || []),
          { ...payload, shared: true, status: 'مخطط', done: false },
        ];
        return { ui: { ...s.ui, draft: { ...s.ui.draft, launches } } };
      }),
    updLaunch: (i, k, v) =>
      set((s) => {
        if (!s.ui.draft) return {};
        const launches = (s.ui.draft.launches || []).map((l, j) => (j === i ? { ...l, [k]: v } : l));
        return { ui: { ...s.ui, draft: { ...s.ui.draft, launches } } };
      }),
    removeLaunch: (i) =>
      set((s) => {
        if (!s.ui.draft) return {};
        const launches = (s.ui.draft.launches || []).filter((_, j) => j !== i);
        return { ui: { ...s.ui, draft: { ...s.ui.draft, launches } } };
      }),
    runAiReview: async () => {
      const s = get();
      if (!s.ui.draft) return;
      setUi({ mStep: 'review', aiLoading: true, aiResult: null });
      const result = await runItemReview(s.ui.draft);
      setUi({ aiLoading: false, aiResult: result });
    },
    backToForm: () => setUi({ mStep: 'form' }),
    submitItem: () => {
      commitDraft(get, set, persist, toast, 'تم الإرسال', false);
      setUi({ mStep: 'done' });
    },
    bulkDemo: async () => {
      const s = get();
      const tl = s.ui.draft ? s.ui.draft.type : 'project';
      const label = ({ project: 'مشروع', initiative: 'مبادرة', operation: 'عملية', service: 'خدمة' } as Record<string, string>)[tl] || 'عنصر';
      const rows: BulkRow[] = [
        { title: label + ' أتمتة الإشعارات الموحّدة', desc: 'أتمتة إرسال الإشعارات عبر القنوات الرقمية.' },
        { title: label + ' لوحة مؤشرات الأداء', desc: 'لوحة' },
        { title: '', desc: 'تم الاستيراد من الملف المرفوع' },
      ];
      setUi({ mStep: 'bulkReview', bulkLoading: true, bulkLoaded: false, bulkRows: rows });
      const verdicts = await runBulkReview(tl, rows);
      const withV = rows.map((r, i) => ({ ...r, _v: verdicts[i]?.verdict, _note: verdicts[i]?.note }));
      setUi({ bulkLoading: false, bulkLoaded: true, bulkRows: withV });
    },
    submitBulk: () => {
      const s = get();
      const path = s.ui.draft?.path || s.myPath;
      const type = s.ui.draft?.type || 'project';
      const toAdd = s.ui.bulkRows
        .filter((r) => r._v !== 'يوجد خطأ')
        .map((r) => ({
          ...blankItem(type, path),
          id: 'n' + Date.now() + Math.floor(Math.random() * 1000),
          title: r.title,
          desc: r.desc,
          approval: 'تم الإرسال',
          wf: 'ent1' as WfState,
          ret: null,
        }));
      set((st) => ({ items: [...toAdd, ...st.items] }));
      persist();
      setUi({ mStep: 'done' });
    },

    // ---- rank modal ----
    openRank: () => {
      const s = get();
      const path = s.ui.draft?.path || s.myPath;
      const rows = s.items
        .filter((i) => i.path === path)
        .sort((a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99))
        .map((i) => ({ id: i.id, title: i.title }));
      if (s.ui.draft && s.ui.draft.title) rows.unshift({ id: s.ui.draft.id, title: s.ui.draft.title || 'العنصر الجديد' });
      setUi({ rankOpen: true, rankRows: rows });
    },
    closeRank: () => setUi({ rankOpen: false }),
    saveRank: () => {
      setUi({ rankOpen: false });
      toast('تم حفظ ترتيب الأولوية');
    },
    rankDragStart: (i) => setUi({ rankDragFrom: i }),
    rankDragEnter: (i) => {
      const s = get();
      const from = s.ui.rankDragFrom;
      if (from == null || from === i) return;
      const rows = [...s.ui.rankRows];
      const [moved] = rows.splice(from, 1);
      rows.splice(i, 0, moved);
      setUi({ rankRows: rows, rankDragFrom: i });
    },
    rankDragEnd: () => setUi({ rankDragFrom: null }),

    // ---- detail ----
    openDetail: (id) => setUi({ detailId: id, dViewStep: null, dActionMenuOpen: false }),
    closeDetail: () => setUi({ detailId: null }),
    editItem: (id) => {
      const s = get();
      const it = findItem(id);
      if (!it) return;
      setUi({
        draft: { ...it },
        editingId: id,
        editCtx: { role: s.role, origWf: wfOf(it) },
        mStep: 'form',
        fStep: 1,
        detailId: null,
        modalOpen: true,
      });
    },
    focusDetailStep: (n) => setUi({ dViewStep: n }),
    toggleDActionMenu: () => set((s) => ({ ui: { ...s.ui, dActionMenuOpen: !s.ui.dActionMenuOpen } })),
    detailField: (id, k, v) => patchItem(id, { [k]: v } as Partial<Item>),
    setExecItem: (id, key, patch) =>
      patchItem(id, (it) => ({
        execChecklist: (it.execChecklist || []).map((x) => (x.key === key ? { ...x, ...patch } : x)),
      })),
    goToLaunch: (id) => {
      const it = findItem(id);
      if (!it) return;
      if (!execAllDone(it)) return toast('أكمل كل بند أو حدّد سبب التأخير وتاريخاً جديداً قبل الانتقال للإطلاق');
      patchItem(id, { wf: 'launch' });
      toast('انتقل العنصر إلى مرحلة الإطلاق');
    },
    toggleLaunchDone: (id, idx) =>
      patchItem(id, (it) => ({
        launches: (it.launches || []).map((l, i) => (i === idx ? { ...l, done: !l.done, doneAt: !l.done ? Date.now() : undefined } : l)),
      })),
    finishLaunch: (id) => {
      const it = findItem(id);
      if (!it) return;
      if (!launchAllDone(it)) return toast('يجب إكمال جميع بنود خطة الإطلاق');
      patchItem(id, { wf: 'done', progress: 100 });
      toast('اكتمل الإطلاق — تم إنجاز العنصر');
    },
    submitScope: (id) => {
      const it = findItem(id);
      if (!it) return;
      if (!(it.scopeOfWork || '').trim() || !(it.budget || '').trim())
        return toast('الرجاء إدخال نطاق العمل والميزانية أولاً');
      setUi({ subReview: { id, phase: 'budget', loading: true, result: null } });
      runScopeReview(it).then((result) => {
        const cur = get().ui.subReview;
        if (cur && cur.id === id) setUi({ subReview: { ...cur, loading: false, result } });
      });
    },
    doSubmitScope: (id) => {
      const s = get();
      patchItem(id, (it) => ({ wf: 'exec', ret: null, log: withLog(s, it, 'budget') }));
      toast('تم إرسال العنصر لاعتماد ممثل الجهة');
    },
    confirmSubReview: () => {
      const s = get();
      const sr = s.ui.subReview;
      if (!sr) return;
      get().doSubmitScope(sr.id);
      setUi({ subReview: null });
    },
    closeSubReview: () => setUi({ subReview: null }),

    // ---- workflow ----
    approveItem: (id) => {
      const s = get();
      const it = findItem(id);
      if (!it) return;
      const w = wfOf(it);
      if (w === 'ent1') {
        patchItem(id, (i) => ({ wf: 'exec', ret: null, log: withLog(s, i, 'approve') }));
        toast('اعتمدت الجهة العنصر — انتقل إلى مرحلة التنفيذ');
      } else if (w === 'pm1') {
        patchItem(id, (i) => ({ wf: 'exec', ret: null, log: withLog(s, i, 'approve') }));
        toast('انتقل العنصر إلى مرحلة التنفيذ');
      }
      setUi({ menuOpenId: null, dActionMenuOpen: false });
    },
    rejectItem: (id, info) => setUi({ reqModal: { id, mode: info ? 'info' : 'reject', note: '' }, menuOpenId: null, dActionMenuOpen: false }),
    reqInfoItem: (id) => get().rejectItem(id, true),
    setReqNote: (v) => set((s) => (s.ui.reqModal ? { ui: { ...s.ui, reqModal: { ...s.ui.reqModal, note: v } } } : {})),
    confirmReqModal: () => {
      const s = get();
      const rm = s.ui.reqModal;
      if (!rm) return;
      if (!rm.note.trim()) return toast('يرجى كتابة الملاحظات المطلوب معالجتها');
      const it = findItem(rm.id);
      if (!it) return;
      const w = wfOf(it);
      const from = w === 'ent1' ? 'ممثل الجهة' : 'اللجنة الوطنية';
      const info = rm.mode === 'info';
      patchItem(rm.id, (i) => ({
        wf: 'draft',
        ret: { type: info ? 'info' : 'reject', from, note: rm.note, gate: 'priority' },
        log: withLog(s, i, info ? 'info' : 'reject', rm.note),
      }));
      setUi({ reqModal: null });
      toast(info ? 'تم طلب معلومات إضافية من رئيس المسار' : 'تمت إعادة العنصر إلى رئيس المسار');
    },
    closeReqModal: () => setUi({ reqModal: null }),

    // ---- card ⋯ menu ----
    toggleMenu: (id) => set((s) => ({ ui: { ...s.ui, menuOpenId: s.ui.menuOpenId === id ? null : id } })),

    // ---- basket / funding ----
    nominateItem: (id) => {
      const s = get();
      patchItem(id, (it) => ({
        nom: { by: actorName(s), role: actorRole(s), path: it.path, at: Date.now() },
        log: withLog(s, it, 'nominate'),
      }));
      toast('تمت إضافة العنصر إلى سلة الترشيح — بانتظار اللجنة الوطنية');
    },
    withdrawNom: (id) => {
      patchItem(id, { nom: null });
      toast('تم سحب الترشيح');
    },
    fundItem: (id, direct) => {
      const s = get();
      const target = findItem(id);
      if (!target) return;
      if (!isEntityApproved(target)) return toast('لا يمكن تمويل العنصر قبل اعتماد ممثل الجهة'); // only entity-approved items
      patchItem(id, (it) => ({
        funded: { by: 'اللجنة الوطنية', at: Date.now(), direct: !!direct },
        nom: it.nom || { by: 'اللجنة الوطنية', role: 'اللجنة الوطنية', path: it.path, at: Date.now(), direct: true },
        log: withLog(s, it, 'fund'),
      }));
      toast('تمت الموافقة على التمويل — أُضيف إلى السلة المعتمدة وأُشعرت الجهة');
    },
    toggleFund: (id) => {
      const s = get();
      const it = findItem(id);
      if (!it) return;
      if (it.funded) {
        patchItem(id, (i) => ({
          funded: null,
          nom: i.funded?.direct ? null : i.nom,
          log: withLog(s, i, 'unfund'),
        }));
        toast('تم إلغاء التمويل');
      } else {
        get().fundItem(id, !it.nom);
      }
    },
    declineNom: (id) => {
      const s = get();
      patchItem(id, (it) => ({ nom: null, log: withLog(s, it, 'declineNom') }));
      toast('تم رفض الترشيح');
    },
    toggleFundSel: (id) =>
      set((s) => ({
        ui: {
          ...s.ui,
          fundSel: s.ui.fundSel.includes(id) ? s.ui.fundSel.filter((x) => x !== id) : [...s.ui.fundSel, id],
        },
      })),
    clearFundSel: () => setUi({ fundSel: [] }),
    commitSelection: () => {
      const s = get();
      if (logicRole(s.role) === 'path') nominateSelected(get, set, persist, toast);
      else fundSelected(get, set, persist, toast);
    },

    // ---- coordinator bulk-assign (execution batch + launch plan) ----
    toggleAssignSel: (id) =>
      set((s) => ({
        ui: {
          ...s.ui,
          assignSel: s.ui.assignSel.includes(id)
            ? s.ui.assignSel.filter((x) => x !== id)
            : [...s.ui.assignSel, id],
        },
      })),
    clearAssignSel: () => setUi({ assignSel: [] }),
    openAssign: () =>
      setUi({
        assign: {
          batch: '',
          // a launch plan is required: pick an existing shared one or create new
          launchMode: 'existing',
          launchKey: '',
          newLaunch: { title: '', ltype: LAUNCH_TYPES[0], date: '', desc: '' },
        },
      }),
    setAssign: (patch) =>
      set((s) => (s.ui.assign ? { ui: { ...s.ui, assign: { ...s.ui.assign, ...patch } } } : {})),
    closeAssign: () => setUi({ assign: null }),
    applyAssign: () => {
      const s = get();
      const a = s.ui.assign;
      if (!a) return;
      const ids = s.ui.assignSel;
      // a launch plan is required — either an existing shared one or a new one
      if (a.launchMode === 'existing' && !a.launchKey)
        return toast('اختر خطة إطلاق مشتركة أولاً');
      if (a.launchMode === 'new' && !a.newLaunch.title.trim())
        return toast('أدخل اسم الإطلاق الجديد أولاً');
      // find an existing launch across all items by key (title|date)
      let found: Launch | undefined;
      if (a.launchMode === 'existing' && a.launchKey) {
        for (const it of s.items) {
          const m = (it.launches || []).find((l) => l.title && l.title + '|' + l.date === a.launchKey);
          if (m) {
            found = m;
            break;
          }
        }
      }
      set((st) => ({
        items: st.items.map((it) => {
          if (!ids.includes(it.id)) return it;
          const patch: Partial<Item> = {};
          if (a.batch) patch.execBatch = a.batch;
          if (a.launchMode === 'existing' && found) {
            patch.launches = [...(it.launches || []), { ...found, shared: true }];
          } else if (a.launchMode === 'new' && a.newLaunch.title) {
            patch.launches = [
              ...(it.launches || []),
              { ...a.newLaunch, shared: true, status: 'مخطط', done: false },
            ];
          }
          return { ...it, ...patch };
        }),
        ui: { ...st.ui, assignSel: [], assign: null },
      }));
      persist();
      toast('تم تعيين خطة التنفيذ/الإطلاق للعناصر المحددة');
    },
    openCancelFund: (id) => setUi({ cancelFund: { id, note: '' } }),
    setCancelFundNote: (v) => set((s) => (s.ui.cancelFund ? { ui: { ...s.ui, cancelFund: { ...s.ui.cancelFund, note: v } } } : {})),
    confirmCancelFund: () => {
      const s = get();
      const cf = s.ui.cancelFund;
      if (!cf) return;
      if (!cf.note.trim()) return toast('يرجى كتابة سبب إلغاء التمويل');
      patchItem(cf.id, (it) => ({
        funded: null,
        nom: it.funded?.direct ? null : it.nom,
        fundCancel: { by: actorName(s), at: Date.now(), reason: cf.note },
        log: withLog(s, it, 'cancelFund', cf.note),
      }));
      setUi({ cancelFund: null });
      toast('تم إلغاء التمويل وإشعار الجهة بالسبب');
    },
    closeCancelFund: () => setUi({ cancelFund: null }),

    // ---- exports (real client-side file generation) ----
    exportExcel: () => {
      const list = exportScope(get());
      import('./export')
        .then((m) => m.exportExcel(list, get().entityName))
        .then(() => toast('تم إنشاء ملف Excel'))
        .catch(() => toast('تعذّر إنشاء ملف Excel'));
    },
    exportPpt: () => {
      const list = exportScope(get());
      import('./export')
        .then((m) => m.exportPpt(list, get().entityName))
        .then(() => toast('تم إنشاء ملف PowerPoint'))
        .catch(() => toast('تعذّر إنشاء عرض PowerPoint'));
    },
  };
});

// Items in scope for the current role (mirrors the dashboard's base scope).
function exportScope(s: State): Item[] {
  const raw = s.role;
  if (raw === 'coord') return s.items.filter((i) => i.path === s.myPath && entOf(i, s.entityName) === s.entityName);
  if (raw === 'path') return s.items.filter((i) => i.path === s.myPath && wfOf(i) !== 'draft' && wfOf(i) !== 'ent1');
  if (raw === 'ai') return s.items.filter((i) => wfOf(i) !== 'draft' && wfOf(i) !== 'ent1');
  return s.items.filter((i) => wfOf(i) !== 'draft'); // entity
}

// ---- draft commit (shared by submit / save-as-draft / edit) ----
function commitDraft(
  get: () => Store,
  set: (p: Partial<State> | ((s: State) => Partial<State>)) => void,
  persist: () => void,
  toast: (m: string) => void,
  approval: string,
  asDraft: boolean
) {
  const s = get();
  const draft = s.ui.draft;
  if (!draft) return;
  const editing = s.ui.editingId;
  const ec = s.ui.editCtx;
  let wf: WfState = asDraft ? 'draft' : 'ent1';
  let fyi: Item['fyi'] = draft.fyi || null;
  let logNote = '';
  if (editing && ec) {
    if (ec.role === 'entity' && !asDraft) {
      wf = ['ent2', 'pm2', 'budget', 'exec', 'launch'].includes(ec.origWf) ? 'pm2' : 'pm1';
      fyi = { by: actorName(s), at: Date.now() };
      logNote = 'تعديل من ممثل الجهة — بانتظار اعتماد اللجنة الوطنية';
    } else if (ec.role === 'ai' && !asDraft) {
      wf = ec.origWf === 'draft' ? 'ent1' : ec.origWf;
      logNote = 'تعديل من اللجنة الوطنية';
    }
  }
  const finalItem: Item = {
    ...draft,
    approval: asDraft ? 'مسودة' : approval || 'تم الإرسال',
    wf,
    ret: null,
    fyi,
    log: logNote ? withLog(s, draft, editing ? 'submit' : 'submit', logNote) : draft.log,
  };
  set((st) => {
    const others = editing ? st.items.filter((i) => i.id !== editing) : st.items;
    return { items: [finalItem, ...others] };
  });
  persist();
  if (asDraft) toast('تم حفظ المسودة');
}

function fundSelected(
  get: () => Store,
  set: (p: Partial<State> | ((s: State) => Partial<State>)) => void,
  persist: () => void,
  toast: (m: string) => void
) {
  const s = get();
  const ids = s.ui.fundSel;
  let n = 0;
  set((st) => ({
    items: st.items.map((it) => {
      if (!ids.includes(it.id) || it.funded || !isEntityApproved(it)) return it;
      n++;
      return {
        ...it,
        funded: { by: 'اللجنة الوطنية', at: Date.now(), direct: !it.nom },
        nom: it.nom || { by: 'اللجنة الوطنية', role: 'اللجنة الوطنية', path: it.path, at: Date.now(), direct: true },
        log: withLog(st, it, 'fund'),
      };
    }),
    ui: { ...st.ui, fundSel: [] },
  }));
  persist();
  toast('تم اعتماد تمويل ' + n + ' عنصر — أُشعرت الجهات');
}

function nominateSelected(
  get: () => Store,
  set: (p: Partial<State> | ((s: State) => Partial<State>)) => void,
  persist: () => void,
  toast: (m: string) => void
) {
  const s = get();
  const ids = s.ui.fundSel;
  let n = 0;
  set((st) => ({
    items: st.items.map((it) => {
      if (!ids.includes(it.id) || it.nom || it.funded || !isEntityApproved(it)) return it;
      n++;
      return {
        ...it,
        nom: { by: actorName(st), role: actorRole(st), path: it.path, at: Date.now() },
        log: withLog(st, it, 'nominate'),
      };
    }),
    ui: { ...st.ui, fundSel: [] },
  }));
  persist();
  toast('تم ترشيح ' + n + ' عنصر إلى اللجنة الوطنية');
}

// convenience re-exports for the view-model
export { PATHS, ROLE, wfOf, entOf };
