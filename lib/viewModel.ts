'use client';
// ============================================================================
// View-model — port of renderVals(). Reads the store and produces the derived
// object the components render from (mirrors the prototype's `{{ }}` holes).
// ============================================================================
import { useMemo } from 'react';
import { useStore, logicRole, actorName } from './store';
import {
  PATHS,
  ROLE,
  ROLE_PILLS,
  TYPE,
  APPR,
  PRIO,
  PIC,
  NK,
  NIC,
  ALOG,
  pathById,
  typeLabel,
  availTypes,
  wfOf,
  wfMeta,
  stepIndexOf,
  transformScore,
  stageWeight,
  isEntityApproved,
  isProjInit,
  streamHasType,
  execAllDone,
  parseBudget,
  formatMoney,
  APPROVED_BUDGET,
  RETURNED_STATUS,
  PATH_REPS,
  entOf,
  fmtDate,
  daysLeft,
  countdown,
  execMilestones,
  launchBatches,
  START_STATES,
  DEFAULT_PROGRAM_PHASES,
  TWO_STEP_PHASES,
  type Item,
  type RoleKey,
} from './domain';

export function useViewModel() {
  const s = useStore();
  // subscribe to tick for countdown
  const tick = useStore((st) => st._tick);

  return useMemo(() => build(s), [s, tick]); // eslint-disable-line react-hooks/exhaustive-deps
}

export type VM = ReturnType<typeof build>;

type Store = ReturnType<typeof useStore.getState>;

function build(s: Store) {
  const rawRole = s.role;
  const role = logicRole(rawRole);
  const myPath = s.myPath;
  const entityName = s.entityName;
  const ui = s.ui;
  const myName = actorName(s);

  const ent = (i: Item) => entOf(i, entityName);

  // ---- base scoping (§8) ----
  let base: Item[];
  if (rawRole === 'coord') base = s.items.filter((i) => i.path === myPath && ent(i) === entityName);
  else if (role === 'path') base = s.items.filter((i) => i.path === myPath);
  else base = s.items;

  const effActivePath = role === 'path' ? myPath : ui.activePath;

  // visibility of drafts / ent1 — this is the role's whole universe: KPIs and
  // stats must count from it too, or numbers won't match the visible cards
  let roleBase = base;
  if (rawRole === 'ai' || rawRole === 'path') {
    roleBase = base.filter((i) => {
      const w = wfOf(i);
      return w !== 'draft' && w !== 'ent1';
    });
  } else if (rawRole === 'entity') {
    roleBase = base.filter((i) => wfOf(i) !== 'draft');
  }
  let visible = roleBase.slice();
  if (effActivePath !== 'all') visible = visible.filter((i) => i.path === effActivePath);
  if (ui.filter !== 'all')
    visible = visible.filter((i) =>
      ui.filter === 'projinit' ? isProjInit(i.type) : i.type === ui.filter
    );
  // status filter
  if (ui.statusFilter !== 'all') visible = visible.filter((i) => statusMatch(i, ui.statusFilter, rawRole, s));
  // entity filter (ai/path)
  if ((rawRole === 'ai' || rawRole === 'path') && ui.entFilter !== 'all')
    visible = visible.filter((i) => ent(i) === ui.entFilter);
  // step filter
  if (ui.stepFilter != null) visible = visible.filter((i) => stepIndexOf(i) === ui.stepFilter);

  // ---- KPI scope (counts what this role can actually see) ----
  const scope = effActivePath === 'all' ? roleBase : roleBase.filter((i) => i.path === effActivePath);
  const cnt = (f: (i: Item) => boolean) => scope.filter(f).length;
  const completion = scope.length
    ? Math.round(scope.reduce((a, i) => a + stageWeight(i), 0) / scope.length)
    : 0;
  const avgOf = (vals: number[]) =>
    vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  const completedCount = cnt((i) => wfOf(i) === 'done');
  const kpis = {
    total: scope.length,
    projInit: cnt((i) => isProjInit(i.type)),
    operations: cnt((i) => i.type === 'operation'),
    services: cnt((i) => i.type === 'service'),
    completion,
    // agentification metrics
    avgTargetPct: avgOf(scope.map((i) => i.targetPct).filter((v): v is number => v != null && v > 0)),
    avgAutomationPct: avgOf(scope.map((i) => i.automationPct).filter((v): v is number => v != null)),
    completedCount,
    completedPct: scope.length ? Math.round((completedCount / scope.length) * 100) : 0,
  };

  // ---- entity totals breakdown: type × stream ----
  const breakdown = PATHS.map((p) => {
    const inStream = roleBase.filter((i) => i.path === p.id);
    return {
      name: p.name,
      projInit: inStream.filter((i) => isProjInit(i.type)).length,
      operations: inStream.filter((i) => i.type === 'operation').length,
      services: inStream.filter((i) => i.type === 'service').length,
      total: inStream.length,
      hasOps: streamHasType(p.id, 'operation'),
      hasSvc: streamHasType(p.id, 'service'),
    };
  });
  const breakdownTotals = {
    name: 'الإجمالي',
    projInit: roleBase.filter((i) => isProjInit(i.type)).length,
    operations: roleBase.filter((i) => i.type === 'operation').length,
    services: roleBase.filter((i) => i.type === 'service').length,
    total: roleBase.length,
  };
  // total LAUNCH budget across the plans this portfolio participates in —
  // informational for the entity rep only (funding totals use execution cost)
  const entPlanIds = new Set(roleBase.flatMap((i) => i.launchPlanIds || []));
  const launchBudgetTotal = [...entPlanIds].reduce(
    (a, id) => a + parseBudget(s.launchPlans.find((p) => p.id === id)?.launchBudget),
    0
  );
  // matching EXECUTION total for the same portfolio (same no-double-count rule
  // as the committee: own item budgets + distinct plan execution budgets)
  const execBudgetTotal = roleBase.reduce((a, i) => a + parseBudget(i.budget), 0);

  // per-stream distribution shown INSIDE the type KPI cards (entity view) —
  // every eligible stream is listed, including zeros
  const kpiDist = {
    projInit: breakdown.map((r) => ({ label: r.name, value: r.projInit })),
    operations: breakdown
      .filter((r) => r.hasOps)
      .map((r) => ({ label: r.name, value: r.operations })),
  };

  // ---- per-batch (مرحلة) summary: items + total execution cost ----
  const batchSummary = launchBatches().map((b) => {
    const inBatch = roleBase.filter((i) => i.execBatch === b.name);
    const cost = inBatch.reduce((a, i) => a + parseBudget(i.budget), 0);
    return {
      name: b.name,
      period: b.period || '',
      count: inBatch.length,
      opsCount: inBatch.filter((i) => i.type === 'operation').length,
      costLabel: cost > 0 ? formatMoney(cost) : '—',
      // each launch in the مرحلة with its costs (entity rep + coordinator)
      launches: s.launchPlans
        .filter((p) => p.batch === b.name)
        .map((p) => ({
          id: p.id,
          title: p.title || 'خطة إطلاق جديدة',
          execLabel: parseBudget(p.budget) > 0 ? formatMoney(parseBudget(p.budget)) : '—',
          launchLabel: parseBudget(p.launchBudget) > 0 ? formatMoney(parseBudget(p.launchBudget)) : '',
          // the items behind the launch cost — expandable on click
          items: roleBase
            .filter((i) => (i.launchPlanIds || []).includes(p.id))
            .map((i) => ({
              id: i.id,
              title: i.title,
              typeLabel: typeLabel(i.type),
              budgetLabel: (i.budget || '').trim() || 'لم يتم تحديد الميزانية',
              onOpen: () => s.openDetail(i.id),
            })),
        })),
    };
  });

  // ---- role flags ----
  const isAiRole = rawRole === 'ai';
  const showRail = rawRole === 'entity';
  const showAddBtn = rawRole === 'coord';
  const showBasket = rawRole === 'ai' || rawRole === 'path';
  const showEntFilter = rawRole === 'ai' || rawRole === 'path';

  // ---- path rail ----
  const railPaths = PATHS.filter((p) => role !== 'path' || p.id === myPath);
  const pathRail = railPaths.map((p) => {
    const count = roleBase.filter((i) => i.path === p.id).length;
    const active = ui.activePath === p.id;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      icon: PIC[p.id],
      count,
      active,
      onClick: () => s.setActivePath(p.id),
    };
  });
  const totalCount = roleBase.length;

  // ---- active path title + summary ----
  const activePathName: string =
    effActivePath === 'all'
      ? 'لوحة المتابعة'
      : (role === 'path' ? 'مسار ' : '') + pathById(effActivePath).name;
  const streamSummary = summaryText(effActivePath);
  // scope-aware type enumeration — replaces the generic word "عناصر"
  const typesPhrase =
    effActivePath === 'all'
      ? 'المشاريع والمبادرات والعمليات والخدمات'
      : 'المشاريع والمبادرات' +
        (streamHasType(effActivePath, 'operation') ? ' والعمليات' : '') +
        (streamHasType(effActivePath, 'service') ? ' والخدمات' : '');

  // ---- type filter tabs ----
  const tabs = tabDefs(effActivePath, scope);

  // status filter options — ai/path (oversight roles) drop the action/pending
  // options they can't act on
  const statusOptions = [
    { v: 'all', label: 'كل الحالات' },
    ...(rawRole === 'ai' || rawRole === 'path'
      ? []
      : [
          { v: 'mine', label: 'بحاجة لإجرائي' },
          { v: 'pending', label: 'بانتظار الاعتماد' },
        ]),
    { v: 'planned', label: 'مخطط (معتمد)' },
    { v: 'done', label: 'مكتمل' },
    { v: 'draft', label: 'مسودة' },
  ];

  // path filter (ai only) + entity filter options
  const pathOptions = [{ v: 'all', label: 'كل المسارات' }, ...PATHS.map((p) => ({ v: p.id, label: p.name }))];
  const entValues = Array.from(new Set([...s.items.map((i) => ent(i)), entityName]));
  const entOptions = [{ v: 'all', label: 'كل الجهات' }, ...entValues.map((e) => ({ v: e, label: e }))];

  // ---- cards ----
  const cards = visible.map((i) => mkCard(i, s, { rawRole, role, myName, ent }));

  // bulk-assign selection state (change vs first assignment)
  const assignSelItems = s.items.filter((i) => ui.assignSel.includes(i.id));
  const assignSelBatches = Array.from(
    new Set(assignSelItems.map((i) => i.execBatch).filter((b): b is string => !!b))
  );
  const assignIsChange = assignSelItems.length > 0 && assignSelItems.every((i) => !!i.execBatch);

  // ---- committee analytics ----
  const withScore = base.filter((i) => wfOf(i) !== 'draft');
  const scores = withScore.map((i) => transformScore(i).v);
  const sumV = scores.reduce((a, b) => a + b, 0);
  const n = scores.length || 1;
  // spent budget = own budgets of committee-funded items + each funded launch
  // plan's group budget counted ONCE (items without an own budget share it)
  // plan budgets are DERIVED from item budgets, so totals sum items directly
  const fundedItems = base.filter((i) => i.funded);
  const spentBudget = fundedItems.reduce((a, i) => a + parseBudget(i.budget), 0);
  const aiStats = {
    entCount: new Set(base.map((i) => ent(i))).size,
    total: base.length,
    pending: base.filter((i) => i.approval === 'تم الإرسال' || i.approval === 'قيد المراجعة').length,
    funded: base.filter((i) => i.funded).length,
    avg: Math.round((sumV / n) * 10) / 10,
    avgPct: Math.round((sumV / n / 5) * 100),
    now: scores.filter((v) => v >= 4.2).length,
    wait: scores.filter((v) => v >= 2 && v < 4.2).length,
    low: scores.filter((v) => v < 2).length,
    // budget cards
    approvedBudget: APPROVED_BUDGET,
    approvedBudgetLabel: formatMoney(APPROVED_BUDGET),
    spentBudget,
    spentBudgetLabel: formatMoney(spentBudget),
    remainingBudgetLabel: formatMoney(Math.max(0, APPROVED_BUDGET - spentBudget)),
    budgetPct: APPROVED_BUDGET ? Math.min(100, Math.round((spentBudget / APPROVED_BUDGET) * 100)) : 0,
  };

  // ---- program steps + countdown ----
  const programSteps = buildProgramSteps(s, base);
  const firstMs = execMilestones()[0];
  const cd = countdown(firstMs.end!);
  const dl = daysLeft(firstMs.end!);
  const banner = {
    title: 'تقدم مشروع الذكاء الاصطناعي المساعد',
    subtitle: 'رحلة منظمة من الحصر والاختيار إلى التنفيذ وقياس الأثر لضمان تحول فعّال ومؤثر',
    firstMsName: firstMs.name,
    firstMsPeriod: firstMs.period,
    curPhaseDeadlineFmt: fmtDate(firstMs.end),
    cd,
    daysLeft: dl,
    deadlineColor: dl <= 3 ? '#DC2B38' : dl <= 7 ? '#B45309' : '#0B8A4B',
  };

  // ---- notifications ----
  const notifs = buildNotifs(s, base, { rawRole, role, myName, ent });
  const readSet = new Set(s.readNotifs);
  const notifUnread = notifs.filter((notif) => !readSet.has(notif.id)).length;
  const unreadLabel = notifUnread > 9 ? '9+' : String(notifUnread);

  // ---- role pills (active styles) ----
  const rolePills = ROLE_PILLS.map((p) => ({
    key: p.key,
    label: p.label,
    active: rawRole === p.key,
    onClick: () => s.setRole(p.key),
  }));

  // ---- basket ----
  const basket = buildBasket(s, { rawRole, myName, ent });

  // ---- detail ----
  const detail = ui.detailId ? buildDetail(s, ui.detailId, { rawRole, role, ent }) : null;

  // ---- create modal derived ----
  const modal = buildModal(s);

  // rep display (entity rep — used in the team panel)
  const repName = s.setup.rep.name || 'ممثل الجهة';
  const repPos = s.setup.rep.position || '';
  const repInitials = repName.split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || 'م';

  // header profile identity follows the previewed role
  const profileName =
    rawRole === 'path'
      ? PATH_REPS[myPath] || 'رئيس المسار'
      : rawRole === 'ai'
        ? 'اللجنة الوطنية'
        : rawRole === 'coord'
          ? s.setup.owners[myPath]?.name || 'منسق المسار في الجهة'
          : repName;
  const profilePos =
    rawRole === 'path'
      ? 'رئيس مسار ' + pathById(myPath).name
      : rawRole === 'ai'
        ? ROLE.ai.sub
        : rawRole === 'coord'
          ? 'منسق مسار ' + pathById(myPath).name
          : repPos;
  const profileInitials =
    profileName.split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || 'م';

  return {
    // view
    view: s.view,
    isLogin: s.view === 'login',
    isSetup: s.view === 'setup',
    isDashboard: s.view === 'dashboard',
    lang: s.lang,
    entityName,
    // header
    role: rawRole,
    roleLabel: ROLE[rawRole].label,
    rolePills,
    showRoleSwitcher: process.env.NEXT_PUBLIC_DEMO_MODE === '1',
    repName,
    repPos,
    repInitials,
    profileName,
    profilePos,
    profileInitials,
    notifs,
    notifOpen: ui.notifOpen,
    notifUnread,
    unreadLabel,
    hasUnread: notifUnread > 0,
    profileOpen: ui.profileOpen,
    showBasket,
    basketBadge: basket.pendingCount,
    hasBasketBadge: basket.pendingCount > 0,
    basketOpen: ui.basketOpen,
    // banner + steps — the program journey banner is for the working roles
    // (entity/coord); oversight roles (committee, stream rep) don't see it
    showProgramBanner: rawRole === 'entity' || rawRole === 'coord',
    banner,
    programSteps,
    isAiRole,
    // rail + kpis
    showRail,
    pathRail,
    totalCount,
    activePathAll: ui.activePath === 'all',
    activePathName,
    streamSummary,
    typesPhrase,
    kpis,
    breakdown,
    breakdownTotals,
    kpiDist,
    batchSummary,
    showLaunchCosts: rawRole === 'entity' || rawRole === 'coord' || rawRole === 'ai',
    launchBudgetTotalLabel: formatMoney(launchBudgetTotal),
    showLaunchBudget: launchBudgetTotal > 0,
    execBudgetTotalLabel: formatMoney(execBudgetTotal),
    showExecBudget: execBudgetTotal > 0,
    showOpsKpi: effActivePath === 'all' || streamHasType(effActivePath, 'operation'),
    showSvcKpi: effActivePath === 'all' || streamHasType(effActivePath, 'service'),
    notAiRole: !isAiRole,
    // filters
    tabs,
    filterValue: ui.filter,
    statusOptions,
    statusFilterValue: ui.statusFilter,
    pathOptions,
    pathFilterValue: ui.activePath,
    showEntFilter,
    entOptions,
    entFilterValue: ui.entFilter,
    showAddBtn,
    // committee
    aiStats,
    // cards
    cards,
    // basket + fund bar
    basket,
    fundBarShow: (rawRole === 'ai' || rawRole === 'path') && ui.fundSel.length > 0,
    fundSelCount: ui.fundSel.length,
    fundBarActionLabel: rawRole === 'ai' ? 'تمويل التحول' : 'ترشيح للتمويل',
    // coordinator bulk-assign bar + modal — re-selecting planned items reads as
    // a CHANGE, not a fresh assignment
    assignBar: {
      show: rawRole === 'coord' && ui.assignSel.length > 0,
      count: ui.assignSel.length,
      actionLabel: assignIsChange ? 'تغيير خطة التنفيذ والإطلاق' : 'تعيين خطة التنفيذ والإطلاق',
    },
    assignModal: ui.assign
      ? {
          batch: ui.assign.batch,
          isChange: assignIsChange,
          currentBatches: assignSelBatches,
          batchOptions: launchBatches().map((b) => ({
            name: b.name,
            label: b.period ? b.name + ' · ' + b.period : b.name,
          })),
        }
      : null,
    // detail
    detail,
    detailOpen: !!ui.detailId,
    // create modal
    modal,
    modalOpen: ui.modalOpen,
    // launch-plan manager (إدارة خطط الإطلاق)
    launchPlansOpen: ui.launchPlansOpen,
    launchPlanMgr: launchBatches().map((b) => ({
      batch: b.name,
      period: b.period || '',
      plans: s.launchPlans
        .filter((p) => p.batch === b.name)
        .map((p) => ({
          ...p,
          // items that can be launched in this plan (operations / projects-initiatives / services)
          items: roleBase.map((i) => ({
            id: i.id,
            title: i.title,
            typeLabel: typeLabel(i.type),
            checked: (i.launchPlanIds || []).includes(p.id),
            otherBatch: !!i.execBatch && i.execBatch !== p.batch,
            // the item's own EXECUTION cost (entered at creation step 4)
            budgetLabel: (i.budget || '').trim() || 'لم يتم تحديد الميزانية',
            hasBudget: !!(i.budget || '').trim(),
          })),
        })),
    })),
    // team panel
    teamOpen: ui.teamOpen,
    tmRep: s.setup.rep,
    tmOwners: PATHS.map((p) => ({
      color: p.color,
      name: p.name,
      ownerName: s.setup.owners[p.id]?.self ? repName : s.setup.owners[p.id]?.name || 'لم يُعيّن',
      ownerPos: s.setup.owners[p.id]?.self ? repPos : s.setup.owners[p.id]?.position || '—',
    })),
    // deadlines modal
    deadlinesOpen: ui.deadlinesOpen,
    deadlineRows: s.programPhases.map((p, i) => ({
      num: String(i + 1),
      name: p.n,
      deadline: p.deadline,
      onName: (v: string) => s.setPhaseName(i, v),
      onSet: (v: string) => s.setPhaseDeadline(i, v),
    })),
    // rank modal
    rankOpen: ui.rankOpen,
    rankRows: ui.rankRows.map((r, i) => ({
      id: r.id,
      title: r.title,
      num: String(i + 1),
      idx: i,
    })),
    // reject/req modal
    reqModal: ui.reqModal,
    // cancel fund modal
    cancelFund: ui.cancelFund,
    cancelFundTitle: ui.cancelFund ? (s.items.find((i) => i.id === ui.cancelFund!.id)?.title || '') : '',
    // sub review (scope)
    subReview: ui.subReview,
    // toast
    toastMsg: ui.toastMsg,
    hasToast: !!ui.toastMsg,
    // setup wizard
    setupStep: ui.setupStep,
    // raw store passthrough for actions
    store: s,
  };
}

// ---------------------------------------------------------------------------
function statusMatch(i: Item, f: string, rawRole: RoleKey, s: Store): boolean {
  const w = wfOf(i);
  const role = logicRole(rawRole);
  if (f === 'mine') {
    const canAct = rawRole === 'entity' && w === 'ent1';
    return canAct || (role === 'path' && (['draft', 'budget', 'exec', 'launch'].includes(w) || !!i.ret));
  }
  if (f === 'pending') return ['ent1', 'pm1', 'ent2', 'pm2'].includes(w);
  if (f === 'planned') return ['exec', 'launch', 'budget'].includes(w);
  return w === f;
}

function summaryText(activePath: string): string {
  if (activePath === 'ops') return 'إجمالي المشاريع والمبادرات والعمليات';
  if (activePath === 'services') return 'إجمالي المشاريع والمبادرات والخدمات';
  if (activePath === 'all') return 'إجمالي المشاريع والمبادرات والعمليات والخدمات';
  return 'إجمالي المشاريع والمبادرات';
}

function tabDefs(activePath: string, _scope: Item[]) {
  // project & initiative are one merged bucket
  const defs: { key: string; label: string; optLabel: string }[] = [
    { key: 'all', label: 'كل الأنواع', optLabel: 'كل الأنواع' },
    { key: 'projinit', label: 'المشاريع / المبادرات', optLabel: 'المشاريع / المبادرات' },
  ];
  if (activePath === 'all' || activePath === 'ops')
    defs.push({ key: 'operation', label: 'العمليات', optLabel: 'العمليات' });
  if (activePath === 'all' || activePath === 'services')
    defs.push({ key: 'service', label: 'الخدمات', optLabel: 'الخدمات' });
  return defs;
}

// ---- action timestamps (real log times; stable synthesized fallback for seed) ----
function stableHash(id: string): number {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) | 0;
  return Math.abs(h);
}
const REF_NOW = Date.parse('2026-07-02T09:30:00Z');
function itemTimes(i: Item): { submittedAt: number; approvedAt: number } {
  const log = i.log || [];
  const sub = log.find((e) => e.action === 'submit' || e.action === 'budget');
  const app = log.find((e) => e.action === 'approve');
  if (sub || app) return { submittedAt: sub?.at ?? app?.at ?? REF_NOW, approvedAt: app?.at ?? 0 };
  const h = stableHash(i.id);
  const submittedAt = REF_NOW - ((h % 6) + 2) * 86400000 - (h % 8) * 3600000 - (h % 13) * 60000;
  const approvedAt = submittedAt + 86400000 + (h % 6) * 3600000 + (h % 11) * 60000;
  return { submittedAt, approvedAt };
}
const AR_MONTHS_SHORT = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
function hhmm(ms: number): string {
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function fmtDateTime(ms: number): string {
  if (!ms) return '';
  return fmtDate(ms) + ' · ' + hhmm(ms);
}
function fmtStampShort(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  return d.getDate() + ' ' + AR_MONTHS_SHORT[d.getMonth()] + ' · ' + hhmm(ms);
}

type Ctx = { rawRole: RoleKey; role: RoleKey; myName: string; ent: (i: Item) => string };

function mkCard(i: Item, s: Store, ctx: Ctx) {
  const { rawRole, role, myName, ent } = ctx;
  const t = TYPE[i.type];
  const p = pathById(i.path);
  const wm = wfMeta(i);
  const appr = APPR[i.approval] || APPR['مسودة'];
  const prio = PRIO[i.priority || 'متوسطة'] || PRIO['متوسطة'];
  const w = wfOf(i);
  const score = transformScore(i);
  const step = stepIndexOf(i);
  const canApprove = rawRole === 'entity' && w === 'ent1';
  const isFunded = !!i.funded;
  // status chip mirrors the real lifecycle exactly:
  // مسودة → بحاجة إلى تعديل → بانتظار اعتماد ممثل الجهة → مخطط · المرحلة N → مكتمل
  const isReturned = !!i.ret;
  const batchShort = (i.execBatch || '').replace('إطلاق ', '');
  let wfLabel = wm.label;
  let wfChip = wm.chip;
  let wfBg = wm.bg;
  if (isReturned) {
    wfLabel = RETURNED_STATUS;
    wfChip = '#B45309';
    wfBg = '#FFF3DE';
  } else if (w === 'exec' || w === 'launch') {
    wfLabel = batchShort ? 'مخطط · ' + batchShort : 'معتمد';
    wfChip = '#2563EB';
    wfBg = '#EAF0FE';
  }
  const showSelectCheck =
    ['exec', 'launch', 'done'].includes(w) && ((rawRole === 'ai' && !i.funded) || (rawRole === 'path' && !i.nom && !i.funded));
  // every card shows an execution batch + (optional) launch plan
  const msNames = execMilestones();
  // only show the real batch — no synthetic fallback
  const batchLabel = i.execBatch || '';
  const named = (i.launches || []).filter((l) => (l.title || '').trim());
  const launchLabel = named.length
    ? named[0].title + (named.length > 1 ? ' (+' + (named.length - 1) + ')' : '')
    : '';

  return {
    id: i.id,
    title: i.title,
    desc: i.desc,
    typeLabel: t.label,
    typeColor: t.color,
    typeBg: t.bg,
    pathName: p.name,
    pathColor: p.color,
    approval: i.approval,
    apprBg: appr.bg,
    apprColor: appr.c,
    wfLabel,
    wfChip,
    wfBg,
    isReturned: rawRole === 'coord' && !!i.ret,
    retBannerLabel: 'ملاحظات ممثل الجهة',
    retNote: i.ret ? i.ret.note || (i.ret.type === 'info' ? 'طُلبت معلومات إضافية' : 'تمت الإعادة للتعديل') : '',
    retFrom: i.ret?.from || '',
    stepBadge: 'المرحلة ' + step,
    priority: i.priority,
    prioBg: prio.bg,
    prioColor: prio.c,
    complexity: i.complexity,
    impact: i.impact,
    progress: i.progress || 0,
    endDateFmt: fmtDate(i.endDate),
    isOp: i.type === 'operation',
    transformability: i.transformability,
    automationTxt: 'أتمتة ' + (i.automationPct || 0) + '%',
    canApprove,
    menuOpen: s.ui.menuOpenId === i.id,
    entityName: ent(i),
    showEntity: rawRole === 'ai',
    footLabel: rawRole === 'ai' ? ent(i) : p.name,
    scoreV: score.v,
    scoreLabel: score.ar,
    scoreColor: score.color,
    scoreExpl: score.expl,
    showPathCta: rawRole === 'coord' && ['draft', 'exec', 'launch'].includes(w),
    pathCtaLabel: pathCta(w, !!i.ret),
    // basket flags — nomination is visible only to the committee (to act) and
    // the stream rep (their own); coord/entity never see a pending nomination,
    // only the committee's funding decision.
    isNominated: !!i.nom && !i.funded && (rawRole === 'ai' || rawRole === 'path'),
    canWithdrawNom: rawRole === 'path' && !!i.nom && !i.funded && i.nom?.by === myName,
    isFunded,
    isFundedCommittee: rawRole === 'ai' && isFunded,
    isFundedOther: rawRole !== 'ai' && isFunded,
    canDeclineNom: rawRole === 'ai' && !!i.nom && !i.funded && !i.nom?.direct,
    showSelectCheck,
    fundChecked: s.ui.fundSel.includes(i.id),
    fundCheckBorder: s.ui.fundSel.includes(i.id) ? '#2563EB' : '#C7D1E2',
    fundCheckBg: s.ui.fundSel.includes(i.id) ? '#2563EB' : '#fff',
    // execution batch + launch plan meta (shown on every card)
    batchLabel,
    launchLabel,
    // coordinator bulk-assign checkbox
    showAssignCheck: rawRole === 'coord',
    assignChecked: s.ui.assignSel.includes(i.id),
    onToggleAssignSel: () => s.toggleAssignSel(i.id),
    nomBy: i.nom?.by || '',
    nomStream: i.nom ? pathById(i.nom.path || i.path).name : '',
    // path rep views its own nomination → drop the (redundant) name/stream
    nomLabel:
      rawRole === 'path'
        ? 'مُرشّح للتمويل'
        : 'مُرشّح · ' + (i.nom?.by || '') + ' · ' + (i.nom ? pathById(i.nom.path || i.path).name : ''),
    // time of the last status change (shown next to the status chip)
    statusStamp:
      w === 'ent1'
        ? fmtStampShort(itemTimes(i).submittedAt)
        : ['exec', 'launch', 'done'].includes(w)
          ? fmtStampShort(itemTimes(i).approvedAt)
          : '',
    // handlers
    onOpen: () => s.openDetail(i.id),
    onApprove: () => s.approveItem(i.id),
    onMenu: () => s.toggleMenu(i.id),
    canDelete: rawRole === 'coord' && ((w === 'draft' && !i.ret) || w === 'ent1'),
    onDelete: () => s.deleteItem(i.id),
    onReqInfo: () => s.reqInfoItem(i.id),
    onReject: () => s.rejectItem(i.id),
    onPathCta: () => s.openDetail(i.id),
    onToggleFundSel: () => s.toggleFundSel(i.id),
    onWithdrawNom: () => s.withdrawNom(i.id),
    onDeclineNom: () => s.declineNom(i.id),
    onCancelFund: () => s.openCancelFund(i.id),
  };
}

function pathCta(w: string, ret: boolean): string {
  if (w === 'draft') return ret ? 'تعديل وإعادة الإرسال' : 'إكمال وإرسال';
  if (w === 'exec') return 'تحديث حالة التنفيذ';
  return 'تحديث خطة الإطلاق';
}

function buildProgramSteps(s: Store, base: Item[]) {
  const rawRole = s.role;
  const twoStep = rawRole === 'ai' || rawRole === 'path';
  const phases = twoStep ? TWO_STEP_PHASES : s.programPhases;
  const cur = twoStep ? (s.programStep >= 3 ? 2 : 1) : s.programStep || 1;
  const respFor = (num: number): string => {
    // two-step stepper (ai / path): the committee interfaces with the entity
    // rep for both approval and execution, so both steps show ممثل الجهة.
    if (twoStep) return 'ممثل الجهة';
    return ({ 1: 'منسق المسار في الجهة', 2: 'ممثل الجهة', 3: 'منسق المسار في الجهة' } as Record<number, string>)[num] || '';
  };
  const fnum = (num: number) => (twoStep ? (num === 2 ? 3 : 1) : num);
  const countFor = (num: number): number => {
    if (twoStep) return base.filter((i) => (num === 2 ? stepIndexOf(i) >= 3 : stepIndexOf(i) < 3)).length;
    return base.filter((i) => stepIndexOf(i) === num).length;
  };
  return phases.map((ph, idx) => {
    const num = idx + 1;
    const state = num < cur ? 'done' : num === cur ? 'active' : 'todo';
    return {
      num: String(num),
      label: ph.n,
      resp: respFor(num),
      stepCount: countFor(num),
      state,
      isDone: state === 'done',
      statusLabel: state === 'done' ? 'مكتملة' : state === 'active' ? 'جارية الآن' : 'قادمة',
      deadlineFmt: fmtDate(ph.deadline),
      onStepFilter: () => s.toggleStepFilter(fnum(num)),
      active: s.ui.stepFilter === fnum(num),
    };
  });
}

function buildNotifs(s: Store, base: Item[], ctx: Ctx) {
  const { rawRole, role, myName, ent } = ctx;
  const rows: {
    id: string;
    kind: string;
    iconBg: string;
    iconColor: string;
    icon: string;
    title: string;
    sub: string;
    act?: boolean;
    onOpen: () => void;
  }[] = [];
  const push = (id: string, kind: string, icon: string, title: string, sub: string, itemId?: string, act?: boolean) => {
    const k = NK[kind] || NK.info;
    rows.push({ id, kind, iconBg: k.bg, iconColor: k.c, icon: NIC[icon], title, sub, act, onOpen: () => (itemId ? s.openNotifItem(itemId) : s.toggleNotifs()) });
  };
  const dleft = daysLeft(s.phase.deadline);
  push(
    'deadline',
    dleft <= 7 ? 'warn' : 'info',
    'clock',
    dleft <= 7 ? 'تبقّى ' + dleft + ' يوم فقط على مهلة المرحلة' : 'المهلة النهائية للمرحلة بعد ' + dleft + ' يوم',
    'المرحلة الأولى — تسجيل وتجميع البيانات · ' + fmtDate(s.phase.deadline)
  );
  base.forEach((i) => {
    const w = wfOf(i);
    const tl = typeLabel(i.type);
    if (rawRole === 'ai') {
      if (i.nom && !i.funded) push('n-' + i.id, 'info', 'inbox', 'ترشيح جديد في السلة من ' + (i.nom.by || ''), tl + ' · ' + i.title + ' · ' + ent(i), i.id);
    } else if (rawRole === 'entity') {
      if (w === 'ent1') push('ent1-' + i.id, 'info', 'send', 'عنصر بانتظار اعتماد ممثل الجهة', tl + ' · ' + i.title + ' · ' + pathById(i.path).name, i.id, true);
      if (w === 'ent2') push('ent2-' + i.id, 'info', 'wallet', 'ميزانية ونطاق عمل بانتظار اعتماد ممثل الجهة', tl + ' · ' + i.title + ' · ' + pathById(i.path).name, i.id, true);
      if (i.funded && ent(i) === s.entityName) push('f-' + i.id, 'ok', 'wallet', 'ستتكفّل اللجنة الوطنية بتكلفة تحويل هذا العنصر', tl + ' · ' + i.title + ' · يبقى التنفيذ من مسؤولية الجهة', i.id);
      if (i.fundCancel && !i.funded && ent(i) === s.entityName) push('fc-' + i.id, 'alert', 'wallet', 'أُلغي تمويل اللجنة الوطنية لهذا العنصر', tl + ' · ' + i.title + ' · السبب: ' + i.fundCancel.reason, i.id);
    } else {
      if (i.funded && i.nom && i.nom.by === myName) push('mf-' + i.id, 'ok', 'wallet', 'اعتمدت اللجنة الوطنية تمويل ترشيحك', tl + ' · ' + i.title, i.id);
      if (i.fyi) push('fy-' + i.id, 'info', 'inbox', 'للعلم: عُدّل العنصر من ممثل الجهة وأُحيل لاعتماد اللجنة الوطنية', tl + ' · ' + i.title, i.id);
      if (i.ret) push('r-' + i.id, 'alert', 'rotate', (i.ret.type === 'info' ? 'طلب معلومات إضافية من ' : 'تمت إعادة العنصر من ') + (i.ret.from || ''), tl + ' · ' + i.title + (i.ret.note ? ' · ' + i.ret.note : ''), i.id);
      if (w === 'budget' && !i.ret) push('bud-' + i.id, 'info', 'wallet', 'اعتُمدت الأولوية — أدخل الميزانية ونطاق العمل', tl + ' · ' + i.title, i.id);
      if (w === 'exec') push('x-' + i.id, 'ok', 'check', 'العنصر في مرحلة التنفيذ — حدّث الحالة', tl + ' · ' + i.title, i.id);
      if (w === 'launch') push('l-' + i.id, 'info', 'send', 'العنصر في مرحلة الإطلاق — أكمل خطة الإطلاق', tl + ' · ' + i.title, i.id);
    }
  });
  const readSet = new Set(s.readNotifs);
  const itemIdFromNotif = (id: string) => id.slice(id.indexOf('-') + 1);
  return rows.map((r) => {
    const iid = itemIdFromNotif(r.id);
    return {
      ...r,
      unread: !readSet.has(r.id),
      onApprove: () => s.approveItem(iid),
      onReject: () => s.rejectItem(iid),
      onReqInfo: () => s.reqInfoItem(iid),
    };
  });
}

function buildBasket(s: Store, ctx: { rawRole: RoleKey; myName: string; ent: (i: Item) => string }) {
  const { rawRole, myName, ent } = ctx;
  const isCom = rawRole === 'ai';
  const selSrc = isCom
    ? s.items.filter((i) => i.nom && !i.funded)
    : s.items.filter((i) => i.nom && !i.funded && i.nom.by === myName);
  const appSrc = isCom
    ? s.items.filter((i) => i.funded)
    : s.items.filter((i) => i.funded && i.nom && i.nom.by === myName);
  const mk = (i: Item) => {
    const score = transformScore(i);
    // funding-source line for approved rows
    const fundedText = i.funded?.direct
      ? 'اعتُمد مباشرة من اللجنة الوطنية'
      : 'بترشيح من ' + (i.nom?.by || 'رئيس المسار') + ' · ' + pathById(i.path).name;
    return {
      id: i.id,
      title: i.title,
      typeLabel: typeLabel(i.type),
      entity: ent(i),
      pathName: pathById(i.path).name,
      nomBy: i.nom?.by || '',
      fundedText,
      scoreV: score.v,
      scoreColor: score.color,
      onOpen: () => s.openDetail(i.id),
      onApprove: () => s.fundItem(i.id, false),
      onDecline: () => s.declineNom(i.id),
      onWithdraw: () => s.withdrawNom(i.id),
    };
  };
  // total approved-funding cost (parse the free-text budget strings)
  const parseBudget = (b?: string) => {
    const n = parseInt((b || '').replace(/[^\d]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  };
  // own budgets + each shared launch plan's group budget counted once
  const fundedTotal = appSrc.reduce((a, i) => a + parseBudget(i.budget), 0);
  const fundedTotalLabel = fundedTotal.toLocaleString('en-US') + ' درهم';
  return {
    isCommittee: isCom,
    title: isCom ? 'سلة اللجنة الوطنية' : 'سلة الترشيحات',
    subtitle: isCom
      ? 'العناصر المرشّحة من رؤساء المسارات والعناصر المموّلة'
      : 'العناصر التي رشّحتها لتمويل اللجنة الوطنية',
    selTabLabel: isCom ? 'العناصر المرشّحة' : 'ترشيحاتي',
    appTabLabel: 'العناصر المعتمدة',
    tab: s.ui.basketTab,
    selItems: selSrc.map(mk),
    appItems: appSrc.map(mk),
    selCount: selSrc.length,
    appCount: appSrc.length,
    pendingCount: selSrc.length,
    fundedTotal,
    fundedTotalLabel,
  };
}

function buildDetail(s: Store, id: string, ctx: { rawRole: RoleKey; role: RoleKey; ent: (i: Item) => string }) {
  const { rawRole } = ctx;
  const i = s.items.find((x) => x.id === id);
  if (!i) return null;
  const t = TYPE[i.type];
  const wm = wfMeta(i);
  const w = wfOf(i);
  const step = wm.step;
  const score = transformScore(i);
  const canApproveGate = rawRole === 'entity' && w === 'ent1';
  // detail view is VIEW-ONLY for item data; scope/budget are never edited here
  const canEditScope = false;
  // group-level cost carried by the item's launch plan
  const planCost = (i.launchPlanIds || [])
    .map((pid) => s.launchPlans.find((p) => p.id === pid))
    .find((p) => p && ((p.budget || '').trim() || (p.scope || '').trim()));
  const isDraftForCoord = rawRole === 'coord' && w === 'draft';
  // ---- footer / menu gating (mirrors the design's derived flags) ----
  const vStep = Math.min(s.ui.dViewStep || step, step);
  const canApproveGateView = canApproveGate && vStep === step;
  const onApprovalStep = vStep === 2;
  const editLocked = step >= 3;
  const execEditable = rawRole === 'coord' && w === 'exec';
  const launchEditable = rawRole === 'coord' && w === 'launch';
  const fillActive = canEditScope || execEditable || launchEditable;
  // the "تعديل البيانات" menu item hides once approval/tracking has begun
  const showMenuEdit = !onApprovalStep && !editLocked;
  // fallback edit button: shown when there's no gate action and editing isn't
  // locked — but the read-only path role never gets an edit button
  const canEdit = !canApproveGateView && !onApprovalStep && !editLocked && !fillActive && rawRole !== 'path';
  const twoStep = rawRole === 'ai' || rawRole === 'path';
  const cur = twoStep ? (step >= 3 ? 2 : 1) : step;
  const stepLabels = twoStep
    ? [{ n: 'اعتماد اختيار أولويات التحول الذكي' }, { n: 'تنفيذ واختبار التحول والإطلاق' }]
    : DEFAULT_PROGRAM_PHASES.map((p) => ({ n: p.n }));
  const dSteps = stepLabels.map((sl, idx) => {
    const num = idx + 1;
    const st = num < cur ? 'done' : num === cur ? 'active' : 'todo';
    return { num: String(num), label: sl.n, isDone: st === 'done', state: st };
  });

  const execRows = (i.execChecklist || []).map((x) => ({
    key: x.key,
    label: x.label,
    status: x.status,
    isDelayed: x.status === 'متأخر',
    newDate: x.newDate || '',
    newDateFmt: fmtDate(x.newDate),
    reason: x.reason || '',
    onStatus: (v: string) => s.setExecItem(i.id, x.key, { status: v }),
    onNewDate: (v: string) => s.setExecItem(i.id, x.key, { newDate: v }),
    onReason: (v: string) => s.setExecItem(i.id, x.key, { reason: v }),
  }));
  const launchChk = (i.launches || []).map((l, idx) => ({
    idx,
    title: l.title,
    ltype: l.ltype,
    dateFmt: fmtDate(l.date),
    done: !!l.done,
    actualFmt: fmtDate(l.doneAt),
    onToggle: () => s.toggleLaunchDone(i.id, idx),
  }));

  return {
    id: i.id,
    item: i,
    title: i.title,
    desc: i.desc,
    typeLabel: t.label,
    typeColor: t.color,
    typeBg: t.bg,
    wfLabel: wm.label,
    wfChip: wm.chip,
    wfBg: wm.bg,
    priority: i.priority,
    complexity: i.complexity,
    endDateFmt: fmtDate(i.endDate),
    isReturned: rawRole === 'coord' && !!i.ret,
    retBannerLabel: 'ملاحظات ممثل الجهة',
    retFrom: i.ret?.from || '',
    retNote: i.ret?.note || '',
    // funded banner (shown inside the detail body)
    dFunded: !!i.funded,
    dFundedText: i.funded
      ? (i.funded.direct
          ? 'مموّل مباشرة من اللجنة الوطنية'
          : 'مموّل من اللجنة الوطنية · بترشيح من ' + (i.nom?.by || 'رئيس المسار')) +
        ' · يبقى التنفيذ من مسؤولية الجهة'
      : '',
    isProj: i.type === 'project' || i.type === 'initiative',
    isOp: i.type === 'operation',
    isSvc: i.type === 'service',
    // project fields
    expectedOutputs: i.expectedOutputs,
    expectedOutcomes: i.expectedOutcomes,
    expectedImpact: i.expectedImpact,
    aiModels: i.aiModels,
    targetPct: i.targetPct,
    transformability: i.transformability,
    transformPriority: i.transformPriority,
    readiness: i.readiness,
    // op fields
    opType: i.opType,
    usageIntensity: i.usageIntensity,
    subActivities: i.subActivities,
    automationLevel: i.automationLevel,
    automationPct: i.automationPct,
    automationSystem: i.automationSystem,
    complexityLevel: i.complexityLevel,
    sector: i.sector,
    dept: i.dept,
    section: i.section,
    itemEntityName: entOf(i, s.entityName),
    // svc fields
    serviceOwner: i.serviceOwner,
    targetUsers: i.targetUsers,
    currentJourney: i.currentJourney,
    painPoints: i.painPoints,
    expectedImprovement: i.expectedImprovement,
    // score
    showReco: rawRole === 'ai',
    scoreV: score.v,
    scoreLabel: score.ar,
    scoreColor: score.color,
    scoreExpl: score.expl,
    // steps
    dSteps,
    // scope — falls back to the launch plan's group-level cost when the item
    // has none of its own (cost defined per launch, not per item)
    scopeOfWork: i.scopeOfWork || (planCost?.scope ? planCost.scope + ' (على مستوى خطة الإطلاق)' : ''),
    budget: i.budget || (planCost?.budget ? planCost.budget + ' (على مستوى خطة الإطلاق)' : ''),
    scopeApproval: i.scopeApproval,
    canEditScope,
    scopeReadOnly: !canEditScope && !!(i.scopeOfWork || i.budget || planCost?.budget || planCost?.scope),
    scopePendingInput: !canEditScope && !i.scopeOfWork && !i.budget && !planCost?.budget && !planCost?.scope,
    showBudgetSubmit: false, // scope is submitted via the wizard, not the detail
    hasScopeFile: !!i.scopeFile,
    scopeFile: i.scopeFile || '',
    scopeFileLabel: i.scopeFile ? 'المرفق: ' + i.scopeFile : 'اسحب الملف هنا أو اضغط للإرفاق',
    // exec / launch
    execRows,
    execEditable: rawRole === 'coord' && w === 'exec',
    // executed tasks stay visible (read-only) through launch and completion
    showExecView: ['exec', 'launch', 'done'].includes(w),
    showGoLaunch: rawRole === 'coord' && w === 'exec',
    execBlocked: !execAllDone(i),
    execOpacity: execAllDone(i) ? 1 : 0.55,
    launchChk,
    launchEditable: rawRole === 'coord' && w === 'launch',
    showLaunchView: ['launch', 'done'].includes(w),
    showFinishLaunch: rawRole === 'coord' && w === 'launch',
    hasLaunchChk: (i.launches || []).length > 0,
    // execution plan as entered by the coordinator (visible before approval)
    execBatchName: i.execBatch || '',
    execBatchPeriod:
      execMilestones().find((b) => b.name === i.execBatch)?.period || '',
    subMilestones: (i.phases || [])
      .filter((p) => !i.execBatch || p.name === i.execBatch)
      .flatMap((p) => p.subs || [])
      .filter((sub) => (sub.name || '').trim())
      .map((sub) => ({
        name: sub.name,
        startFmt: fmtDate(sub.start),
        endFmt: fmtDate(sub.end),
      })),
    // planned launch plan — read-only, shown in the pre-launch stages so the
    // approver sees everything before approving
    plannedLaunches: (i.launches || [])
      .filter((l) => (l.title || '').trim())
      .map((l) => ({
        title: l.title,
        ltype: l.ltype,
        dateFmt: fmtDate(l.date),
        desc: l.desc || '',
        shared: !!l.shared,
      })),
    // approval log
    logRows: buildLogRows(i),
    // gate actions
    canApproveGate,
    gateActor: w === 'ent1' ? 'ممثل الجهة' : 'اللجنة الوطنية',
    dActionMenuOpen: s.ui.dActionMenuOpen,
    canApproveGateView,
    canEdit,
    showMenuEdit,
    editLabel: isDraftForCoord ? 'متابعة وإكمال البيانات وإرسالها' : 'تعديل',
    // handlers
    onClose: () => s.closeDetail(),
    onApprove: () => s.approveItem(i.id),
    onReqInfo: () => s.reqInfoItem(i.id),
    onReject: () => s.rejectItem(i.id),
    onEdit: () => s.editItem(i.id),
    onToggleMenu: () => s.toggleDActionMenu(),
    onScopeWork: (v: string) => s.detailField(i.id, 'scopeOfWork', v),
    onBudget: (v: string) => s.detailField(i.id, 'budget', v),
    onSubmitScope: () => s.submitScope(i.id),
    onDownloadScope: () => s.toast('جاري تحميل المرفق…'),
    onGoLaunch: () => s.goToLaunch(i.id),
    onFinishLaunch: () => s.finishLaunch(i.id),
  };
}

function buildLogRows(i: Item) {
  // Displayed action text (mirrors the design's actLabel()).
  const actLabel = (e: { action: string; role?: string }): string => {
    if (e.action === 'submit') return 'تم الإرسال للاعتماد';
    if (e.action === 'approve') return 'تم الاعتماد من ' + (e.role || '');
    if (e.action === 'pending') return 'قيد الاعتماد لدى ' + (e.role || '');
    if (e.action === 'reject') return 'رفض العنصر';
    if (e.action === 'info') return 'طلب معلومات إضافية';
    // fund / nominate / unfund / declineNom / cancelFund / budget … → Arabic
    return ALOG[e.action]?.t || e.action;
  };
  // newest action first (latest entry at the top of the log)
  const rawLog = i.log && i.log.length ? [...i.log].reverse() : [];
  const rows = rawLog.map((e) => {
    const a = ALOG[e.action] || { t: e.action, c: '#64748B' };
    const dt = new Date(e.at);
    const when = isNaN(dt.getTime())
      ? ''
      : fmtDate(e.at) + ' · ' + String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
    const namedInLabel = e.action === 'approve' || e.action === 'pending';
    const sub = namedInLabel ? when : (e.by ? e.by + ' · ' : '') + when;
    return { action: actLabel(e), color: a.c, sub, note: e.note || '', hasNote: !!e.note };
  });
  // synthesize minimal history when no real log rows exist — with timestamps
  if (!rows.length) {
    const t = itemTimes(i);
    const w = wfOf(i);
    // newest first: approval/pending above submission
    if (['exec', 'launch', 'done'].includes(w))
      rows.push({ action: actLabel({ action: 'approve', role: 'ممثل الجهة' }), color: ALOG.approve.c, sub: fmtDateTime(t.approvedAt), note: '', hasNote: false });
    else if (w === 'ent1')
      rows.push({ action: actLabel({ action: 'pending', role: 'ممثل الجهة' }), color: ALOG.pending.c, sub: fmtDateTime(t.submittedAt), note: '', hasNote: false });
    rows.push({ action: actLabel({ action: 'submit' }), color: ALOG.submit.c, sub: 'منسق المسار في الجهة · ' + fmtDateTime(t.submittedAt), note: '', hasNote: false });
  }
  return rows;
}

function buildModal(s: Store) {
  const ui = s.ui;
  const draft = ui.draft;
  const type = draft?.type || 'project';
  const mTypeLabel = typeLabel(type);
  const path = draft?.path || s.myPath;
  // path name is only shown once a path has actually been chosen for the draft
  const mPathName = draft?.path ? pathById(draft.path).name : '';
  // per-type step 1 / step 2 titles (verbatim from design)
  const step1Title =
    ({ project: 'بيانات المشروع', initiative: 'بيانات المبادرة', operation: 'بيانات العملية', service: 'بيانات الخدمة' } as Record<string, string>)[type] ||
    'البيانات العامة';
  const step2Title =
    ({ project: 'تقييم المشروع', initiative: 'تقييم المبادرة', operation: 'تقييم العملية', service: 'تقييم الخدمة' } as Record<string, string>)[type] ||
    'التقييم والأولوية';
  // per-type stepper labels (fallback to generic when no type yet)
  const step1Label =
    ({ project: 'بيانات المشروع', initiative: 'بيانات المبادرة', operation: 'بيانات العملية', service: 'بيانات الخدمة' } as Record<string, string>)[type] ||
    'البيانات';
  const step2Label =
    ({ project: 'تقييم المشروع', initiative: 'تقييم المبادرة', operation: 'تقييم العملية', service: 'تقييم الخدمة' } as Record<string, string>)[type] ||
    'التقييم';
  const fLabels = [step1Label, step2Label, 'النتائج المتوقعة', 'نطاق العمل والميزانية', 'خطة التنفيذ والإطلاق'];
  const fTitles = [step1Title, step2Title, 'النتائج المتوقعة', 'نطاق العمل والميزانية', 'خطة التنفيذ والإطلاق'];
  const fHints = [
    'ابدأ بالمعلومات الأساسية للعنصر',
    'حدّد الأولوية وقابلية التحول',
    'النتائج والأثر المستهدف',
    'نطاق العمل والميزانية والمرفقات',
    'اختر مرحلة التنفيذ والإطلاق',
  ];
  return {
    mStep: ui.mStep,
    createTitle: ui.editingId ? 'تعديل عنصر' : mPathName ? 'إضافة في مسار ' + mPathName : 'إضافة عنصر جديد',
    mPathName,
    rankBtnLabel: draft?.rank ? 'الأولوية رقم ' + draft.rank : 'اضغط لترتيب الأولوية بالسحب والإفلات',
    // path step
    pathCards: availTypesCards(s),
    // type step
    typeCards: availTypes(path).map((t) => ({
      key: t.key,
      label: t.label,
      onClick: () => s.mSetType(t.key),
    })),
    // form
    draft,
    fStep: ui.fStep,
    mIsOp: type === 'operation',
    mIsService: type === 'service',
    mIsProjectish: type === 'project' || type === 'initiative',
    mTypeLabel,
    fLabels,
    fHints,
    fStepTitle: fTitles[ui.fStep - 1] || '',
    fStepHint: fHints[ui.fStep - 1] || '',
    fNextLabel: ui.fStep >= 5 ? 'إرسال للاعتماد' : 'التالي',
    // execution batches (خطة التنفيذ والإطلاق) + centrally-managed launch plans
    batchOptions: launchBatches().map((b) => ({
      name: b.name,
      label: b.period ? b.name + ' · ' + b.period : b.name,
    })),
    startStates: START_STATES,
    // ai review
    aiLoading: ui.aiLoading,
    aiResult: ui.aiResult,
    aiReadyCount: ui.aiResult?.ready.length || 0,
    aiImproveCount: ui.aiResult?.improve.length || 0,
    aiNotesCount: ui.aiResult?.notes.length || 0,
    // bulk
    bulkTemplateTypes: availTypes(path),
    bulkRows: ui.bulkRows,
    bulkLoading: ui.bulkLoading,
    bulkLoaded: ui.bulkLoaded,
    bulkReadyCount: ui.bulkRows.filter((r) => r._v === 'جاهز').length,
    bulkReviewCount: ui.bulkRows.filter((r) => r._v === 'بحاجة إلى مراجعة').length,
    bulkErrorCount: ui.bulkRows.filter((r) => r._v === 'يوجد خطأ').length,
  };
}

function availTypesCards(s: Store) {
  return PATHS.map((p) => ({
    id: p.id,
    name: p.name,
    desc: p.desc,
    color: p.color,
    icon: PIC[p.id],
    onClick: () => s.mSetPath(p.id),
  }));
}
