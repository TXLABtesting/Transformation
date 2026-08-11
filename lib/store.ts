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
  type UserRec,
  seedUsers,
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
  availTypes,
  launchesFromPlans,
  parseBudget,
  typeLabelDef,
  typeLabelDefFor,
  TBD_BATCH,
  execMilestones,
  seedExpectedResults,
  DEFAULT_CONTACT_EMAILS,
  DEFAULT_LIBRARY_DOCS,
  DEFAULT_ABOUT_HERO,
} from './domain';
import type { LibraryDoc, ContactInquiry } from './domain';
import { STREAM_FIELDS, missingFieldsOf, DEFAULT_ABOUT, SUPPORT_OPTYPE, stgPriority, svcPriority, activityMissing, mirrorActivities, itemActivities, activityTransformYes, type ActivityDetail } from './domain';
import type { AboutContent } from './domain';
import { stripHtml } from './richtext';
import { seedItems, seedLaunchPlans } from './seed';
import type { LaunchPlan, ExpectedResult } from './domain';
import { type ReviewResult } from './ai';

// Validation against the stream's entry-field spec: a row needs a title to be
// importable; rows with missing fields import as DRAFTS flagged «بيانات ناقصة».
const plainVerdict = (r: BulkRow): BulkRow => {
  if (!(r.title || '').trim()) return { ...r, _v: 'يوجد خطأ', _note: 'اسم المدخل مفقود — لن يُستورد هذا الصف' };
  const miss = r.missing || [];
  if (miss.length) return { ...r, _v: 'بيانات ناقصة', _note: 'الحقول الناقصة: ' + miss.join('، ') };
  return { ...r, _v: 'جاهز', _note: 'مكتمل — سيُرسل لاعتماد رئيس المسار بعد التأكيد' };
};

export type MStep = 'path' | 'type' | 'method' | 'form' | 'review' | 'bulk' | 'bulkReview' | 'done';

export type Owner = { name: string; position: string; email: string; phone: string; self: boolean };
export type Setup = {
  rep: { name: string; position: string; email: string; phone: string };
  owners: Record<string, Owner>;
};

export type BulkRow = {
  type?: string;
  path?: string;
  title: string;
  desc: string;
  extra?: Partial<Item>;
  missing?: string[];
  _v?: string;
  _note?: string;
};

export type AssignState = {
  // bulk-assign sets the execution & launch batch (المرحلة) for the selection
  batch: string;
};

export type UiState = {
  // admin toggled into the monitoring dashboards (committee-wide view)
  adminDash?: boolean;
  // create wizard
  modalOpen: boolean;
  mStep: MStep;
  method: 'manual' | 'bulk';
  draft: Item | null;
  // manage-launch-plans panel
  launchPlansOpen: boolean;
  fStep: number; // 1..5
  editingId: string | null;
  editCtx: { role: RoleKey; origWf: WfState } | null;
  aiLoading: boolean;
  aiResult: ReviewResult | null;
  bulkRows: BulkRow[];
  bulkLoading: boolean;
  bulkLoaded: boolean;
  // launch plans parsed from an uploaded workplan (imported on submit)
  bulkLaunches: { batch: string; title: string; ltype: string; date: string; desc: string }[];
  // expected-results add/edit modal
  resultModal: { id: string | null; text: string; itemIds: string[] } | null;
  // panels / modals
  detailId: string | null;
  teamOpen: boolean;
  deadlinesOpen: boolean;
  rankOpen: boolean;
  notifOpen: boolean;
  profileOpen: boolean;
  basketOpen: boolean;
  basketTab: 'heads' | 'committee' | 'approved';
  dActionMenuOpen: boolean;
  menuOpenId: string | null; // card ⋯ menu
  // selection / funding
  fundSel: string[];
  // coordinator bulk-assign (execution batch + launch plan)
  assignSel: string[];
  assign: AssignState | null;
  cancelFund: { id: string; note: string } | null;
  reqModal: { id: string; mode: 'reject' | 'info'; note: string } | null;
  // in-app confirmation dialog (replaces window.confirm)
  confirmModal: {
    kind: 'launchAll' | 'deleteItem' | 'deletePlan' | 'crossMove' | 'moveBatch' | 'withdrawDraft';
    title: string;
    body: string;
    okLabel: string;
    altLabel?: string;
    cancelLabel: string;
    payload: Record<string, string>;
  } | null;
  subReview: { id: string; phase: string; loading: boolean; result: { ready: string[]; improve: string[] } | null } | null;
  // rank modal
  rankRows: { id: string; title: string }[];
  rankDragFrom: number | null;
  // detail view
  dViewStep: number | null;
  // filters
  // sidebar navigation
  navSection: string; // 'overview' | 'projects' | 'operations' | 'services' | 'launchplans'
  navStream: string | null; // drill-down stream inside a type section
  draftSel: string[]; // coordinator: selected drafts for group send
  batchFilter: string | null; // drill-down from a مرحلة card into its items
  // services-stream list filters: الخدمة / القطاع / الأولوية
  svcServiceF: string;
  svcSectorF: string;
  svcPrioF: string;
  // strategy-stream list filters: المهمة / القطاع / الأولوية
  stgTaskF: string;
  stgAxisF: string;
  stgSectorF: string;
  stgPrioF: string;
  opsCatF: string; // تصنيف العملية
  opsSectorF: string;
  opsSupportF: string; // نوع عملية الدعم المؤسسي
  // inline add-manually form (rendered under the table, not a popup)
  inlineCreate: boolean;
  confirmAdd: boolean;
  filter: string; // type filter
  statusFilter: string;
  fundFilter: string; // 'all' | 'funded' | 'notfunded'
  search: string;
  entFilter: string;
  execEnt: string; // مراحل التنفيذ / خطة الإطلاق — entity filter (ai/path), 'all'
  execStream: string; // مراحل التنفيذ / خطة الإطلاق — stream filter (ai), 'all'
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
  myPaths: string[];
  entityName: string;
  setupDone: boolean;
  items: Item[];
  launchPlans: LaunchPlan[];
  expectedResults: ExpectedResult[];
  // contact-page inquiry inboxes (editable from the admin backoffice)
  contactEmails: Record<string, string>;
  aboutHero: string;
  about: AboutContent;
  libraryDocs: LibraryDoc[];
  inquiries: ContactInquiry[];
  users: UserRec[];
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
  // admin — user & role management
  adminSaveUser: (u: UserRec) => void;
  adminToggleUser: (id: string) => void;
  adminRemoveUser: (id: string) => void;
  // dropdowns / panels
  toggleNotifs: () => void;
  markNotifsRead: (ids: string[]) => void;
  openNotifItem: (id: string) => void;
  toggleProfile: () => void;
  openTeam: () => void;
  closeTeam: () => void;
  goEditTeam: () => void;
  openBasket: () => void;
  closeBasket: () => void;
  // expected results (النتائج المتوقعة)
  openResultModal: (id?: string) => void;
  closeResultModal: () => void;
  setResultText: (t: string) => void;
  toggleResultItem: (itemId: string) => void;
  saveResult: () => void;
  deleteResult: (id: string) => void;
  setBasketTab: (t: 'heads' | 'committee' | 'approved') => void;
  openDeadlines: () => void;
  closeDeadlines: () => void;
  setPhaseName: (i: number, v: string) => void;
  setPhaseDeadline: (i: number, v: string) => void;
  // filters
  setActivePath: (p: string) => void;
  setMyPath: (p: string) => void;
  setAdminDash: (v: boolean) => void;
  setFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  confirmOk: () => void;
  confirmAlt: () => void;
  closeConfirm: () => void;
  setNavSection: (v: string) => void;
  setNavStream: (v: string | null) => void;
  setBatchFilter: (v: string | null) => void;
  openBatchItems: (batch: string, section: string) => void;
  setFundFilter: (v: string) => void;
  setSearch: (v: string) => void;
  setEntFilter: (v: string) => void;
  setExecEnt: (v: string) => void;
  setExecStream: (v: string) => void;
  resetFilters: () => void;
  setSvcFilter: (k: 'svcServiceF' | 'svcSectorF' | 'svcPrioF', v: string) => void;
  setStgFilter: (k: 'stgTaskF' | 'stgAxisF' | 'stgSectorF' | 'stgPrioF', v: string) => void;
  setOpsFilter: (k: 'opsCatF' | 'opsSectorF' | 'opsSupportF', v: string) => void;
  setItemDate: (id: string, k: 'startDate' | 'endDate', v: string) => void;
  assignItemBatch: (id: string, batch: string) => void;
  setContactEmail: (k: string, v: string) => void;
  setAboutHero: (v: string) => void;
  setAbout: (patch: Partial<AboutContent>) => void;
  updLibDoc: (id: string, patch: Partial<LibraryDoc>) => void;
  addLibDoc: () => void;
  removeLibDoc: (id: string) => void;
  addInquiry: (q: { name: string; phone: string; email: string; stream: string; message: string }) => void;
  toggleInquiryDone: (id: string) => void;
  toggleStepFilter: (n: number) => void;
  toggleDraftSel: (id: string) => void;
  clearDraftSel: () => void;
  submitDrafts: (ids: string[]) => void;
  // create wizard
  openCreate: () => void;
  closeModal: () => void;
  mSetPath: (pid: string) => void;
  mSetType: (t: ItemType) => void;
  chooseManual: () => void;
  openCreateManual: () => void;
  openCreateBulk: () => void;
  closeInline: () => void;
  confirmInlineAdd: () => void;
  cancelConfirmAdd: () => void;
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
  submitItem: () => void;
  deleteItem: (id: string, force?: boolean) => void;
  withdrawToDraft: (id: string, force?: boolean) => void;
  bulkDemo: () => Promise<void>;
  importWorkplan: (buf: ArrayBuffer) => Promise<void>;
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
  // manage launch plans
  openLaunchPlans: () => void;
  closeLaunchPlans: () => void;
  addLaunchPlan: (batch: string) => void;
  updLaunchPlan: (id: string, k: keyof LaunchPlan, v: string) => void;
  removeLaunchPlan: (id: string, force?: boolean) => void;
  selectExecBatch: (batch: string) => void;
  togglePlanItem: (planId: string, itemId: string, forceMove?: boolean) => void;
  setItemBatch: (itemId: string, batch: string | null, force?: boolean) => void;
  setItemBudget: (itemId: string, v: string) => void;
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
// Backend-auth mode (ported from the roles-access reference): when the auth
// provider is not "mock", /api/auth/me is the source of truth for the UI role.
const BACKEND_AUTH = (process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'mock') !== 'mock';
// Backend RBAC role codes → the UI role keys (adapted: system_admin maps to
// our dedicated 'admin' UI role instead of 'ai' as in the reference).
const roleFromBackend = (roles: string[] = []): RoleKey =>
  roles.includes('system_admin')
    ? 'admin'
    : roles.includes('ai_committee') || roles.includes('program_admin')
      ? 'ai'
      : roles.includes('stream_owner')
        ? 'path'
        : roles.includes('entity_coordinator')
          ? 'coord'
          : 'entity';

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
    adminDash: false,
    modalOpen: false,
    mStep: 'path',
    method: 'manual',
    launchPlansOpen: false,
    draft: null,
    fStep: 1,
    editingId: null,
    editCtx: null,
    aiLoading: false,
    aiResult: null,
    bulkRows: [],
    bulkLoading: false,
    bulkLoaded: false,
    bulkLaunches: [],
    resultModal: null,
    detailId: null,
    teamOpen: false,
    deadlinesOpen: false,
    rankOpen: false,
    notifOpen: false,
    profileOpen: false,
    basketOpen: false,
    basketTab: 'heads',
    dActionMenuOpen: false,
    menuOpenId: null,
    fundSel: [],
    assignSel: [],
    assign: null,
    cancelFund: null,
    reqModal: null,
    confirmModal: null,
    subReview: null,
    rankRows: [],
    rankDragFrom: null,
    dViewStep: null,
    navSection: 'overview',
    navStream: null,
    draftSel: [],
    batchFilter: null,
    svcServiceF: 'all',
    svcSectorF: 'all',
    svcPrioF: 'all',
    stgTaskF: 'all',
    stgAxisF: 'all',
    stgSectorF: 'all',
    stgPrioF: 'all',
    opsCatF: 'all',
    opsSectorF: 'all',
    opsSupportF: 'all',
    inlineCreate: false,
    confirmAdd: false,
    filter: 'all',
    statusFilter: 'all',
    fundFilter: 'all',
    search: '',
    entFilter: 'all',
    execEnt: 'all',
    execStream: 'all',
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
    // Default role for the delivered build (the switcher is removed): the
    // entity rep. Production will map roles from the IdP / users table.
    role: (process.env.NEXT_PUBLIC_DEFAULT_ROLE as RoleKey) || 'coord',
    myPath: 'ops',
    // streams this coordinator is assigned to (entity rep can assign several);
    // the header shows a switcher when there is more than one
    myPaths: process.env.NEXT_PUBLIC_DEMO_MODE === '1' ? ['ops', 'services'] : ['ops'],
    entityName: DEFAULT_ENTITY,
    setupDone: false,
    items: seedItems(),
    launchPlans: recalcPlanBudgets(seedItems(), seedLaunchPlans()),
    expectedResults: seedExpectedResults(),
    contactEmails: { ...DEFAULT_CONTACT_EMAILS },
    aboutHero: DEFAULT_ABOUT_HERO,
    about: JSON.parse(JSON.stringify(DEFAULT_ABOUT)) as AboutContent,
    libraryDocs: DEFAULT_LIBRARY_DOCS.map((d) => ({ ...d })),
    inquiries: [],
    users: seedUsers(DEFAULT_ENTITY),
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

// The plan's EXECUTION budget is derived automatically: the sum of the
// execution budgets of the items attached to it (empty when none carry one).
// legacy batch naming («إطلاق المرحلة …») → the current «إطلاق الدفعة …»
const normBatch = (b?: string) => (b ? b.replace(/^إطلاق المرحلة /, 'إطلاق الدفعة ') : b);
function normalizeBatches(items: Item[], plans: LaunchPlan[]): void {
  items.forEach((it) => {
    if (it.execBatch) it.execBatch = normBatch(it.execBatch)!;
  });
  plans.forEach((pl) => {
    if (pl.batch) pl.batch = normBatch(pl.batch)!;
  });
}

function recalcPlanBudgets(items: Item[], plans: LaunchPlan[]): LaunchPlan[] {
  return plans.map((p) => {
    const sum = items
      .filter((i) => (i.launchPlanIds || []).includes(p.id))
      .reduce((a, i) => a + parseBudget(i.budget), 0);
    return { ...p, budget: sum > 0 ? sum.toLocaleString('en-US') + ' درهم' : '' };
  });
}

// deputy shares the stream-head logic; the secretariat shares the committee's
export const logicRole = (r: RoleKey): RoleKey =>
  r === 'coord' || r === 'deputy' ? 'path' : r === 'secretariat' ? 'ai' : r;

export const actorName = (s: State): string => {
  if (s.role === 'entity') return s.setup.rep.name || 'ممثل الجهة';
  if (s.role === 'ai') return 'رئيس اللجنة الوطنية';
  if (s.role === 'secretariat') return 'الأمانة العامة للجنة الوطنية';
  // رئيس المسار: the real stream head, per stream
  if (s.role === 'path') return PATH_REPS[s.myPath] || 'رئيس المسار';
  if (s.role === 'deputy') return 'نائب رئيس مسار ' + (PATHS.find((p) => p.id === s.myPath)?.name || '');
  const owner = s.setup.owners[s.myPath];
  if (owner?.name) return owner.name;
  return 'منسق المسار';
};
export const actorRole = (s: State): string => {
  if (s.role === 'entity') return 'ممثل الجهة';
  if (s.role === 'ai') return 'رئيس اللجنة الوطنية';
  if (s.role === 'secretariat') return 'الأمانة العامة للجنة الوطنية';
  if (s.role === 'coord') return 'منسق المسار';
  if (s.role === 'deputy') return 'نائب رئيس المسار';
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
      myPaths: s.myPaths,
      setupDone: s.setupDone,
      seedV: SEED_V,
      items: s.items,
      launchPlans: s.launchPlans,
      expectedResults: s.expectedResults,
      contactEmails: s.contactEmails,
      aboutHero: s.aboutHero,
      about: s.about,
      libraryDocs: s.libraryDocs,
      inquiries: s.inquiries,
      users: s.users,
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
    // public (pre-login) pages persist locally only — an anonymous visitor must
    // never overwrite the shared server state
    if (s.view !== 'login') apiPut(data);
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
        const fresh = saved.seedV !== SEED_V;
        const items = (!fresh && Array.isArray(saved.items) ? (saved.items as Item[]) : seedItems())
          // migrate legacy single-plan field to the multi-plan array
          .map((it) =>
            it.launchPlanIds || !it.launchPlanId ? it : { ...it, launchPlanIds: [it.launchPlanId] }
          );
        const launchPlansRaw =
          !fresh && Array.isArray(saved.launchPlans)
            ? (saved.launchPlans as LaunchPlan[])
            : seedLaunchPlans();
        normalizeBatches(items, launchPlansRaw);
        const launchPlans = recalcPlanBudgets(items, launchPlansRaw);
        set((s) => ({
          ...s,
          launchPlans,
          expectedResults: !fresh && Array.isArray(saved!.expectedResults) ? (saved!.expectedResults as ExpectedResult[]) : seedExpectedResults(),
          contactEmails: saved!.contactEmails && typeof saved!.contactEmails === 'object' ? { ...DEFAULT_CONTACT_EMAILS, ...(saved!.contactEmails as Record<string, string>) } : { ...DEFAULT_CONTACT_EMAILS },
          aboutHero: typeof saved!.aboutHero === 'string' && (saved!.aboutHero as string).trim() ? (saved!.aboutHero as string) : DEFAULT_ABOUT_HERO,
          about: (() => {
            const merged = !fresh && saved!.about && typeof saved!.about === 'object' ? { ...(JSON.parse(JSON.stringify(DEFAULT_ABOUT)) as AboutContent), ...(saved!.about as Partial<AboutContent>) } : (JSON.parse(JSON.stringify(DEFAULT_ABOUT)) as AboutContent);
            // backfill milestone photos added to the defaults after the user's
            // about content was first persisted (matched by year)
            merged.timeline = (merged.timeline || []).map((t) =>
              t.img ? t : { ...t, img: DEFAULT_ABOUT.timeline.find((d) => d.year === t.year)?.img }
            );
            return merged;
          })(),
          libraryDocs: Array.isArray(saved!.libraryDocs) && (saved!.libraryDocs as LibraryDoc[]).length ? (saved!.libraryDocs as LibraryDoc[]) : DEFAULT_LIBRARY_DOCS.map((d) => ({ ...d })),
          inquiries: Array.isArray(saved!.inquiries) ? (saved!.inquiries as ContactInquiry[]) : [],
          view: (saved!.view as State['view']) || 'login',
          lang: (saved!.lang as State['lang']) || 'ar',
          entityName: (saved!.entityName as string) || DEFAULT_ENTITY,
          role: fresh
            ? ((process.env.NEXT_PUBLIC_DEFAULT_ROLE as RoleKey) || 'coord')
            : ((saved!.role as RoleKey) || (process.env.NEXT_PUBLIC_DEFAULT_ROLE as RoleKey) || 'coord'),
          myPath: (saved!.myPath as string) || 'ops',
          myPaths: Array.isArray(saved!.myPaths) && (saved!.myPaths as string[]).length ? (saved!.myPaths as string[]) : s.myPaths,
          setupDone: !!saved!.setupDone,
          users: !fresh && Array.isArray(saved!.users) ? (saved!.users as UserRec[]) : seedUsers(DEFAULT_ENTITY),
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
      // in API/Postgres mode, prefer server state when present. The state API
      // requires a session (reference behavior): if the first read is
      // unauthenticated, hit /api/auth/login once — with the mock provider
      // (dev) it silently establishes a session; with real providers the user
      // signs in through the normal flow and until then we stay on local state.
      if (API_MODE) {
        fetch('/api/state')
          .then(async (r) => {
            if (r.status === 401) {
              await fetch('/api/auth/login').catch(() => {});
              return fetch('/api/state');
            }
            return r;
          })
          .then((r) => r.json())
          .then((res) => {
            const d = res?.data;
            if (!d) return;
            const items = d.seedV === SEED_V && Array.isArray(d.items) ? (d.items as Item[]) : seedItems();
            normalizeBatches(items, []);
            set((s) => ({
              ...s,
              view: d.view || s.view,
              entityName: d.entityName || s.entityName,
              role: d.role || s.role,
              myPath: d.myPath || s.myPath,
              myPaths: Array.isArray(d.myPaths) && d.myPaths.length ? d.myPaths : s.myPaths,
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
      // Backend-auth mode: /api/auth/me is the source of truth for access,
      // legacy UI role, entity and stream selection. Frontend checks are UX
      // only; the backend APIs still enforce permission/scope.
      if (BACKEND_AUTH) {
        fetch('/api/auth/me', { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : null))
          .then((res) => {
            if (!res?.user) return;
            const roles = Array.isArray(res.roles) ? (res.roles as string[]) : [];
            // stream scopes drive the multi-stream coordinator switcher
            const scopes = Array.isArray(res.user.streamScopes)
              ? (res.user.streamScopes as string[]).filter(Boolean)
              : [];
            set((s) => {
              const myPath = res.user.streamId || scopes[0] || s.myPath;
              const myPaths = scopes.length ? scopes : [myPath];
              return {
                ...s,
                view: s.setupDone ? 'dashboard' : 'setup',
                role: roleFromBackend(roles),
                myPath: myPaths.includes(myPath) ? myPath : myPaths[0],
                myPaths,
              };
            });
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
    // sign-in lands directly on the platform — team members are provisioned
    // centrally by the admin for all entities (no self-service setup screen)
    loginUaePass: () => {
      set({ view: 'dashboard' });
      persist();
    },
    logout: () => {
      if (BACKEND_AUTH && typeof window !== 'undefined') {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
          set({ view: 'login', ui: { ...defaultUi() } });
          persist();
        });
        return;
      }
      set({ view: 'login', ui: { ...defaultUi() } });
      persist();
    },
    toggleLang: () => set((s) => ({ lang: s.lang === 'ar' ? 'en' : 'ar' })),

    // ---- setup ----
    setSetupStep: (n) => {
      // moving forward past step 1 requires the rep's mandatory fields —
      // including the email (used for official notifications)
      if (n > 1) {
        const r = get().setup.rep;
        if (!(r.name || '').trim()) return toast('نرجو إدخال اسم مسؤول الجهة');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r.email || '').trim()))
          return toast('نرجو إدخال بريد إلكتروني صحيح لمسؤول الجهة');
        if (!(r.phone || '').trim()) return toast('نرجو إدخال رقم هاتف مسؤول الجهة');
      }
      setUi({ setupStep: n });
    },
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

      // Auto-register team roles (role-assignment rules) when the server
      // security layer is active — the backend creates RoleAssignmentRule
      // rows so the team gets its roles on first login.
      if (BACKEND_AUTH || API_MODE) {
        const s = get();
        fetch('/api/team/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            entityName: s.entityName,
            rep: s.setup.rep,
            owners: s.setup.owners,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.ok) toast('تم إنشاء صلاحيات الفريق تلقائياً');
          })
          .catch(() => {});
      }
    },
    skipSetup: () => {
      set({ setupDone: true, view: 'dashboard' });
      persist();
    },

    // ---- role ----
    setRole: (r) => {
      set((s) => ({
        role: r,
        ui: { ...s.ui, activePath: 'all', entFilter: 'all', stepFilter: null, statusFilter: 'all', fundFilter: 'all', search: '', navSection: 'overview', navStream: null, batchFilter: null },
      }));
      persist();
    },

    // ---- admin: user & role management ----
    adminSaveUser: (u) => {
      set((s) => {
        const exists = s.users.some((x) => x.id === u.id);
        const users = exists ? s.users.map((x) => (x.id === u.id ? { ...x, ...u } : x)) : [...s.users, u];
        return { users };
      });
      persist();
      toast(get().users.some((x) => x.id === u.id) ? 'تم حفظ المستخدم' : 'تمت الإضافة');
    },
    adminToggleUser: (id) => {
      set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) }));
      persist();
    },
    adminRemoveUser: (id) => {
      set((s) => ({ users: s.users.filter((x) => x.id !== id) }));
      persist();
      toast('تم حذف المستخدم');
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
    markNotifsRead: (ids) => {
      set((s) => ({ readNotifs: Array.from(new Set([...s.readNotifs, ...ids])) }));
      persist();
    },
    toggleProfile: () => set((s) => ({ ui: { ...s.ui, profileOpen: !s.ui.profileOpen, notifOpen: false } })),
    openTeam: () => setUi({ teamOpen: true, profileOpen: false }),
    closeTeam: () => setUi({ teamOpen: false }),
    // team members are managed centrally from the admin console
    goEditTeam: () => setUi({ teamOpen: false }),
    openBasket: () => setUi({ basketOpen: true }),
    closeBasket: () => setUi({ basketOpen: false }),
    openResultModal: (id) => {
      const st = get();
      const ex = id ? st.expectedResults.find((r) => r.id === id) : null;
      setUi({ resultModal: { id: ex?.id ?? null, text: ex?.text ?? '', itemIds: ex ? [...ex.itemIds] : [] } });
    },
    closeResultModal: () => setUi({ resultModal: null }),
    setResultText: (t) => {
      const m = get().ui.resultModal;
      if (m) setUi({ resultModal: { ...m, text: t } });
    },
    toggleResultItem: (itemId) => {
      const m = get().ui.resultModal;
      if (!m) return;
      const has = m.itemIds.includes(itemId);
      setUi({ resultModal: { ...m, itemIds: has ? m.itemIds.filter((x) => x !== itemId) : [...m.itemIds, itemId] } });
    },
    saveResult: () => {
      const st = get();
      const m = st.ui.resultModal;
      if (!m) return;
      if (!stripHtml(m.text).trim()) return toast('نرجو إدخال نص النتيجة المتوقعة');
      const path = st.role === 'coord' || st.role === 'path' ? st.myPath : (st.items.find((i) => m.itemIds.includes(i.id))?.path ?? st.myPath);
      if (m.id) {
        set({ expectedResults: st.expectedResults.map((r) => (r.id === m.id ? { ...r, text: m.text, itemIds: m.itemIds } : r)) });
      } else {
        set({ expectedResults: [...st.expectedResults, { id: 'er' + Date.now(), text: m.text, itemIds: m.itemIds, path }] });
      }
      setUi({ resultModal: null });
      persist();
      toast('تم حفظ النتيجة المتوقعة');
    },
    deleteResult: (id) => {
      set({ expectedResults: get().expectedResults.filter((r) => r.id !== id) });
      persist();
      toast('تم حذف النتيجة المتوقعة');
    },
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
    setAdminDash: (v) => setUi({ adminDash: v, navSection: 'overview' }),
    // coordinator stream switcher: change the ACTIVE stream among the assigned ones
    setMyPath: (p) => {
      const st = get();
      if (st.myPath === p) return;
      // demo mode lets the coordinator switch to ANY stream (to exercise them
      // all from one login); production stays restricted to assigned streams
      const demoAllStreams = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
      if (!demoAllStreams && !st.myPaths.includes(p)) return;
      set({
        myPath: p,
        ui: { ...st.ui, filter: 'all', stepFilter: null, modalOpen: false, inlineCreate: false, draft: null, editingId: null, mStep: 'path' },
      });
      persist();
    },
    setFilter: (v) => setUi({ filter: v }),
    setStatusFilter: (v) => setUi({ statusFilter: v }),
    // ---- in-app confirmation dialog ----
    closeConfirm: () => setUi({ confirmModal: null }),
    confirmOk: () => {
      const cm = get().ui.confirmModal;
      if (!cm) return;
      setUi({ confirmModal: null });
      if (cm.kind === 'deleteItem') get().deleteItem(cm.payload.id, true);
      else if (cm.kind === 'withdrawDraft') get().withdrawToDraft(cm.payload.id, true);
      else if (cm.kind === 'deletePlan') get().removeLaunchPlan(cm.payload.id, true);
      else if (cm.kind === 'crossMove') get().togglePlanItem(cm.payload.planId, cm.payload.itemId, true);
      else if (cm.kind === 'moveBatch') get().setItemBatch(cm.payload.itemId, cm.payload.batch, true);
    },
    confirmAlt: () => {
      const cm = get().ui.confirmModal;
      if (!cm) return;
      setUi({ confirmModal: null });
    },
    setNavSection: (v) => setUi({ navSection: v, navStream: null, batchFilter: null, search: '', statusFilter: 'all', modalOpen: false, inlineCreate: false, draft: null, editingId: null, mStep: 'path' }),
    setNavStream: (v) => setUi({ navStream: v, modalOpen: false, inlineCreate: false, draft: null, editingId: null, mStep: 'path' }),
    setBatchFilter: (v) => setUi({ batchFilter: v }),
    openBatchItems: (batch, section) =>
      setUi({ navSection: section, navStream: null, batchFilter: batch, search: '', statusFilter: 'all' }),
    setFundFilter: (v) => setUi({ fundFilter: v }),
    setSearch: (v) => setUi({ search: v }),
    setEntFilter: (v) => setUi({ entFilter: v }),
    // exec/launch page filters — reset the drill-down drawer on change so the
    // viewer isn't stranded on a now-empty detail view
    setExecEnt: (v) => setUi({ execEnt: v, detailId: null }),
    setExecStream: (v) => setUi({ execStream: v, detailId: null }),
    resetFilters: () => setUi({ activePath: 'all', filter: 'all', statusFilter: 'all', fundFilter: 'all', entFilter: 'all', search: '', stepFilter: null, batchFilter: null, svcServiceF: 'all', svcSectorF: 'all', svcPrioF: 'all', stgTaskF: 'all', stgAxisF: 'all', stgSectorF: 'all', stgPrioF: 'all', opsCatF: 'all', opsSectorF: 'all', opsSupportF: 'all' }),
    setSvcFilter: (k, v) => setUi({ [k]: v } as Partial<UiState>),
    setStgFilter: (k, v) => setUi({ [k]: v } as Partial<UiState>),
    setOpsFilter: (k, v) =>
      // switching away from عمليات الدعم المؤسسي clears the support filter
      setUi(k === 'opsCatF' && v !== SUPPORT_OPTYPE ? ({ [k]: v, opsSupportF: 'all' } as Partial<UiState>) : ({ [k]: v } as Partial<UiState>)),
    setItemDate: (id, k, v) => {
      const it = findItem(id);
      // keep the entry's dates inside its دفعة window
      const ph = it ? execMilestones(it.path).find((b) => b.name === it.execBatch) : null;
      let val = v;
      if (val && ph) {
        if (ph.start && val < ph.start) val = ph.start;
        if (ph.end && val > ph.end) val = ph.end;
      }
      patchItem(id, { [k]: val } as Partial<Item>);
    },
    // delegate to setItemBatch so cross-batch moves get the confirm dialog,
    // the stageMove stamp (which drives the رئيس المسار notification) and the
    // launch-plan/budget cleanup — a plain patch skips all of that
    assignItemBatch: (id, batch) => get().setItemBatch(id, batch),
    setContactEmail: (k, v) => {
      set((st) => ({ contactEmails: { ...st.contactEmails, [k]: v } }));
      persist();
    },
    setAboutHero: (v) => {
      set({ aboutHero: v });
      persist();
    },
    setAbout: (patch) => {
      set((st) => ({ about: { ...st.about, ...patch } }));
      persist();
    },
    updLibDoc: (id, patch) => {
      set((st) => ({ libraryDocs: st.libraryDocs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
      persist();
    },
    addLibDoc: () => {
      set((st) => ({
        libraryDocs: [
          ...st.libraryDocs,
          { id: 'doc-' + Date.now().toString(36), title: 'وثيقة جديدة', cat: 'guide' as const, date: '', fileUrl: '' },
        ],
      }));
      persist();
    },
    removeLibDoc: (id) => {
      set((st) => ({ libraryDocs: st.libraryDocs.filter((d) => d.id !== id) }));
      persist();
    },
    addInquiry: (q) => {
      set((st) => ({
        inquiries: [
          { id: 'inq-' + Date.now().toString(36), ...q, ts: Date.now(), done: false },
          ...st.inquiries,
        ],
      }));
      persist();
    },
    toggleInquiryDone: (id) => {
      set((st) => ({ inquiries: st.inquiries.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
      persist();
    },
    toggleStepFilter: (n) => set((s) => ({ ui: { ...s.ui, stepFilter: s.ui.stepFilter === n ? null : n } })),
    toggleDraftSel: (id) =>
      set((st) => ({
        ui: { ...st.ui, draftSel: st.ui.draftSel.includes(id) ? st.ui.draftSel.filter((x) => x !== id) : [...st.ui.draftSel, id] },
      })),
    clearDraftSel: () => setUi({ draftSel: [] }),
    // group send-for-approval: only complete drafts move to رئيس المسار
    submitDrafts: (ids) => {
      const st = get();
      const ok: string[] = [];
      ids.forEach((id) => {
        const it = st.items.find((x) => x.id === id);
        if (!it || wfOf(it) !== 'draft') return;
        if (missingFieldsOf(it as unknown as Record<string, unknown>).length) return;
        ok.push(id);
      });
      if (ok.length) {
        set((s2) => ({
          items: s2.items.map((it) =>
            ok.includes(it.id) ? { ...it, wf: 'ent1' as WfState, approval: 'تم الإرسال', ret: null, log: withLog(s2, it, 'submit') } : it
          ),
        }));
        persist();
      }
      setUi({ draftSel: [] });
      toast(ok.length ? 'تم إرسال ' + ok.length + (ok.length === 1 ? ' مدخل' : ' مدخلات') + ' لاعتماد رئيس المسار' : 'لم يُرسل أي مدخل — نرجو استكمال الحقول الناقصة أولاً');
    },

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
        // coord starts by picking HOW to add (bulk / manual), then the type
        setUi({
          ...common,
          mStep: 'method',
          method: 'manual',
          draft: blankItem('project', s.myPath),
          activePath: s.myPath,
        });
      } else {
        setUi({ ...common, mStep: 'path' });
      }
    },
    closeModal: () => setUi({ modalOpen: false, draft: null, editingId: null }),
    mSetPath: (pid) => {
      set((s) => ({ ui: { ...s.ui, draft: blankItem('project', pid), mStep: 'method' } }));
    },
    mSetType: (t) => {
      const s = get();
      const path = s.ui.draft?.path || s.myPath;
      set((st) => ({
        ui: {
          ...st.ui,
          draft: blankItem(t, path),
          mStep: st.ui.method === 'bulk' ? 'bulk' : 'form',
          fStep: 1,
        },
      }));
    },
    chooseManual: () => {
      const s = get();
      const types = availTypes(s.ui.draft?.path || s.myPath);
      if (types.length === 1) {
        setUi({ method: 'manual' });
        get().mSetType(types[0].key);
        return;
      }
      setUi({ method: 'manual', mStep: 'type' });
    },
    // direct entry points for the two main CTAs on the list page
    openCreateManual: () => {
      get().openCreate();
      get().chooseManual();
      // the manual form renders inline under the table, not as a popup
      setUi({ modalOpen: false, inlineCreate: true, confirmAdd: false });
    },
    closeInline: () => setUi({ inlineCreate: false, confirmAdd: false, draft: null, editingId: null }),
    confirmInlineAdd: () => {
      setUi({ confirmAdd: false });
      get().submitItem();
      setUi({ inlineCreate: false, modalOpen: false, mStep: 'path', draft: null, editingId: null });
    },
    cancelConfirmAdd: () => setUi({ confirmAdd: false }),
    openCreateBulk: () => {
      get().openCreate();
      get().chooseBulk();
    },
    // bulk goes straight to the template/upload step — the file carries the types
    chooseBulk: () => setUi({ method: 'bulk', mStep: 'bulk' }),
    mBack: () => {
      // flow: (path) → method → type (manual) → form | bulk
      const s = get();
      const order: MStep[] = ['path', 'method', 'type', 'form'];
      const idx = order.indexOf(s.ui.mStep);
      if (s.ui.mStep === 'bulk') return setUi({ mStep: 'method' });
      if (s.ui.mStep === 'bulkReview') return setUi({ mStep: 'bulk' });
      if (idx > 0) {
        // coord: don't go back past method (no path selection)
        const min = s.role === 'coord' ? 1 : 0;
        setUi({ mStep: order[Math.max(min, idx - 1)] });
      }
    },
    setDraftField: (k, v) =>
      set((s) => (s.ui.draft ? { ui: { ...s.ui, draft: { ...s.ui.draft, [k]: v } } } : {})),
    fNext: () => {
      const s = get();
      const d = s.ui.draft;
      // operations stream: a single-step process form (حصر قائمة العمليات)
      if (d?.type === 'operation' && d?.path === 'ops') {
        const filledO = (v: unknown) => !!stripHtml(String(v ?? '')).trim();
        const dO = d as unknown as Record<string, unknown>;
        const actsO = (d.activities || []).filter((a) => Object.values(a).some((v) => stripHtml(String(v ?? '')).trim()));
        const reqO = ['opType', 'title'];
        if (String(dO.opType ?? '') === SUPPORT_OPTYPE) reqO.push('supportFn');
        // every نشاط carries its own full details — each section must be complete
        const actsBadO = actsO.length ? actsO.some((a) => activityMissing('ops', a).length > 0) : true;
        if (reqO.some((k) => !filledO(dO[k])) || actsBadO) {
          return toast('نرجو التكرم باستكمال جميع الحقول المطلوبة (المميزة بعلامة *) قبل المتابعة');
        }
        const arabO = [String(dO.title ?? ''), ...actsO.flatMap((a) => [a.name, a.sector, a.dept, a.section].map((v) => String(v ?? '')))];
        if (arabO.some((v) => /[A-Za-z]/.test(stripHtml(v)))) {
          return toast('يرجى إدخال النص بالعربية فقط في الحقول العربية');
        }
        if (s.ui.inlineCreate) {
          setUi({ confirmAdd: true });
          return;
        }
        get().submitItem();
        return;
      }
      // strategy stream: a single-step task form (حصر قائمة المهام)
      if (d?.type === 'operation' && d?.path === 'strategy') {
        const filledT = (v: unknown) => !!stripHtml(String(v ?? '')).trim();
        const dt = d as unknown as Record<string, unknown>;
        const actsT = (d.activities || []).filter((a) => Object.values(a).some((v) => stripHtml(String(v ?? '')).trim()));
        const reqT = ['title', 'axis'];
        const actsBadT = actsT.length ? actsT.some((a) => activityMissing('strategy', a).length > 0) : true;
        if (reqT.some((k) => !filledT(dt[k])) || actsBadT) {
          return toast('نرجو التكرم باستكمال جميع الحقول المطلوبة (المميزة بعلامة *) قبل المتابعة');
        }
        const arabT = [String(dt.title ?? ''), ...actsT.flatMap((a) => [a.name, a.sector, a.dept, a.section].map((v) => String(v ?? '')))];
        if (arabT.some((v) => /[A-Za-z]/.test(stripHtml(v)))) {
          return toast('يرجى إدخال النص بالعربية فقط في الحقول العربية');
        }
        if (s.ui.inlineCreate) {
          setUi({ confirmAdd: true });
          return;
        }
        get().submitItem();
        return;
      }
      // services stream: a single-step form with its own required set; the
      // execution stage defaults to «سيتم التحديد بعد الدراسة»
      if (d?.type === 'service') {
        const filledSvc = (v: unknown) => !!stripHtml(String(v ?? '')).trim();
        const ds = d as unknown as Record<string, unknown>;
        const actsS = (d.activities || []).filter((a) => Object.values(a).some((v) => stripHtml(String(v ?? '')).trim()));
        const actsBadS = actsS.length ? actsS.some((a) => activityMissing('services', a).length > 0) : true;
        if (!filledSvc(ds.title) || actsBadS) {
          return toast('نرجو التكرم باستكمال جميع الحقول المطلوبة (المميزة بعلامة *) قبل المتابعة');
        }
        const arabS = [String(ds.title ?? ''), ...actsS.flatMap((a) => [a.sector, a.dept, a.section].map((v) => String(v ?? '')))];
        if (arabS.some((v) => /[A-Za-z]/.test(stripHtml(v)))) {
          return toast('يرجى إدخال النص بالعربية فقط في الحقول العربية');
        }
        if (s.ui.inlineCreate) {
          setUi({ confirmAdd: true });
          return;
        }
        get().submitItem();
        return;
      }
      // every input is mandatory except the estimated budget — validate the
      // current step's fields before moving on
      const filled = (v: unknown) => !!stripHtml(String(v ?? '')).trim();
      const dd = (d || {}) as unknown as Record<string, unknown>;
      const isOp = d?.type === 'operation';
      // services returned early above; widen so the shared arrays still typecheck
      const isSvc = (d?.type as string) === 'service';
      // agent count/nature apply to operations & services only (not projects)
      const hasAgents = isOp || isSvc;
      const requiredByStep: Record<number, string[]> = {
        1: ['title', 'desc', ...(isOp ? ['linkedToService', 'subActivities', 'sector', 'dept', 'section'] : []), ...(isSvc ? ['serviceOwner', 'targetUsers'] : [])],
        2: [...(isOp ? ['automationSystem'] : []), ...(isSvc ? ['currentJourney', 'painPoints', 'expectedImprovement'] : []), ...(isOp || isSvc ? ['durationBefore', 'durationAfter'] : [])],
        3: [...(hasAgents ? ['aiModels', 'agentNature'] : [])],
        4: ['scopeOfWork'],
        5: [],
      };
      const missing = (requiredByStep[s.ui.fStep] || []).filter((k) => !filled(dd[k]));
      if (missing.length) {
        return toast(
          s.ui.fStep === 1 && missing.includes('title')
            ? 'نرجو إدخال اسم ' + typeLabelDefFor(d?.type || '', d?.path) + ' قبل المتابعة'
            : 'نرجو التكرم باستكمال جميع الحقول المطلوبة (المميزة بعلامة *) قبل المتابعة'
        );
      }
      // Arabic-only guard: the Arabic text fields must not contain Latin letters
      const arabicByStep: Record<number, string[]> = {
        1: ['title', 'desc', 'subActivities', 'sector', 'dept', 'section', 'serviceOwner', 'targetUsers', 'linkedServiceName'],
        2: ['automationSystem', 'currentJourney', 'painPoints', 'expectedImprovement', 'durationBefore', 'durationAfter'],
        3: [],
        4: ['scopeOfWork'],
        5: [],
      };
      if ((arabicByStep[s.ui.fStep] || []).some((k) => /[A-Za-z]/.test(stripHtml(String(dd[k] ?? ''))))) {
        return toast('يرجى إدخال النص بالعربية فقط في الحقول العربية');
      }
      // numeric/attachment fields marked * that the text check above can't see
      if (s.ui.fStep === 1 && isOp && dd.linkedToService === 'نعم' && !filled(dd.linkedServiceName)) {
        return toast('نرجو تحديد الخدمة المرتبطة بـ' + typeLabelDefFor('operation', d?.path) + ' قبل المتابعة');
      }
      if (s.ui.fStep === 2 && !Number(dd.rank)) {
        return toast('نرجو تحديد ترتيب الأولوية (بالسحب والإفلات) قبل المتابعة');
      }
      if (s.ui.fStep === 3) {
        if (!Number(dd.targetPct)) return toast('نرجو تحديد نسبة التحول المستهدفة قبل المتابعة');
        if (hasAgents && !Number(dd.aiModels)) return toast('نرجو إدخال العدد المتوقع لمساعدي الذكاء الاصطناعي قبل المتابعة');
      }
      if (s.ui.fStep === 4 && !filled(dd.scopeFile)) {
        return toast('نرجو إرفاق مستند نطاق العمل قبل المتابعة');
      }
      if (s.ui.fStep < 5) {
        setUi({ fStep: s.ui.fStep + 1 });
        return;
      }
      if (d && (d.transformability || '') !== 'غير قابل' && !(d.execBatch || '').trim()) {
        return toast('نرجو اختيار مرحلة التنفيذ والإطلاق قبل الإرسال للاعتماد');
      }
      if (s.ui.inlineCreate) {
        setUi({ confirmAdd: true });
        return;
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
      setUi({ modalOpen: false, draft: null, editingId: null, inlineCreate: false, confirmAdd: false });
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
    deleteItem: (id, force) => {
      const it = get().items.find((x) => x.id === id);
      if (!it) return;
      const w = wfOf(it);
      const deletable = (w === 'draft' && !it.ret) || w === 'ent1';
      if (!deletable)
        return toast('يمكن حذف المسودات أو ما أُرسل ولم يُعتمد بعد فقط');
      if (!force) {
        setUi({
          confirmModal: {
            kind: 'deleteItem',
            title: w === 'ent1' ? 'سحب المدخل وحذفه' : 'حذف المسودة',
            body:
              w === 'ent1'
                ? '«' + it.title + '» مُرسل لرئيس المسار ولم يُعتمد بعد — سيُسحب ويُحذف نهائياً.'
                : 'سيتم حذف «' + it.title + '» نهائياً.',
            okLabel: w === 'ent1' ? 'سحب المدخل وحذفه' : 'حذف نهائياً',
            cancelLabel: 'إلغاء',
            payload: { id },
          },
          menuOpenId: null,
        });
        return;
      }
      set((st) => ({
        items: st.items.filter((x) => x.id !== id),
        ui: { ...st.ui, detailId: st.ui.detailId === id ? null : st.ui.detailId, menuOpenId: null },
      }));
      set((st) => ({ launchPlans: recalcPlanBudgets(st.items, st.launchPlans) }));
      persist();
      toast(w === 'ent1' ? 'تم سحب المدخل وحذفه: ' + typeLabelDefFor(it.type, it.path) : 'تم حذف المسودة');
    },
    // withdraw a submitted (ent1) المدخل back to the coordinator's DRAFT state
    // — this does NOT delete it (true deletion is deleteItem on a draft).
    withdrawToDraft: (id, force) => {
      const it = get().items.find((x) => x.id === id);
      if (!it) return;
      if (wfOf(it) !== 'ent1') return;
      if (!force) {
        setUi({
          confirmModal: {
            kind: 'withdrawDraft',
            title: 'هل تريد سحب هذا المدخل؟',
            body: 'سيتم إرجاع المدخل إلى حالة المسودة، ولن يظهر ضمن المدخلات المرسلة للاعتماد.',
            okLabel: 'تأكيد السحب',
            cancelLabel: 'إلغاء',
            payload: { id },
          },
          menuOpenId: null,
        });
        return;
      }
      patchItem(id, () => ({ wf: 'draft' as WfState, approval: 'مسودة', ret: null }));
      persist();
      toast('تم سحب المدخل وإرجاعه إلى المسودة');
    },
    submitItem: () => {
      commitDraft(get, set, persist, toast, 'تم الإرسال', false);
      set((st) => ({ launchPlans: recalcPlanBudgets(st.items, st.launchPlans) }));
      persist();
      setUi({ mStep: 'done' });
    },
    bulkDemo: async () => {
      const s = get();
      const path = s.ui.draft?.path || s.myPath;
      const types = availTypes(path);
      const tKey = (i: number) => types[i % types.length]?.key || 'project';
      const rows: BulkRow[] = [
        { type: tKey(0), title: 'أتمتة الإشعارات الموحّدة', desc: 'أتمتة إرسال الإشعارات عبر القنوات الرقمية.' },
        { type: tKey(1), title: 'لوحة مؤشرات الأداء', desc: 'لوحة' },
        { type: tKey(0), title: '', desc: 'تم الاستيراد من الملف المرفوع' },
      ];
      setUi({
        mStep: 'bulkReview',
        bulkLoading: false,
        bulkLoaded: true,
        bulkRows: rows.map(plainVerdict),
      });
    },
    importWorkplan: async (buf: ArrayBuffer) => {
      setUi({ mStep: 'bulkReview', bulkLoading: true, bulkLoaded: false, bulkRows: [], bulkLaunches: [] });
      try {
        const s0 = get();
        const path = s0.ui.draft?.path || s0.myPath;
        const spec = STREAM_FIELDS[path] || [];
        const mod = await import('exceljs');
        const ExcelJS = (mod as { default?: typeof import('exceljs') }).default || mod;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        const norm = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
        // find the header row: the row matching most spec labels on any sheet
        let best: { ws: import('exceljs').Worksheet; row: number; map: Record<number, string> } | null = null;
        wb.eachSheet((ws) => {
          for (let r = 1; r <= Math.min(ws.rowCount, 12); r++) {
            const map: Record<number, string> = {};
            let hits = 0;
            ws.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
              const h = norm(cell.value && typeof cell.value === 'object' && 'richText' in (cell.value as object) ? (cell.value as { richText: { text: string }[] }).richText.map((t) => t.text).join('') : cell.text ?? cell.value);
              if (!h) return;
              // exact label first; fuzzy only as fallback, one column per field
              const f = spec.find((sf) => sf.label === h) || (h.length > 3 ? spec.find((sf) => h.includes(sf.label) || sf.label.includes(h)) : undefined);
              if (f && !Object.values(map).includes(f.key)) {
                map[col] = f.key;
                hits++;
              }
            });
            if (hits >= Math.min(3, spec.length) && (!best || hits > Object.keys(best.map).length)) best = { ws, row: r, map };
          }
        });
        if (!best) {
          setUi({ mStep: 'bulk', bulkLoading: false });
          return toast('لم يتم العثور على بيانات في الملف — تأكد من استخدام نموذج المسار');
        }
        const b = best as { ws: import('exceljs').Worksheet; row: number; map: Record<number, string> };
        // one Excel row = one نشاط/خدمة فرعية; consecutive rows that share
        // the same header identity fold into ONE entry with activities[]
        const rawRows: Record<string, string>[] = [];
        for (let r = b.row + 1; r <= b.ws.rowCount; r++) {
          const fields: Record<string, string> = {};
          b.ws.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
            const key = b.map[col];
            if (key) fields[key] = norm(cell.text ?? cell.value);
          });
          if (Object.values(fields).some((v) => v)) rawRows.push(fields);
        }
        const keyOf = (f: Record<string, string>) =>
          path === 'ops'
            ? [f.title, f.opType, f.supportFn].join('|')
            : path === 'strategy'
              ? [f.axis, f.title].join('|')
              : f.title || '';
        const pctOf = (v: string | undefined, cap: number) =>
          v ? Math.max(0, Math.min(cap, Number(String(v).replace('%', '')) || 0)) : undefined;
        const toActivity = (f: Record<string, string>): ActivityDetail => {
          const a: ActivityDetail = {
            name: (path === 'services' ? f.subService : f.subActivities) || '',
            sector: f.sector,
            dept: f.dept,
            section: f.section,
            notes: f.notes,
          };
          if (path === 'ops') {
            a.isAutomated = f.isAutomated;
            if (f.isAutomated === 'نعم') {
              a.automationSystem = f.automationSystem;
              a.automationPct = pctOf(f.automationPct, 100);
            }
            a.transformYes = f.transformYes;
          } else if (path === 'strategy') {
            a.automationLevel = f.automationLevel;
            if (f.automationLevel === 'مؤتمتة كلياً') {
              a.automationSystem = f.automationSystem;
              a.automationPct = 100;
            } else if (f.automationLevel === 'مؤتمتة جزئياً') {
              a.automationSystem = f.automationSystem;
              a.automationPct = pctOf(f.automationPct, 95);
            }
            a.importance = f.importance;
            a.usageIntensity = f.usageIntensity;
            a.readinessLevel = f.readinessLevel;
            a.impactScore = f.impactScore;
            a.transformScore = f.transformScore;
            a.outputClarity = f.outputClarity;
            a.riskLevel = f.riskLevel;
          } else {
            a.usageIntensity = f.usageIntensity;
            a.complexity = f.complexity;
            a.readinessLevel = f.readinessLevel;
          }
          a.transformYes = activityTransformYes(path, a) || a.transformYes;
          return a;
        };
        const rows: BulkRow[] = [];
        let group: { key: string; head: Record<string, string>; acts: ActivityDetail[] } | null = null;
        const flush = () => {
          if (!group) return;
          const head = group.head;
          const base: Record<string, unknown> = { path, activities: group.acts };
          if (path === 'ops') {
            base.title = head.title;
            base.opType = head.opType;
            if (head.opType === SUPPORT_OPTYPE) base.supportFn = head.supportFn;
          } else if (path === 'strategy') {
            base.title = head.title;
            base.axis = head.axis;
          } else {
            base.title = head.title;
          }
          const mirrored = mirrorActivities(base as Partial<Item>);
          const missing = missingFieldsOf({ ...(mirrored as Record<string, unknown>), path });
          rows.push({
            type: path === 'services' ? 'service' : 'operation',
            path,
            title: String(base.title || ''),
            desc: '',
            extra: mirrored as Partial<Item>,
            missing,
          });
          group = null;
        };
        for (const f of rawRows) {
          const k = keyOf(f);
          // a row with a fresh identity (or a named title change) starts a new entry
          if (!group || (k && k !== group.key)) {
            flush();
            group = { key: k, head: f, acts: [] };
          }
          group.acts.push(toActivity(f));
        }
        flush();
        if (!rows.length) {
          setUi({ mStep: 'bulk', bulkLoading: false });
          return toast('لم يتم العثور على بيانات في الملف — تأكد من استخدام نموذج المسار');
        }
        setUi({ bulkLoading: false, bulkLoaded: true, bulkRows: rows.map(plainVerdict), bulkLaunches: [] });
      } catch {
        setUi({ mStep: 'bulk', bulkLoading: false });
        toast('تعذّرت قراءة الملف — تأكد أنه بصيغة .xlsx وبالنموذج الصحيح');
      }
    },
    submitBulk: () => {
      const s = get();
      const path = s.ui.draft?.path || s.myPath;
      const toAdd = s.ui.bulkRows
        .filter((r) => r._v !== 'يوجد خطأ')
        .map((r, ri) => {
          const complete = !(r.missing || []).length;
          return {
            ...blankItem((r.type as ItemType) || 'operation', r.path || path),
            ...(r.extra || {}),
            id: 'n' + Date.now() + ri + Math.floor(Math.random() * 1000),
            title: r.title,
            desc: r.desc,
            approval: complete ? 'تم الإرسال' : 'مسودة',
            wf: (complete ? 'ent1' : 'draft') as WfState,
            ret: null,
          };
        });
      // launch plans carried by the workplan file → إدارة خطط الإطلاق (deduped)
      const newPlans = s.ui.bulkLaunches
        .filter((l) => !s.launchPlans.some((p) => p.title === l.title && p.date === l.date))
        .map((l, i) => ({
          id: 'lp' + Date.now() + i,
          batch: l.batch,
          title: l.title,
          ltype: l.ltype,
          date: l.date,
          desc: l.desc,
          scope: '',
          budget: '',
        }));
      set((st) => ({ items: [...toAdd, ...st.items], launchPlans: [...st.launchPlans, ...newPlans] }));
      persist();
      setUi({ mStep: 'done', bulkLaunches: [] });
      if (newPlans.length) toast('تم استيراد ' + toAdd.length + ' من المدخلات');
    },

    // ---- rank modal ----
    openRank: () => {
      const s = get();
      const path = s.ui.draft?.path || s.myPath;
      const rows = s.items
        .filter((i) => i.path === path)
        .sort((a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99))
        .map((i) => ({ id: i.id, title: i.title }));
      if (s.ui.draft && s.ui.draft.title) rows.unshift({ id: s.ui.draft.id, title: s.ui.draft.title || 'بدون عنوان' });
      setUi({ rankOpen: true, rankRows: rows });
    },
    closeRank: () => setUi({ rankOpen: false }),
    saveRank: () => {
      const s = get();
      const rankById = new Map(s.ui.rankRows.map((r, i) => [r.id, i + 1]));
      set((st) => {
        const draft = st.ui.draft;
        const nextDraft =
          draft && rankById.has(draft.id) ? { ...draft, rank: rankById.get(draft.id)! } : draft;
        return {
          items: st.items.map((it) =>
            rankById.has(it.id) ? { ...it, rank: rankById.get(it.id)! } : it
          ),
          ui: { ...st.ui, draft: nextDraft, rankOpen: false },
        };
      });
      persist();
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
      // approved entries are locked — content can no longer be modified
      if (['exec', 'budget', 'launch', 'done'].includes(wfOf(it))) {
        return toast('المدخل معتمد — لا يمكن تعديل بياناته بعد الاعتماد');
      }
      setUi({
        // legacy records carry flat fields only — synthesize the per-نشاط
        // sections so the form always edits the repeatable structure
        draft: { ...it, activities: it.activities?.length ? it.activities : itemActivities(it) },
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
      if (!execAllDone(it)) return toast('نرجو إكمال جميع البنود أو تحديد سبب التأخير وتاريخ جديد قبل الانتقال للإطلاق');
      patchItem(id, { wf: 'launch' });
      toast('تم نقل ' + typeLabelDefFor(it.type, it.path) + ' إلى مرحلة الإطلاق');
    },
    toggleLaunchDone: (id, idx) => {
      const it = findItem(id);
      const target = (it?.launches || [])[idx];
      if (!it || !target) return;
      const newDone = !target.done;
      const at = newDone ? Date.now() : undefined;
      // shared launches complete together: sync every item carrying the same
      // launch (matched by title|date) — they are launched together for real
      const key = (target.title || '').trim() + '|' + (target.date || '');
      const syncable = key !== '|';
      set((st) => ({
        items: st.items.map((item) => ({
          ...item,
          launches: (item.launches || []).map((l, i) => {
            const isTarget = item.id === id && i === idx;
            const isTwin =
              syncable && (l.title || '').trim() + '|' + (l.date || '') === key;
            return isTarget || isTwin ? { ...l, done: newDone, doneAt: at } : l;
          }),
        })),
      }));
      persist();
    },
    finishLaunch: (id) => {
      const it = findItem(id);
      if (!it) return;
      if (!launchAllDone(it)) return toast('نرجو إكمال جميع بنود خطة الإطلاق أولاً');
      patchItem(id, { wf: 'done', progress: 100 });
      toast('اكتمل الإطلاق — تم إنجاز ' + typeLabelDefFor(it.type, it.path));
    },
    submitScope: (id) => {
      const it = findItem(id);
      if (!it) return;
      if (!(it.scopeOfWork || '').trim())
        return toast('نرجو استكمال نطاق العمل أولاً');
      get().doSubmitScope(id);
    },
    doSubmitScope: (id) => {
      const s = get();
      const target = findItem(id);
      patchItem(id, (it) => ({ wf: 'exec', ret: null, log: withLog(s, it, 'budget') }));
      toast('تم إرسال ' + typeLabelDef(target?.type || '') + ' لاعتماد ممثل الجهة');
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
        toast('تم اعتماد ' + typeLabelDefFor(it.type, it.path) + ' — إلى مرحلة التنفيذ');
      } else if (w === 'pm1') {
        patchItem(id, (i) => ({ wf: 'exec', ret: null, log: withLog(s, i, 'approve') }));
        toast('تم نقل ' + typeLabelDefFor(it.type, it.path) + ' إلى مرحلة التنفيذ');
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
      if (!rm.note.trim()) return toast('نرجو التكرم بكتابة الملاحظات المطلوب معالجتها');
      const it = findItem(rm.id);
      if (!it) return;
      const w = wfOf(it);
      // only pending-approval entries can be returned — approved ones are locked
      if (w !== 'ent1' && w !== 'pm1') {
        setUi({ reqModal: null });
        return toast('المدخل معتمد — لا يمكن إعادته بعد الاعتماد');
      }
      const from = w === 'ent1' ? 'رئيس المسار' : 'اللجنة الوطنية';
      const info = rm.mode === 'info';
      patchItem(rm.id, (i) => ({
        wf: 'draft',
        ret: { type: info ? 'info' : 'reject', from, note: rm.note, gate: 'priority' },
        log: withLog(s, i, info ? 'info' : 'reject', rm.note),
      }));
      setUi({ reqModal: null });
      toast(info ? 'تم طلب معلومات إضافية من منسق المسار' : 'تمت إعادة ' + typeLabelDefFor(it.type, it.path) + ' إلى منسق المسار');
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
      toast('تمت الإضافة إلى سلة الترشيح — بانتظار اللجنة الوطنية');
    },
    withdrawNom: (id) => {
      patchItem(id, { nom: null });
      toast('تم سحب الترشيح');
    },
    fundItem: (id, direct) => {
      const s = get();
      const target = findItem(id);
      if (!target) return;
      if (!isEntityApproved(target)) return toast('لا يمكن التمويل قبل اعتماد ممثل الجهة'); // only entity-approved items
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
      else nominateByCommitteeSelected(get, set, persist, toast);
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
    openAssign: () => {
      const s = get();
      const sel = s.items.filter((i) => s.ui.assignSel.includes(i.id));
      const batches = Array.from(new Set(sel.map((i) => i.execBatch).filter(Boolean)));
      // re-selecting already-planned items preselects their current batch
      setUi({ assign: { batch: batches.length === 1 ? (batches[0] as string) : '' } });
    },
    setAssign: (patch) =>
      set((s) => (s.ui.assign ? { ui: { ...s.ui, assign: { ...s.ui.assign, ...patch } } } : {})),
    closeAssign: () => setUi({ assign: null }),
    applyAssign: () => {
      const s = get();
      const a = s.ui.assign;
      if (!a) return;
      if (!(a.batch || '').trim()) return toast('اختر المرحلة أولاً');
      const ids = s.ui.assignSel;
      set((st) => ({
        items: st.items.map((it) => {
          if (!ids.includes(it.id)) return it;
          // plans from another batch no longer apply — one batch per item
          const kept = (it.launchPlanIds || []).filter(
            (pid) => st.launchPlans.find((p) => p.id === pid)?.batch === a.batch
          );
          return {
            ...it,
            execBatch: a.batch,
            launchPlanIds: kept,
            launches: launchesFromPlans(kept, st.launchPlans),
          };
        }),
        ui: { ...st.ui, assignSel: [], assign: null },
      }));
      set((st) => ({ launchPlans: recalcPlanBudgets(st.items, st.launchPlans) }));
      persist();
      toast('تم تعيين المرحلة لكل ما هو محدَّد');
    },

    // ---- manage launch plans (إدارة خطط الإطلاق) ----
    openLaunchPlans: () => setUi({ launchPlansOpen: true }),
    closeLaunchPlans: () => {
      setUi({ launchPlansOpen: false });
      persist();
    },
    addLaunchPlan: (batch: string) => {
      set((s) => ({
        launchPlans: [
          ...s.launchPlans,
          { id: 'lp' + Date.now(), batch, title: '', ltype: LAUNCH_TYPES[0], date: '', desc: '', scope: '', budget: '', launchBudget: '' },
        ],
      }));
      toast('تمت إضافة خطة إطلاق جديدة — أكمل بياناتها');
    },
    updLaunchPlan: (id: string, k: keyof LaunchPlan, v: string) => {
      set((s) => {
        const launchPlans = s.launchPlans.map((p) => (p.id === id ? { ...p, [k]: v } : p));
        // keep attached items' launch entries in sync with the edited plan
        const items = s.items.map((it) =>
          (it.launchPlanIds || []).includes(id)
            ? { ...it, launches: launchesFromPlans(it.launchPlanIds, launchPlans) }
            : it
        );
        return { launchPlans, items };
      });
    },
    removeLaunchPlan: (id: string, force?: boolean) => {
      const s = get();
      const attached = s.items.filter((it) => (it.launchPlanIds || []).includes(id)).length;
      if (attached > 0 && !force) {
        setUi({
          confirmModal: {
            kind: 'deletePlan',
            title: 'حذف خطة الإطلاق',
            body:
              'هذه الخطة مرتبطة بـ ' + attached +
              ' من المشاريع والعمليات والخدمات — ستُفصل عنها عند الحذف.',
            okLabel: 'حذف الخطة',
            cancelLabel: 'إلغاء',
            payload: { id },
          },
        });
        return;
      }
      set((st) => {
        const launchPlans = st.launchPlans.filter((p) => p.id !== id);
        return {
          launchPlans,
          // detach the removed plan; the item keeps its batch
          items: st.items.map((it) => {
            if (!(it.launchPlanIds || []).includes(id)) return it;
            const kept = (it.launchPlanIds || []).filter((x) => x !== id);
            return { ...it, launchPlanIds: kept, launches: launchesFromPlans(kept, launchPlans) };
          }),
        };
      });
      persist();
      toast('تم حذف خطة الإطلاق' + (attached ? ' وفصل ' + attached + ' من المشاريع والعمليات والخدمات عنها' : ''));
    },
    selectExecBatch: (batch: string) => {
      const s = get();
      set((st) => {
        if (!st.ui.draft) return {};
        // switching batch drops launch plans that belong to another batch
        const kept = (st.ui.draft.launchPlanIds || []).filter(
          (pid) => s.launchPlans.find((p) => p.id === pid)?.batch === batch
        );
        return {
          ui: {
            ...st.ui,
            draft: {
              ...st.ui.draft,
              execBatch: batch,
              launchPlanIds: kept,
              launches: launchesFromPlans(kept, s.launchPlans),
            },
          },
        };
      });
    },
    // inline edit of an item's EXECUTION budget (from إدارة خطط الإطلاق) —
    // saves the trip to the item's detail page and re-derives plan totals
    setItemBudget: (itemId: string, v: string) => {
      set((st) => ({
        items: st.items.map((it) => (it.id === itemId ? { ...it, budget: v } : it)),
      }));
      set((st) => ({ launchPlans: recalcPlanBudgets(st.items, st.launchPlans) }));
      persist();
    },
    // assign/unassign an item to a مرحلة from the stage items manager
    setItemBatch: (itemId, batch, force) => {
      const s = get();
      const it = s.items.find((x) => x.id === itemId);
      if (!it) return;
      if (batch && it.execBatch === batch) return;
      if (batch && it.execBatch && it.execBatch !== batch && !force) {
        setUi({
          confirmModal: {
            kind: 'moveBatch',
            title: 'نقل بين المراحل',
            body:
              typeLabelDefFor(it.type, it.path) + ' «' + it.title + '» معيَّن في ' + (it.execBatch || '').replace(/^إطلاق /, '') +
              ' — هل تودّون نقله إلى ' + batch.replace(/^إطلاق /, '') +
              '؟ سيُفصل عن إطلاقات مرحلته السابقة وسيصل إشعار بالنقل لجميع المعنيين.',
            okLabel: 'نقل وإشعار المعنيين',
            cancelLabel: 'إلغاء',
            payload: { itemId, batch },
          },
        });
        return;
      }
      const moved = !!(batch && it.execBatch && it.execBatch !== batch);
      const from = it.execBatch || '';
      const by = actorName(s);
      set((st) => ({
        items: st.items.map((x) => {
          if (x.id !== itemId) return x;
          if (!batch) return { ...x, execBatch: '', launchPlanIds: [], launches: [] };
          const keptIds = (x.launchPlanIds || []).filter(
            (pid) => st.launchPlans.find((p) => p.id === pid)?.batch === batch
          );
          return {
            ...x,
            execBatch: batch,
            launchPlanIds: keptIds,
            launches: launchesFromPlans(keptIds, st.launchPlans),
            ...(moved ? { stageMove: { from, to: batch, at: Date.now(), by } } : {}),
          };
        }),
      }));
      set((st) => ({ launchPlans: recalcPlanBudgets(st.items, st.launchPlans) }));
      persist();
      toast(
        !batch
          ? 'أُزيلت ' + typeLabelDefFor(it.type, it.path) + ' من المرحلة'
          : moved
            ? 'تم النقل إلى ' + batch.replace(/^إطلاق /, '') + ' — سيصل إشعار لجميع المعنيين'
            : 'تمت الإضافة إلى ' + batch.replace(/^إطلاق /, '')
      );
    },
    togglePlanItem: (planId: string, itemId: string, forceMove?: boolean) => {
      const s = get();
      const plan = s.launchPlans.find((p) => p.id === planId);
      if (!plan) return;
      const target = s.items.find((it) => it.id === itemId);
      if (!target) return;
      const wasAttached = (target.launchPlanIds || []).includes(planId);
      // one مرحلة per item: attaching to a plan from another مرحلة asks to MOVE
      // the item (with its launches) and notifies every stakeholder
      let crossMove = false;
      if (!wasAttached && target.execBatch && target.execBatch !== plan.batch) {
        if (!forceMove) {
          setUi({
            confirmModal: {
              kind: 'crossMove',
              title: 'نقل بين المراحل',
              body:
                typeLabelDefFor(target.type, target.path) + ' «' + target.title + '» معيَّن في ' + target.execBatch +
                ' — هل تودّون نقله إلى ' + plan.batch +
                '؟ سيُفصل عن إطلاقات مرحلته السابقة وسيصل إشعار بالنقل لجميع المعنيين.',
              okLabel: 'نقل وإشعار المعنيين',
              cancelLabel: 'إلغاء',
              payload: { planId, itemId },
            },
          });
          return;
        }
        crossMove = true;
      }
      set((st) => ({
        items: st.items.map((it) => {
          if (it.id !== itemId) return it;
          const kept = crossMove
            ? [planId]
            : wasAttached
              ? (it.launchPlanIds || []).filter((x) => x !== planId)
              : [...(it.launchPlanIds || []), planId];
          return {
            ...it,
            // adopting a plan fixes the batch; detaching keeps it
            execBatch: crossMove ? plan.batch : it.execBatch || plan.batch,
            launchPlanIds: kept,
            launches: launchesFromPlans(kept, st.launchPlans),
            ...(crossMove
              ? { stageMove: { from: target.execBatch || '', to: plan.batch, at: Date.now(), by: actorName(get()) } }
              : {}),
          };
        }),
      }));
      set((st) => ({ launchPlans: recalcPlanBudgets(st.items, st.launchPlans) }));
      persist();
      toast(
        crossMove
          ? 'تم النقل إلى ' + plan.batch + ' — سيصل إشعار لجميع المعنيين'
          : wasAttached
            ? 'تم فصل ' + typeLabelDefFor(target.type, target.path) + ' عن خطة الإطلاق'
            : 'تم ربط ' + typeLabelDefFor(target.type, target.path) + ' بخطة الإطلاق'
      );
    },
    openCancelFund: (id) => setUi({ cancelFund: { id, note: '' } }),
    setCancelFundNote: (v) => set((s) => (s.ui.cancelFund ? { ui: { ...s.ui, cancelFund: { ...s.ui.cancelFund, note: v } } } : {})),
    confirmCancelFund: () => {
      const s = get();
      const cf = s.ui.cancelFund;
      if (!cf) return;
      if (!cf.note.trim()) return toast('نرجو التكرم بتوضيح سبب إلغاء التمويل');
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
      if (!list.length) return toast('لا توجد بيانات للتصدير');
      import('./export')
        .then((m) => m.exportExcel(list, get().entityName))
        .then(() => toast('تم إنشاء ملف Excel'))
        .catch(() => toast('تعذّر إنشاء ملف Excel'));
    },
    exportPpt: () => {
      const list = exportScope(get());
      if (!list.length) return toast('لا توجد بيانات للتصدير');
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
  // drop empty نشاط sections, derive per-activity أولوية التحول, and mirror
  // the first activity onto the legacy flat fields (tables/filters/exports)
  const cleaned = Array.isArray(draft.activities)
    ? draft.activities.filter((a) => Object.values(a).some((v) => String(v ?? '').trim()))
    : undefined;
  const mirrored = mirrorActivities({ ...draft, activities: cleaned && cleaned.length ? cleaned : undefined });
  const finalItem: Item = {
    ...(mirrored as Item),
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

function nominateByCommitteeSelected(
  get: () => Store,
  set: (p: Partial<State> | ((s: State) => Partial<State>)) => void,
  persist: () => void,
  toast: (m: string) => void
) {
  // committee "add for funding" NOMINATES the selection (does not fund directly);
  // items land in the «مرشح من قبل اللجنة الوطنية» tab, then approved from there.
  const s = get();
  const ids = s.ui.fundSel;
  let n = 0;
  set((st) => ({
    items: st.items.map((it) => {
      if (!ids.includes(it.id) || it.nom || it.funded || !isEntityApproved(it)) return it;
      n++;
      return {
        ...it,
        nom: { by: 'اللجنة الوطنية', role: 'اللجنة الوطنية', path: it.path, at: Date.now(), direct: true },
        log: withLog(st, it, 'nominate'),
      };
    }),
    ui: { ...st.ui, fundSel: [] },
  }));
  persist();
  toast('تمت إضافة ' + n + ' إلى ترشيحات اللجنة الوطنية — بانتظار الاعتماد النهائي للتمويل');
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
  toast('تم ترشيح ' + n + ' من المشاريع والعمليات والخدمات إلى اللجنة الوطنية');
}

// convenience re-exports for the view-model
export { PATHS, ROLE, wfOf, entOf };
