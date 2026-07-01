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
  pathById,
  typeLabel,
  availTypes,
  wfOf,
  wfMeta,
  stepIndexOf,
  transformScore,
  entOf,
  fmtDate,
  daysLeft,
  countdown,
  execMilestones,
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

  // visibility of drafts / ent1
  let visible = base.slice();
  if (rawRole === 'ai' || rawRole === 'path') {
    visible = visible.filter((i) => {
      const w = wfOf(i);
      return w !== 'draft' && w !== 'ent1';
    });
  } else if (rawRole === 'entity') {
    visible = visible.filter((i) => wfOf(i) !== 'draft');
  }
  if (effActivePath !== 'all') visible = visible.filter((i) => i.path === effActivePath);
  if (ui.filter !== 'all') visible = visible.filter((i) => i.type === ui.filter);
  // status filter
  if (ui.statusFilter !== 'all') visible = visible.filter((i) => statusMatch(i, ui.statusFilter, rawRole, s));
  // entity filter (ai/path)
  if ((rawRole === 'ai' || rawRole === 'path') && ui.entFilter !== 'all')
    visible = visible.filter((i) => ent(i) === ui.entFilter);
  // step filter
  if (ui.stepFilter != null) visible = visible.filter((i) => stepIndexOf(i) === ui.stepFilter);

  // ---- KPI scope ----
  const scope = effActivePath === 'all' ? base : base.filter((i) => i.path === effActivePath);
  const cnt = (f: (i: Item) => boolean) => scope.filter(f).length;
  const kpis = {
    projects: cnt((i) => i.type === 'project'),
    initiatives: cnt((i) => i.type === 'initiative'),
    operations: cnt((i) => i.type === 'operation'),
    services: cnt((i) => i.type === 'service'),
  };

  // ---- role flags ----
  const isAiRole = rawRole === 'ai';
  const showRail = rawRole === 'entity';
  const showAddBtn = rawRole === 'coord';
  const showBasket = rawRole === 'ai' || role === 'path';
  const showEntFilter = rawRole === 'ai' || role === 'path';

  // ---- path rail ----
  const railPaths = PATHS.filter((p) => role !== 'path' || p.id === myPath);
  const pathRail = railPaths.map((p) => {
    const count = base.filter((i) => i.path === p.id).length;
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
  const totalCount = base.length;

  // ---- active path title + summary ----
  const activePathObj = effActivePath === 'all' ? null : pathById(effActivePath);
  let activePathName: string;
  if (role === 'path') activePathName = 'مسار ' + pathById(myPath).name;
  else if (isAiRole) activePathName = 'لوحة المتابعة — جميع الجهات';
  else if (activePathObj) activePathName = activePathObj.name;
  else activePathName = 'لوحة المتابعة';
  const streamSummary = summaryText(effActivePath);

  // ---- type filter tabs ----
  const tabs = tabDefs(effActivePath, scope);

  // status filter options
  const statusOptions = [
    { v: 'all', label: 'كل الحالات' },
    { v: 'mine', label: 'بحاجة لإجرائي' },
    { v: 'pending', label: 'بانتظار الاعتماد' },
    { v: 'exec', label: 'قيد التنفيذ' },
    { v: 'launch', label: 'قيد الإطلاق' },
    { v: 'done', label: 'مكتمل' },
    { v: 'draft', label: 'مسودة' },
  ];

  // path filter (ai only) + entity filter options
  const pathOptions = [{ v: 'all', label: 'كل المسارات' }, ...PATHS.map((p) => ({ v: p.id, label: p.name }))];
  const entValues = Array.from(new Set([...s.items.map((i) => ent(i)), entityName]));
  const entOptions = [{ v: 'all', label: 'كل الجهات' }, ...entValues.map((e) => ({ v: e, label: e }))];

  // ---- cards ----
  const cards = visible.map((i) => mkCard(i, s, { rawRole, role, myName, ent }));

  // ---- committee analytics ----
  const withScore = base.filter((i) => wfOf(i) !== 'draft');
  const scores = withScore.map((i) => transformScore(i).v);
  const sumV = scores.reduce((a, b) => a + b, 0);
  const n = scores.length || 1;
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

  // rep display
  const repName = s.setup.rep.name || 'ممثل الجهة';
  const repPos = s.setup.rep.position || '';
  const repInitials = repName.split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || 'م';

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
    repName,
    repPos,
    repInitials,
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
    // banner + steps
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
    kpis,
    showOpsKpi: effActivePath === 'all' || effActivePath === 'ops',
    showSvcKpi: effActivePath === 'all' || effActivePath === 'services',
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
    fundBarShow: (rawRole === 'ai' || role === 'path') && ui.fundSel.length > 0,
    fundSelCount: ui.fundSel.length,
    fundBarActionLabel: rawRole === 'ai' ? 'تمويل التحول' : 'ترشيح للتحول',
    // detail
    detail,
    detailOpen: !!ui.detailId,
    // create modal
    modal,
    modalOpen: ui.modalOpen,
    // team panel
    teamOpen: ui.teamOpen,
    tmRep: s.setup.rep,
    tmOwners: PATHS.map((p) => ({
      color: p.color,
      name: p.name,
      ownerName: s.setup.owners[p.id]?.self ? repName : s.setup.owners[p.id]?.name || 'غير محدد',
      ownerPos: s.setup.owners[p.id]?.self ? repPos : s.setup.owners[p.id]?.position || '',
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
  return w === f;
}

function summaryText(activePath: string): string {
  if (activePath === 'ops') return 'إجمالي المشاريع والمبادرات والعمليات';
  if (activePath === 'services') return 'إجمالي المشاريع والمبادرات والخدمات';
  if (activePath === 'all') return 'إجمالي المشاريع والمبادرات والعمليات والخدمات';
  return 'إجمالي المشاريع والمبادرات';
}

function tabDefs(activePath: string, scope: Item[]) {
  const defs: { key: string; label: string; optLabel: string }[] = [
    { key: 'all', label: 'كل الأنواع', optLabel: `الكل (${scope.length})` },
    { key: 'project', label: 'المشاريع', optLabel: `المشاريع (${scope.filter((i) => i.type === 'project').length})` },
    { key: 'initiative', label: 'المبادرات', optLabel: `المبادرات (${scope.filter((i) => i.type === 'initiative').length})` },
  ];
  if (activePath === 'all' || activePath === 'ops')
    defs.push({ key: 'operation', label: 'العمليات', optLabel: `العمليات (${scope.filter((i) => i.type === 'operation').length})` });
  if (activePath === 'all' || activePath === 'services')
    defs.push({ key: 'service', label: 'الخدمات', optLabel: `الخدمات (${scope.filter((i) => i.type === 'service').length})` });
  return defs;
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
  const showSelectCheck =
    ['exec', 'launch', 'done'].includes(w) && ((rawRole === 'ai' && !i.funded) || (role === 'path' && !i.nom && !i.funded));

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
    wfLabel: wm.label,
    wfChip: wm.chip,
    wfBg: wm.bg,
    isReturned: rawRole === 'coord' && !!i.ret,
    retNote: i.ret?.note || '',
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
    pathCtaLabel: pathCta(w),
    // basket flags
    isNominated: !!i.nom && !i.funded,
    canWithdrawNom: role === 'path' && !!i.nom && !i.funded && i.nom?.by === myName,
    isFunded,
    isFundedCommittee: rawRole === 'ai' && isFunded,
    isFundedOther: rawRole !== 'ai' && isFunded,
    canDeclineNom: rawRole === 'ai' && !!i.nom && !i.funded && !i.nom?.direct,
    showSelectCheck,
    fundChecked: s.ui.fundSel.includes(i.id),
    nomBy: i.nom?.by || '',
    // handlers
    onOpen: () => s.openDetail(i.id),
    onApprove: () => s.approveItem(i.id),
    onMenu: () => s.toggleMenu(i.id),
    onReqInfo: () => s.reqInfoItem(i.id),
    onReject: () => s.rejectItem(i.id),
    onPathCta: () => s.openDetail(i.id),
    onToggleFundSel: () => s.toggleFundSel(i.id),
    onWithdrawNom: () => s.withdrawNom(i.id),
    onDeclineNom: () => s.declineNom(i.id),
    onCancelFund: () => s.openCancelFund(i.id),
  };
}

function pathCta(w: string): string {
  if (w === 'draft') return 'إكمال البيانات وإرسال';
  if (w === 'exec') return 'تحديث حالة التنفيذ';
  if (w === 'launch') return 'إكمال خطة الإطلاق';
  return 'فتح التفاصيل';
}

function buildProgramSteps(s: Store, base: Item[]) {
  const rawRole = s.role;
  const twoStep = rawRole === 'ai' || rawRole === 'path';
  const phases = twoStep ? TWO_STEP_PHASES : s.programPhases;
  const cur = twoStep ? (s.programStep >= 3 ? 2 : 1) : s.programStep || 1;
  const respFor = (num: number): string => {
    if (twoStep) return num === 1 ? (rawRole === 'ai' ? 'اللجنة الوطنية' : 'ممثل المسار') : 'منسق المسار في الجهة';
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
      if (w === 'ent1') push('e-' + i.id, 'info', 'send', 'عنصر بانتظار اعتماد ممثل الجهة', tl + ' · ' + i.title + ' · ' + pathById(i.path).name, i.id, true);
      if (i.funded && ent(i) === s.entityName) push('f-' + i.id, 'ok', 'wallet', 'ستتكفّل اللجنة الوطنية بتكلفة تحويل هذا العنصر', tl + ' · ' + i.title + ' · يبقى التنفيذ من مسؤولية الجهة', i.id);
      if (i.fundCancel && !i.funded && ent(i) === s.entityName) push('fc-' + i.id, 'alert', 'wallet', 'أُلغي تمويل اللجنة الوطنية لهذا العنصر', tl + ' · ' + i.title + ' · السبب: ' + i.fundCancel.reason, i.id);
    } else {
      if (i.funded && i.nom && i.nom.by === myName) push('mf-' + i.id, 'ok', 'wallet', 'اعتمدت اللجنة الوطنية تمويل ترشيحك', tl + ' · ' + i.title, i.id);
      if (i.fyi) push('fy-' + i.id, 'info', 'inbox', 'للعلم: عُدّل العنصر من ممثل الجهة وأُحيل لاعتماد اللجنة الوطنية', tl + ' · ' + i.title, i.id);
      if (i.ret) push('r-' + i.id, 'alert', 'rotate', (i.ret.type === 'info' ? 'طلب معلومات إضافية من ' : 'تمت إعادة العنصر من ') + (i.ret.from || ''), tl + ' · ' + i.title + (i.ret.note ? ' · ' + i.ret.note : ''), i.id);
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
    return {
      id: i.id,
      title: i.title,
      typeLabel: typeLabel(i.type),
      entity: ent(i),
      pathName: pathById(i.path).name,
      nomBy: i.nom?.by || '',
      scoreV: score.v,
      scoreColor: score.color,
      onOpen: () => s.openDetail(i.id),
      onApprove: () => s.fundItem(i.id, false),
      onDecline: () => s.declineNom(i.id),
      onWithdraw: () => s.withdrawNom(i.id),
    };
  };
  return {
    isCommittee: isCom,
    title: isCom ? 'سلة اللجنة الوطنية' : 'سلة الترشيحات',
    subtitle: isCom
      ? 'العناصر المرشّحة من ممثلي المسارات والعناصر المموّلة'
      : 'العناصر التي رشّحتها لتمويل اللجنة الوطنية',
    selTabLabel: isCom ? 'العناصر المرشّحة' : 'ترشيحاتي',
    appTabLabel: 'العناصر المعتمدة',
    tab: s.ui.basketTab,
    selItems: selSrc.map(mk),
    appItems: appSrc.map(mk),
    selCount: selSrc.length,
    appCount: appSrc.length,
    pendingCount: selSrc.length,
  };
}

function buildDetail(s: Store, id: string, ctx: { rawRole: RoleKey; role: RoleKey; ent: (i: Item) => string }) {
  const { rawRole, role } = ctx;
  const i = s.items.find((x) => x.id === id);
  if (!i) return null;
  const t = TYPE[i.type];
  const wm = wfMeta(i);
  const w = wfOf(i);
  const step = wm.step;
  const score = transformScore(i);
  const canApproveGate = rawRole === 'entity' && w === 'ent1';
  const canEditScope = rawRole === 'coord' && w === 'draft';
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
    retFrom: i.ret?.from || '',
    retNote: i.ret?.note || '',
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
    // scope
    scopeOfWork: i.scopeOfWork || '',
    budget: i.budget || '',
    scopeApproval: i.scopeApproval,
    canEditScope,
    scopeReadOnly: !canEditScope && !!(i.scopeOfWork || i.budget),
    scopePendingInput: !canEditScope && !i.scopeOfWork && !i.budget,
    showBudgetSubmit: rawRole === 'coord' && w === 'draft',
    hasScopeFile: !!i.scopeFile,
    scopeFile: i.scopeFile || '',
    // exec / launch
    execRows,
    execEditable: rawRole === 'coord' && w === 'exec',
    showExecView: ['exec'].includes(w),
    showGoLaunch: rawRole === 'coord' && w === 'exec',
    launchChk,
    launchEditable: rawRole === 'coord' && w === 'launch',
    showLaunchView: ['launch', 'done'].includes(w),
    showFinishLaunch: rawRole === 'coord' && w === 'launch',
    hasLaunchChk: (i.launches || []).length > 0,
    // approval log
    logRows: buildLogRows(i),
    // gate actions
    canApproveGate,
    gateActor: w === 'ent1' ? 'ممثل الجهة' : 'اللجنة الوطنية',
    dActionMenuOpen: s.ui.dActionMenuOpen,
    canEdit: rawRole === 'ai' || rawRole === 'entity' || (rawRole === 'coord' && ['draft'].includes(w)),
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
    onGoLaunch: () => s.goToLaunch(i.id),
    onFinishLaunch: () => s.finishLaunch(i.id),
  };
}

function buildLogRows(i: Item) {
  const log = i.log && i.log.length ? i.log : [];
  if (log.length)
    return log.map((l) => ({
      action: l.action,
      by: l.by,
      role: l.role,
      sub: l.role + ' · ' + fmtDate(l.at),
      note: l.note || '',
      hasNote: !!l.note,
      color: '#2563EB',
    }));
  // synthesize minimal history
  const rows: { action: string; sub: string; note: string; hasNote: boolean; color: string }[] = [
    { action: 'أرسل العنصر للاعتماد', sub: 'منسق المسار في الجهة', note: '', hasNote: false, color: '#2563EB' },
  ];
  if (['exec', 'launch', 'done'].includes(wfOf(i)))
    rows.push({ action: 'اعتمد العنصر', sub: 'ممثل الجهة', note: '', hasNote: false, color: '#0B8A4B' });
  return rows;
}

function buildModal(s: Store) {
  const ui = s.ui;
  const draft = ui.draft;
  const type = draft?.type || 'project';
  const mTypeLabel = typeLabel(type);
  const path = draft?.path || s.myPath;
  const fLabels = ['بيانات', 'التصنيف والأولوية', 'النتائج المتوقعة', 'نطاق العمل والميزانية', 'خطة التنفيذ والإطلاق'];
  return {
    mStep: ui.mStep,
    createTitle: ui.editingId ? 'تعديل عنصر' : 'إضافة عنصر جديد',
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
    fNextLabel: ui.fStep >= 5 ? 'مراجعة ذكية' : 'التالي',
    // ai review
    aiLoading: ui.aiLoading,
    aiResult: ui.aiResult,
    aiReadyCount: ui.aiResult?.ready.length || 0,
    aiImproveCount: ui.aiResult?.improve.length || 0,
    aiNotesCount: ui.aiResult?.notes.length || 0,
    // bulk
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
