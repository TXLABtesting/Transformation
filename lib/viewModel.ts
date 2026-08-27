'use client';
// ============================================================================
// View-model — port of renderVals(). Reads the store and produces the derived
// object the components render from (mirrors the prototype's `{{ }}` holes).
// ============================================================================
import { useMemo } from 'react';
import { useStore, logicRole, actorName } from './store';
import { SUPPORT_FUNCTIONS, SUPPORT_OPTYPE,
  missingFieldsOf,
  CONTACT_STREAMS,
  PATHS,
  ROLE,
  ROLE_PILLS,
  ROLE_INFO,
  TYPE,
  APPR,
  PRIO,
  PIC,
  NK,
  NIC,
  ALOG,
  pathById,
  typeLabel,
  typeLabelDef,
  typeLabelFor,
  typeLabelDefFor,
  svcPriority,
  stgPriority,
  STRATEGY_AXES,
  availTypes,
  wfOf,
  wfMeta,
  stepIndexOf,
  transformScore,
  stageWeight,
  isEntityApproved,
  isProjInit,
  streamHasType,
  TBD_BATCH,
  execAllDone,
  parseBudget,
  formatMoney,
  APPROVED_BUDGET,
  RETURNED_STATUS,
  REJECTED_STATUS,
  migrateRole,
  placementState,
  placementChip,
  placementLocked,
  isRejected,
  PATH_REPS,
  entOf,
  fmtDate,
  daysLeft,
  countdown,
  execMilestones,
  launchBatches,
  streamLaunchBatches,
  batchDafaaLabel,
  START_STATES,
  DEFAULT_PROGRAM_PHASES,
  TWO_STEP_PHASES,
  type Item,
  type RoleKey,
  itemActivities, activityBatch, activityTransformYes, type ActivityDetail, DEFAULT_ENTITY, isTeamUpload } from './domain';
import { stripHtml } from './richtext';
import { useMoca } from './mocaStore';
import { FEDERAL_ENTITIES } from './entities';
import { svcCatalogEntities } from './svcCatalog';

export function useViewModel() {
  const s = useStore();
  // subscribe to tick for countdown
  const tick = useStore((st) => st._tick);

  return useMemo(() => build(s), [s, tick]); // eslint-disable-line react-hooks/exhaustive-deps
}

export type VM = ReturnType<typeof build>;

type Store = ReturnType<typeof useStore.getState>;

function build(s: Store) {
  // the admin can flip into the monitoring dashboards: rendered with the
  // committee's all-seeing scope while a header button returns to the console
  const actualRole = s.role === 'admin' && s.ui.adminDash ? 'ai' : s.role;
  // الأدوار المحفوظة بالمسميات الملغاة تُرحَّل إلى أدوار البنية المعتمدة
  const rawRole: RoleKey = migrateRole(actualRole);
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
  // stream that scopes the FILTER BAR options: heads/coordinators are locked to
  // their own stream; entity rep + committee follow the streams select.
  const filterStream = role === 'path' ? myPath : ui.navStream || effActivePath;

  // visibility of drafts / ent1 — this is the role's whole universe: KPIs and
  // stats must count from it too, or numbers won't match the visible cards
  let roleBase = base;
  if (rawRole === 'ai') {
    // the committee (chair + secretariat) sees ONLY entries already approved
    // by the stream head / deputy
    roleBase = base.filter((i) => {
      const w = wfOf(i);
      return w !== 'draft' && w !== 'ent1';
    });
  } else if (rawRole === 'path') {
    // فريق عمل المسار يراجع مُرسَلات المنسقين، ويرى من المسودات فقط ما رفعه
    // هو بالنيابة عن الجهات (ولو ناقصاً) — مسودات المنسق الخاصة تبقى خاصة به
    roleBase = base.filter((i) => wfOf(i) !== 'draft' || isTeamUpload(i));
  } else if (rawRole === 'entity') {
    roleBase = base.filter((i) => wfOf(i) !== 'draft');
  }
  let visible = roleBase.slice();
  if (effActivePath !== 'all') visible = visible.filter((i) => i.path === effActivePath);
  // sidebar stream selection (entity rep / committee) narrows the list too
  if (ui.navStream) visible = visible.filter((i) => i.path === ui.navStream);
  // a type filter that the selected stream doesn't offer falls back to «all».
  // per-stream dropdowns use compound values: «op:<opType>» for an operation
  // sub-type, «bundle» for a service package, and «project»/«initiative» for
  // the two project sub-kinds. projinit/project/initiative are valid on every
  // stream; op-based and service-based values reset when the stream lacks them.
  const effTypeFilter = (() => {
    const tf = ui.filter;
    if (tf === 'all' || tf === 'projinit' || tf === 'project' || tf === 'initiative') return tf;
    if (filterStream === 'all') return tf;
    if (tf === 'operation' || tf.startsWith('op:')) return streamHasType(filterStream, 'operation') ? tf : 'all';
    if (tf === 'service' || tf === 'bundle') return streamHasType(filterStream, 'service') ? tf : 'all';
    return tf;
  })();
  if (effTypeFilter !== 'all')
    visible = visible.filter((i) => {
      if (effTypeFilter === 'projinit') return isProjInit(i.type);
      if (effTypeFilter.startsWith('op:')) return i.type === 'operation' && (i.opType || '') === effTypeFilter.slice(3);
      if (effTypeFilter === 'bundle') return i.type === 'service' && !!i.serviceBundle;
      return i.type === effTypeFilter;
    });
  // services-stream filters: الخدمة / الأولوية (القطاع filter removed)
  if (filterStream === 'services') {
    if (ui.svcServiceF !== 'all') visible = visible.filter((i) => (i.title || '') === ui.svcServiceF);
    if (ui.svcTransformF !== 'all')
      visible = visible.filter((i) => itemActivities(i).some((a) => activityTransformYes('services', a) === ui.svcTransformF));
    if (ui.svcPrioF !== 'all')
      // an entry matches if ANY of its sub-services carries that priority
      visible = visible.filter(
        (i) =>
          i.type === 'service' &&
          itemActivities(i).some((a) => String(svcPriority(a.usageIntensity, a.complexity, a.readinessLevel) ?? '') === ui.svcPrioF)
      );
  }
  // strategy-stream filters: المهمة / القطاع / الأولوية
  if (filterStream === 'strategy') {
    if (ui.stgAxisF !== 'all') visible = visible.filter((i) => (i.axis || '') === ui.stgAxisF);
    if (ui.stgTransformF !== 'all')
      visible = visible.filter((i) => itemActivities(i).some((a) => activityTransformYes('strategy', a) === ui.stgTransformF));
    if (ui.stgPrioF !== 'all')
      // an entry matches if ANY of its activities carries that priority
      visible = visible.filter((i) => itemActivities(i).some((a) => (stgPriority(a)?.cat || '') === ui.stgPrioF));
  }
  // operations-stream filters: تصنيف العملية / القطاع / نوع عملية الدعم
  if (filterStream === 'ops') {
    if (ui.opsCatF !== 'all') visible = visible.filter((i) => (i.opType || '') === ui.opsCatF);
    // قابلية التحول — matches when ANY نشاط carries that value
    if (ui.opsTransformF !== 'all')
      visible = visible.filter((i) => itemActivities(i).some((a) => activityTransformYes('ops', a) === ui.opsTransformF));
    if (ui.opsSupportF !== 'all') visible = visible.filter((i) => (i.supportFn || '') === ui.opsSupportF);
  }
  // status filter
  if (ui.statusFilter !== 'all') visible = visible.filter((i) => statusMatch(i, ui.statusFilter, rawRole, s));
  // committee-funding filter
  if (ui.fundFilter === 'funded') visible = visible.filter((i) => !!i.funded);
  else if (ui.fundFilter === 'notfunded') visible = visible.filter((i) => !i.funded);
  // free-text search over the title and description
  const q = (ui.search || '').trim();
  if (q) {
    const qq = q.toLowerCase();
    visible = visible.filter(
      (i) =>
        (i.title || '').toLowerCase().includes(qq) ||
        stripHtml(i.desc || '').toLowerCase().includes(qq)
    );
  }
  // entity filter (ai/path)
  if ((rawRole === 'ai' || rawRole === 'path') && ui.entFilter !== 'all')
    visible = visible.filter((i) => ent(i) === ui.entFilter);
  // step filter
  if (ui.stepFilter != null) visible = visible.filter((i) => stepIndexOf(i) === ui.stepFilter);
  // stage filter (المراحل) — including «للتحديد بعد الدراسة»
  if (ui.batchFilter) visible = visible.filter((i) => (i.execBatch || '') === ui.batchFilter);
  // stage order: المرحلة الأولى first, then الثانية … ; no stage / «للتحديد بعد الدراسة» last
  const msOrder = execMilestones().map((b) => b.name);
  const stageOrderOf = (i: Item) => {
    if (!i.execBatch || i.execBatch === TBD_BATCH) return msOrder.length;
    const idx = msOrder.indexOf(i.execBatch);
    return idx === -1 ? msOrder.length : idx;
  };
  visible.sort((a, b) => stageOrderOf(a) - stageOrderOf(b));

  // ---- KPI scope (counts what this role can actually see) ----
  const scope = filterStream === 'all' ? roleBase : roleBase.filter((i) => i.path === filterStream);
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

  // ---- per-type breakdown for the overview counts band ----
  // transformable follows each stream's matrix (ops provisional until approved)
  // per-نشاط model: an entry counts if ANY of its activities qualifies
  const isTransformableEntry = (i: Item): boolean => {
    const acts = itemActivities(i);
    if (i.type === 'service') {
      if (acts.length)
        return acts.some((a) => {
          const pr = svcPriority(a.usageIntensity, a.complexity, a.readinessLevel);
          return pr != null && pr <= 3;
        });
      const pr = svcPriority(i.usageIntensity, i.complexity, i.readinessLevel);
      return pr != null && pr <= 3;
    }
    if (i.path === 'strategy' && i.type === 'operation') {
      const cats = acts.length ? acts.map((a) => stgPriority(a)?.cat || '') : [stgPriority(i)?.cat || ''];
      return cats.some((cat) => cat === 'أولوية عالية' || cat === 'أولوية متوسطة');
    }
    if (i.path === 'ops' && i.type === 'operation') {
      if (acts.length) return acts.some((a) => (a.transformYes || '') === 'نعم');
      return (i.transformYes || '') === 'نعم';
    }
    return (i.transformability || '') !== 'غير قابل';
  };
  const isTargetedEntry = (i: Item): boolean => {
    const acts = itemActivities(i);
    if (acts.length) return acts.some((a) => activityTransformYes(i.path, a) === 'نعم');
    return (i.transformYes || '') === 'نعم';
  };
  const deliveryBreak = (pick: (i: Item) => boolean) => {
    const set = scope.filter(pick);
    return [
      { label: 'القابلة للتحول', v: set.filter(isTransformableEntry).length },
      { label: 'المستهدف تحويلها', v: set.filter(isTargetedEntry).length },
      { label: 'غير قابلة للتحويل', v: set.filter((i) => !isTransformableEntry(i)).length },
    ];
  };
  const kpiBreak = {
    total: deliveryBreak(() => true),
    projInit: deliveryBreak((i) => isProjInit(i.type)),
    operations: deliveryBreak((i) => i.type === 'operation'),
    services: deliveryBreak((i) => i.type === 'service'),
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

  // ---- entity overview cards (redesigned first + second sections) ----
  // Arabic dirham formatter for the dense per-stream cards
  const compactM = (n: number) => (n > 0 ? formatMoney(n) : '—');
  const grandBudget = execBudgetTotal + launchBudgetTotal;
  const eoExecPct = grandBudget ? Math.round((execBudgetTotal / grandBudget) * 100) : 0;
  const money = (n: number) => (n > 0 ? formatMoney(n) : '—');
  const costCard = {
    execLabel: money(execBudgetTotal),
    launchLabel: money(launchBudgetTotal),
    totalLabel: money(grandBudget),
    execPct: eoExecPct,
    launchPct: grandBudget ? 100 - eoExecPct : 0,
    execFrac: grandBudget ? Math.min(0.92, Math.max(0.08, execBudgetTotal / grandBudget)) : 0.67,
  };
  // the same numbers the stream dashboards show, aggregated at entry level
  const trN = roleBase.filter(isTransformableEntry).length;
  const inputsCard = {
    total: roleBase.length,
    transformable: trN,
    targeted: roleBase.filter(isTargetedEntry).length,
    notCapable: roleBase.length - trN,
    capFrac: roleBase.length ? Math.min(0.94, Math.max(0.06, trN / roleBase.length)) : 0.75,
  };
  // nominations summary (stream head view) — what I nominated and its status
  const nomFundedN = roleBase.filter((i) => !!i.funded).length;
  const nomPendingN = roleBase.filter((i) => !!i.nom && !i.funded).length;
  const nomCard = {
    total: roleBase.length,
    nominated: nomFundedN + nomPendingN,
    funded: nomFundedN,
    pending: nomPendingN,
    notNominated: Math.max(0, roleBase.length - nomFundedN - nomPendingN),
  };
  // per-stream cards (نظرة عامة حسب المسارات) — all five streams
  const streamOverviewCards = PATHS.map((p) => {
    const inStream = roleBase.filter((i) => i.path === p.id);
    const execCost = inStream.reduce((a, i) => a + parseBudget(i.budget), 0);
    // attribute each launch plan's launch budget to streams by its items' share
    let launchCost = 0;
    s.launchPlans.forEach((pl) => {
      const planItems = roleBase.filter((i) => (i.launchPlanIds || []).includes(pl.id));
      if (!planItems.length) return;
      const share = planItems.filter((i) => i.path === p.id).length / planItems.length;
      launchCost += parseBudget(pl.launchBudget) * share;
    });
    return {
      id: p.id,
      name: p.name,
      icon: PIC[p.id],
      total: inStream.length,
      stages: streamLaunchBatches(p.id).map((b) => ({
        label: batchDafaaLabel(b.name),
        n: inStream.filter((i) => i.execBatch === b.name).length,
      })),
      execLabel: compactM(execCost),
      launchLabel: compactM(launchCost),
      totalLabel: compactM(execCost + launchCost),
      onOpen: () => {
        s.setNavSection('all');
        s.setNavStream(p.id);
      },
    };
  });

  // per-TYPE cards (coordinator/stream-head view — التوزيع حسب نوع المدخل).
  // Scoped to the types the stream actually has: العمليات stream has no
  // services, so a coordinator there never sees «خدمة».
  const typeGroups = [
    ...(myPath !== 'services' && myPath !== 'strategy'
      ? [{ id: 'projinit', name: 'مشروع', icon: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7', section: 'projects', match: (i: Item) => isProjInit(i.type) }]
      : []),
    ...(streamHasType(myPath, 'operation')
      ? [{ id: 'operation', name: myPath === 'strategy' ? 'مهمة' : 'عملية', icon: 'M3 6h18M3 12h18M3 18h18', section: 'operations', match: (i: Item) => i.type === 'operation' }]
      : []),
    ...(streamHasType(myPath, 'service')
      ? [{ id: 'service', name: 'خدمة', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', section: 'services', match: (i: Item) => i.type === 'service' }]
      : []),
  ];
  // type keys available in the current stream (drives the type tabs/filters)
  const streamTypeKeys = ['projinit', ...typeGroups.filter((g) => g.id !== 'projinit').map((g) => g.id)];
  const typeOverviewCards = typeGroups.map((g) => {
    const inType = roleBase.filter(g.match);
    const execCost = inType.reduce((a, i) => a + parseBudget(i.budget), 0);
    let launchCost = 0;
    s.launchPlans.forEach((pl) => {
      const planItems = roleBase.filter((i) => (i.launchPlanIds || []).includes(pl.id));
      if (!planItems.length) return;
      const share = planItems.filter(g.match).length / planItems.length;
      launchCost += parseBudget(pl.launchBudget) * share;
    });
    return {
      id: g.id,
      name: g.name,
      icon: g.icon,
      total: inType.length,
      stages: streamLaunchBatches(myPath).map((b) => ({ label: batchDafaaLabel(b.name), n: inType.filter((i) => i.execBatch === b.name).length })),
      execLabel: compactM(execCost),
      launchLabel: compactM(launchCost),
      totalLabel: compactM(execCost + launchCost),
      onOpen: () => s.setNavSection(g.section),
    };
  });

  // stage distribution (coordinator — التوزيع حسب المرحلة) with per-type tabs
  const stageDistFor = (match: (i: Item) => boolean) => {
    const items = roleBase.filter(match);
    return {
      total: items.length,
      stages: streamLaunchBatches(myPath).map((b) => {
        const inStage = items.filter((i) => i.execBatch === b.name);
        return {
          label: b.name.replace(/^إطلاق /, ''),
          n: inStage.length,
          typeBreak: [
            { label: typeLabelFor('operation', myPath), n: inStage.filter((i) => i.type === 'operation').length },
            { label: 'خدمة', n: inStage.filter((i) => i.type === 'service').length },
          ],
          statusBreak: [
            { label: 'القابلة للتحول', n: inStage.filter(isTransformableEntry).length },
            { label: 'المستهدف تحويلها', n: inStage.filter(isTargetedEntry).length },
          ],
        };
      }),
    };
  };
  const stageDist = {
    all: stageDistFor(() => true),
    projinit: stageDistFor((i) => isProjInit(i.type)),
    operation: stageDistFor((i) => i.type === 'operation'),
    service: stageDistFor((i) => i.type === 'service'),
  };

  // committee per-stream cards (تفاصيل المسارات) — participation + type mix + cost
  const compactM0 = (n: number) => (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  const committeeStreamCards = PATHS.map((p) => {
    const inStream = roleBase.filter((i) => i.path === p.id);
    const execCost = inStream.reduce((a, i) => a + parseBudget(i.budget), 0);
    let launchCost = 0;
    s.launchPlans.forEach((pl) => {
      const planItems = roleBase.filter((i) => (i.launchPlanIds || []).includes(pl.id));
      if (!planItems.length) return;
      const share = planItems.filter((i) => i.path === p.id).length / planItems.length;
      launchCost += parseBudget(pl.launchBudget) * share;
    });
    const fundedCost = inStream.filter((i) => i.funded).reduce((a, i) => a + parseBudget(i.budget), 0);
    return {
      id: p.id,
      name: p.name,
      icon: PIC[p.id],
      entCount: new Set(inStream.map((i) => ent(i))).size,
      total: inStream.length,
      byType: [
        ...streamLaunchBatches(p.id).map((b) => ({
          label: b.name.replace(/^إطلاق /, ''),
          n: inStream.filter((i) => i.execBatch === b.name).length,
        })),
        { label: 'للتحديد بعد الدراسة', n: inStream.filter((i) => i.execBatch === TBD_BATCH).length },
      ],
      totalCostLabel: compactM0(execCost + launchCost),
      fundedLabel: compactM0(fundedCost),
      onOpen: () => {
        s.setNavSection('all');
        s.setNavStream(p.id);
      },
    };
  });

  // per-stream distribution shown INSIDE the type KPI cards (entity view) —
  // every eligible stream is listed, including zeros
  const kpiDist = {
    total: breakdown.map((r) => ({ label: r.name, value: r.total })),
    projInit: breakdown.map((r) => ({ label: r.name, value: r.projInit })),
    operations: breakdown
      .filter((r) => r.hasOps)
      .map((r) => ({ label: r.name, value: r.operations })),
    services: breakdown
      .filter((r) => r.hasSvc)
      .map((r) => ({ label: r.name, value: r.services })),
  };

  // ---- entity ranking (committee dashboard): submissions per entity ----
  const entCountMap = new Map<string, number>();
  roleBase.forEach((i) => entCountMap.set(ent(i), (entCountMap.get(ent(i)) || 0) + 1));
  const entityRank = [...entCountMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // ---- per-batch (مرحلة) summary: items + total execution cost ----
  // short stream names + chip colours for the stage-distribution cards
  // one consistent brand colour for all streams (no rainbow of dots)
  const STREAM_META: Record<string, { short: string; color: string }> = {
    ops: { short: 'العمليات والدعم المؤسسي', color: '#2563EB' },
    strategy: { short: 'العمل الحكومي الاستراتيجي', color: '#2563EB' },
    services: { short: 'الخدمات الحكومية', color: '#2563EB' },
    capacity: { short: 'بناء القدرات والتدريب', color: '#2563EB' },
    tech: { short: 'تقنيات الذكاء الاصطناعي والبيانات', color: '#2563EB' },
  };
  // مراحل التنفيذ / خطة الإطلاق title-row filters narrow the phase cards + their
  // contents. Role scope is already baked into roleBase; committee (ai)
  // filters by entity AND stream, stream-head (path) by entity only, entity
  // rep by stream only (their entity is fixed).
  let batchBase = roleBase;
  if ((rawRole === 'ai' || rawRole === 'path') && ui.execEnt !== 'all')
    batchBase = batchBase.filter((i) => ent(i) === ui.execEnt);
  if ((rawRole === 'ai' || rawRole === 'entity') && ui.execStream !== 'all')
    batchBase = batchBase.filter((i) => i.path === ui.execStream);
  const batchStreamScope =
    rawRole === 'coord' || rawRole === 'path'
      ? myPath
      : ui.execStream !== 'all'
        ? ui.execStream
        : null;
  const batchSummary = streamLaunchBatches(batchStreamScope).map((b) => {
    const inBatch = batchBase.filter((i) => i.execBatch === b.name);
    const cost = inBatch.reduce((a, i) => a + parseBudget(i.budget), 0);
    const launchTotal = s.launchPlans
      .filter((p) => p.batch === b.name)
      .reduce((a, p) => a + parseBudget(p.launchBudget), 0);
    return {
      name: b.name,
      displayName: b.name.replace(/^إطلاق /, ''),
      period: b.period || '',
      count: inBatch.length,
      opsCount: inBatch.filter((i) => i.type === 'operation').length,
      projCount: inBatch.filter((i) => isProjInit(i.type)).length,
      svcCount: inBatch.filter((i) => i.type === 'service').length,
      // drill-down into the portfolio pages filtered by this مرحلة
      composition: [
        { n: inBatch.filter((i) => isProjInit(i.type)).length, label: 'من المشاريع والمبادرات', section: 'projects' },
        { n: inBatch.filter((i) => i.type === 'operation').length, label: 'من العمليات', section: 'operations' },
        { n: inBatch.filter((i) => i.type === 'service').length, label: 'من الخدمات', section: 'services' },
      ]
        .filter((c) => c.n > 0)
        .map((c) => ({ ...c, onOpen: () => s.openBatchItems(b.name, c.section) })),
      onOpenAll: () => s.openBatchItems(b.name, 'all'),
      // stage-distribution breakdowns (entity rep view)
      typeBreak: [
        { label: 'الخدمات الحكومية', n: inBatch.filter((i) => i.type === 'service').length },
        { label: 'العمليات', n: inBatch.filter((i) => i.type === 'operation').length },
      ].filter((x) => x.n > 0),
      streamBreak: PATHS.map((p) => ({
        short: STREAM_META[p.id]?.short || p.name,
        name: p.name,
        color: STREAM_META[p.id]?.color || '#2563EB',
        n: inBatch.filter((i) => i.path === p.id).length,
      })).filter((x) => x.n > 0),
      costLabel: cost > 0 ? formatMoney(cost) : '—',
      launchCostLabel: launchTotal > 0 ? formatMoney(launchTotal) : '—',
      // delivery mapping: how far this مرحلة's assignments have progressed
      underDev: inBatch.filter((i) => devStatusOfItem(i) === 'underDev').length,
      developed: inBatch.filter((i) => devStatusOfItem(i) === 'developed').length,
      launched: inBatch.filter((i) => devStatusOfItem(i) === 'launched').length,
      awaiting: inBatch.filter((i) => devStatusOfItem(i) === null).length,
      // each launch in the مرحلة with its costs (entity rep + coordinator)
      launches: s.launchPlans
        .filter((p) => p.batch === b.name)
        .map((p) => {
          // scoped to the viewer: the launch's execution total is the sum of
          // the items THIS role can see, so it always matches the card totals
          const visItems = batchBase.filter((i) => (i.launchPlanIds || []).includes(p.id));
          const visCost = visItems.reduce((a, i) => a + parseBudget(i.budget), 0);
          // scope chips: which streams/entities this launch spans (role-scoped)
          const launchStreams = Array.from(new Set(visItems.map((i) => pathById(i.path).name)));
          const launchEntities = Array.from(new Set(visItems.map((i) => ent(i))));
          return {
            id: p.id,
            title: p.title || 'خطة إطلاق جديدة',
            streams: launchStreams,
            entities: launchEntities,
            execLabel: visCost > 0 ? formatMoney(visCost) : '—',
            launchLabel: parseBudget(p.launchBudget) > 0 ? formatMoney(parseBudget(p.launchBudget)) : '',
            // launch-plan (خطة الإطلاق) display fields
            budgetLabel: parseBudget(p.launchBudget) > 0 ? formatMoney(parseBudget(p.launchBudget)) : '—',
            count: visItems.length,
            // launch-together rule: the whole launch is launched only when every entry is
            launched: visItems.length > 0 && visItems.every((i) => devStatusOfItem(i) === 'launched'),
            items: visItems.map((i) => {
              const ds = devStatusOfItem(i);
              return {
                id: i.id,
                title: i.title,
                typeLabel: typeLabelFor(i.type, i.path),
                streamName: pathById(i.path).name,
                entityName: ent(i),
                budgetLabel: (i.budget || '').trim() || 'لم يتم تحديد الميزانية',
                launched: ds === 'launched',
                status: (ds === 'launched' ? 'done' : ds === 'developed' ? 'launch' : 'dev') as 'dev' | 'launch' | 'done',
                onOpen: () => s.openDetail(i.id),
              };
            }),
          };
        })
        .filter((l) => l.items.length > 0),
    };
  });

  // ---- role flags ----
  const isAiRole = rawRole === 'ai';
  const showRail = rawRole === 'entity';
  const showAddBtn = rawRole === 'coord';
  // فريق عمل المسار (أي مسار) يرفع ملفات الحصر بالنيابة عن الجهات
  const showTeamBulk = rawRole === 'path';
  // nomination/selection UI (basket, fund bar, card checkboxes) removed for the
  // stream heads and the committee — per requirement, they no longer nominate
  // or select in bulk
  const showBasket = false;
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
  const totalCount = ui.navStream
    ? roleBase.filter((i) => i.path === ui.navStream).length
    : effActivePath !== 'all'
      ? roleBase.filter((i) => i.path === effActivePath).length
      : roleBase.length;

  // ---- active path title + summary ----
  const activePathName: string =
    effActivePath === 'all'
      ? 'لوحة المتابعة'
      : (role === 'path' ? 'مسار ' : '') + pathById(effActivePath).name;
  const streamSummary = summaryText(effActivePath);
  // scope-aware type enumeration — replaces the generic word "عناصر"
  const typesPhrase =
    filterStream === 'all'
      ? 'المشاريع والمبادرات والعمليات والخدمات'
      : 'المشاريع والمبادرات' +
        (streamHasType(filterStream, 'operation') ? ' والعمليات' : '') +
        (streamHasType(filterStream, 'service') ? ' والخدمات' : '');

  // ---- empty-state copy: nothing entered yet (role-specific) vs filters ----
  const emptyDesc =
    scope.length === 0
      ? rawRole === 'entity'
        ? 'لم يتم إدخال أية بيانات أو معلومات حتى الآن.'
        : rawRole === 'ai' || rawRole === 'path'
          ? 'لم تقم الجهات بإضافة أي من ' + typesPhrase + ' حتى الآن.'
          : 'يمكنكم البدء بالإضافة من زر «إضافة جديدة» أو عبر رفع ملف خطة العمل.'
      : rawRole === 'coord'
        ? 'لا توجد نتائج مطابقة للمرشحات الحالية — يمكنكم تعديل المرشحات أو الإضافة من زر «إضافة جديدة».'
        : 'لا توجد نتائج مطابقة للمرشحات الحالية — يمكنكم تعديل المرشحات أو البحث.';

  // ---- type filter tabs ----
  const tabs = tabDefs(filterStream, scope);

  // status filter options — ai/path (oversight roles) drop the action/pending
  // options they can't act on
  const statusOptions =
    rawRole === 'coord'
      ? [
          { v: 'all', label: 'الحالة' },
          { v: 'draft', label: 'مسودة' },
          { v: 'pending', label: 'قيد الاعتماد' },
          { v: 'review', label: 'للتعديل' },
          { v: 'rejected', label: 'تم الرفض' },
          { v: 'inprog', label: 'معتمد' },
        ]
      : rawRole === 'entity'
        ? [
            { v: 'all', label: 'الحالة' },
            { v: 'approve', label: 'قيد الاعتماد' },
            { v: 'inprog', label: 'معتمد' },
          ]
        : rawRole === 'path'
        ? [
            { v: 'all', label: 'الحالة' },
            { v: 'draft', label: 'مسودة' },
            { v: 'approve', label: 'قيد الاعتماد' },
            { v: 'review', label: 'للتعديل' },
            { v: 'inprog', label: 'معتمد' },
          ]
        : [
            { v: 'all', label: 'الحالة' },
            { v: 'inprog', label: 'معتمد' },
          ];

  // committee-funding filter (entity rep)
  const fundOptions = [
    { v: 'all', label: 'حالة التمويل: الكل' },
    { v: 'funded', label: 'معتمد من اللجنة' },
    { v: 'notfunded', label: 'غير معتمد' },
  ];

  // stage filter (المراحل) — mirrors the full per-track timeline (8 phases;
  // AI track has 5 launch دفعات, other tracks 6) + «للتحديد بعد الدراسة»
  const batchFilterOptions = [
    { v: 'all', label: 'جميع المراحل' },
    ...streamLaunchBatches(filterStream === 'all' ? null : filterStream).map((b) => ({ v: b.name, label: b.name.replace(/^إطلاق /, '') })),
    { v: TBD_BATCH, label: TBD_BATCH },
  ];

  // path filter (ai only) + entity filter options
  const pathOptions = [{ v: 'all', label: 'جميع المسارات' }, ...PATHS.map((p) => ({ v: p.id, label: p.name }))];
  const entValues = Array.from(new Set([...s.items.map((i) => ent(i)), entityName]));
  // the filter-bar options follow the selected stream: only entities and input
  // types that actually exist in that stream are offered
  const entScope = filterStream === 'all' ? s.items : s.items.filter((i) => i.path === filterStream);
  const entFilterValues = filterStream === 'all' ? entValues : Array.from(new Set(entScope.map((i) => ent(i))));
  const entOptions = [{ v: 'all', label: 'جميع الجهات' }, ...entFilterValues.map((e) => ({ v: e, label: e }))];
  // per-stream type dropdowns (each keeps «جميع الأنواع» first). Streams that
  // define their own taxonomy override the generic list.
  const allTypesOpt = { v: 'all', label: 'نوع العملية' };
  const typeOptions =
    filterStream === 'ops'
      ? [
          allTypesOpt,
          { v: 'op:العمليات التخصصية', label: 'العمليات التخصصية' },
          { v: 'op:عمليات الدعم المؤسسي', label: 'عمليات الدعم المؤسسي' },
        ]
      : filterStream === 'strategy'
        ? [allTypesOpt, { v: 'initiative', label: 'المهام الاستراتيجية' }]
        : filterStream === 'services'
          ? [
              allTypesOpt,
              { v: 'service', label: 'الخدمات' },
              { v: 'bundle', label: 'باقات الخدمات' },
            ]
          : [
              allTypesOpt,
              ...(filterStream === 'all' || streamHasType(filterStream, 'operation') ? [{ v: 'operation', label: 'عملية' }] : []),
              ...(filterStream === 'all' || streamHasType(filterStream, 'service') ? [{ v: 'service', label: 'خدمة' }] : []),
            ];
  // services-stream filter bar (اسم الجهة يُعرض عبر فلتر الجهات الحالي)
  const svcScope = roleBase.filter((i) => i.path === 'services');
  const svcFilterBar =
    filterStream === 'services'
      ? {
          serviceOptions: [
            { v: 'all', label: 'الخدمة: الكل' },
            ...Array.from(new Set(svcScope.filter((i) => i.type === 'service').map((i) => i.title || ''))).filter(Boolean).map((t) => ({ v: t, label: t })),
          ],
          prioOptions: [
            { v: 'all', label: 'الأولوية: الكل' },
            { v: '1', label: 'الأولوية 1' },
            { v: '2', label: 'الأولوية 2' },
            { v: '3', label: 'الأولوية 3' },
            { v: '4', label: 'الأولوية 4' },
          ],
          serviceValue: ui.svcServiceF,
          // قابلية التحول — the derived نعم/لا of the entry's خدمات فرعية
          transformOptions: [
            { v: 'all', label: 'قابلية التحول: الكل' },
            { v: 'نعم', label: 'نعم' },
            { v: 'لا', label: 'لا' },
          ],
          transformValue: ui.svcTransformF,
          prioValue: ui.svcPrioF,
        }
      : null;

  // strategy-stream filter bar (اسم الجهة عبر فلتر الجهات الحالي)
  const stgScope = roleBase.filter((i) => i.path === 'strategy' && i.type === 'operation');
  // العمليات: same three-filter structure as the other streams, plus a
  // support-function filter that appears only for عمليات الدعم المؤسسي
  const opsScope = roleBase.filter((i) => i.path === 'ops');
  const opsFilterBar =
    filterStream === 'ops'
      ? {
          catOptions: [
            { v: 'all', label: 'تصنيف العملية: الكل' },
            { v: 'العمليات التخصصية', label: 'العمليات التخصصية' },
            { v: SUPPORT_OPTYPE, label: SUPPORT_OPTYPE },
          ],
          // قابلية التحول instead of القطاع (approved filter set)
          transformOptions: [
            { v: 'all', label: 'قابلية التحول: الكل' },
            { v: 'نعم', label: 'نعم' },
            { v: 'لا', label: 'لا' },
          ],
          supportOptions: [
            { v: 'all', label: 'نوع عملية الدعم: الكل' },
            ...SUPPORT_FUNCTIONS.map((t) => ({ v: t, label: t })),
          ],
          showSupport: ui.opsCatF === SUPPORT_OPTYPE,
          catValue: ui.opsCatF,
          transformValue: ui.opsTransformF,
          supportValue: ui.opsSupportF,
        }
      : null;

  const stgFilterBar =
    filterStream === 'strategy'
      ? {
          axisOptions: [
            { v: 'all', label: 'المحور: الكل' },
            ...Array.from(new Set(stgScope.map((i) => i.axis || ''))).filter(Boolean).map((t) => ({ v: t, label: t })),
          ],
          axisValue: ui.stgAxisF,
          // قابلية التحول — the derived نعم/لا of the entry's أنشطة
          transformOptions: [
            { v: 'all', label: 'قابلية التحول: الكل' },
            { v: 'نعم', label: 'نعم' },
            { v: 'لا', label: 'لا' },
          ],
          transformValue: ui.stgTransformF,
          prioOptions: [
            { v: 'all', label: 'الأولوية: الكل' },
            { v: 'أولوية عالية', label: 'أولوية عالية' },
            { v: 'أولوية متوسطة', label: 'أولوية متوسطة' },
            { v: 'أولوية منخفضة', label: 'أولوية منخفضة' },
          ],
          prioValue: ui.stgPrioF,
        }
      : null;

  // is any filter currently active (drives the reset button + count)
  const anyFilterActive = ui.activePath !== 'all' || ui.filter !== 'all' || ui.statusFilter !== 'all' || ui.fundFilter !== 'all' || (ui.entFilter && ui.entFilter !== 'all') || !!ui.batchFilter || !!(ui.search || '').trim() || ui.svcServiceF !== 'all' || ui.svcTransformF !== 'all' || ui.svcPrioF !== 'all' || ui.stgAxisF !== 'all' || ui.stgTransformF !== 'all' || ui.stgPrioF !== 'all' || ui.opsCatF !== 'all' || ui.opsTransformF !== 'all' || ui.opsSupportF !== 'all';

  // ---- cards ----
  // ---- sidebar navigation (§redesign v2) ----
  // the coordinator has no dashboard: entering lands directly on قوائم الحصر
  const navSection =
    rawRole === 'proj'
      ? 'stratProjects' // أعضاء المشاريع الاستراتيجية: صفحة واحدة داخل قالب المنصة
      : (rawRole === 'coord' || rawRole === 'path') && (ui.navSection || 'overview') === 'overview' ? 'all' : ui.navSection || 'overview';
  const navStream = ui.navStream; // selected stream summary card ('all' = null)
  const batchFilter = ui.batchFilter; // drill-down from a مرحلة card
  const devStatusOf = devStatusOfItem;
  const agentifiable = (i: Item) => (i.transformability || '') !== 'غير قابل';
  const bucketOf = (section: string) => (i: Item) =>
    section === 'all'
      ? true
      : section === 'projects'
        ? isProjInit(i.type)
        : section === 'operations'
          ? i.type === 'operation'
          : i.type === 'service';
  const roleStreams =
    rawRole === 'coord' || rawRole === 'path' ? PATHS.filter((p) => p.id === myPath) : PATHS;
  // Icons (mirroring the side-menu design)
  const NAV_HOME = 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5';
  const NAV_DOTS = 'M5 6h.01M12 6h.01M19 6h.01M5 12h.01M12 12h.01M19 12h.01M5 18h.01M12 18h.01M19 18h.01';
  const NAV_FOLDER = 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';
  const NAV_SLIDERS = 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6';
  const NAV_GRID4 = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';
  const NAV_CAL = 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z';
  const NAV_ROCKET = 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5';
  const NAV_BUILDING = 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01';
  const NAV_PEOPLE = 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75';

  // «الكل» sub-menu: entity rep + committee drill down by STREAM (full names);
  // coordinator + stream head drill down by input TYPE
  const streamSub = rawRole === 'entity' || rawRole === 'ai';
  // entry counts per nav item (role-scoped portfolio)
  const cntStream = (pid: string) => roleBase.filter((i) => i.path === pid).length;
  const cntProjects = roleBase.filter((i) => isProjInit(i.type)).length;
  const cntOperations = roleBase.filter((i) => i.type === 'operation').length;
  const cntServices = roleBase.filter((i) => i.type === 'service').length;
  const subNav = streamSub
    ? roleStreams.map((p) => ({
        key: 'stream:' + p.id,
        label: p.name,
        icon: PIC[p.id],
        sub: true,
        count: cntStream(p.id),
        active: navSection === 'all' && navStream === p.id,
        onClick: () => {
          s.setNavSection('all');
          s.setNavStream(p.id);
        },
      }))
    : [
        ...(!(roleStreams.length === 1 && (roleStreams[0].id === 'services' || roleStreams[0].id === 'strategy'))
          ? [{ key: 'projects', label: 'المشاريع والمبادرات', icon: NAV_FOLDER, sub: true, count: cntProjects }]
          : []),
        ...(roleStreams.some((p) => streamHasType(p.id, 'operation'))
          ? [{ key: 'operations', label: myPath === 'strategy' ? 'المهام' : 'العمليات', icon: NAV_SLIDERS, sub: true, count: cntOperations }]
          : []),
        ...(roleStreams.some((p) => streamHasType(p.id, 'service'))
          ? [{ key: 'services', label: 'الخدمات الحكومية', icon: NAV_GRID4, sub: true, count: cntServices }]
          : []),
      ];

  const navItems = [
    { key: 'overview', label: 'الرئيسية', icon: NAV_HOME },
    { key: 'all', label: streamSub ? 'جميع المسارات' : 'جميع التصنيفات', icon: NAV_DOTS, count: roleBase.length, active: navSection === 'all' && !navStream, onClick: () => s.setNavSection('all') },
    ...subNav,
    { key: 'launchplans', label: 'مراحل التنفيذ', icon: NAV_CAL },
    { key: 'lplan', label: 'دفعات الإطلاق', icon: NAV_ROCKET },
    ...(rawRole === 'ai' || rawRole === 'path' ? [{ key: 'entities', label: 'الجهات المشاركة', icon: NAV_BUILDING }] : []),
    ...(rawRole === 'entity' ? [{ key: 'team', label: 'فريق العمل', icon: NAV_PEOPLE }] : []),
  ].map((n) => ({
    sub: false,
    pin: false,
    heading: false,
    count: undefined as number | undefined,
    active: navSection === n.key,
    onClick: n.key === 'team' ? () => s.openTeam() : () => s.setNavSection(n.key),
    ...n,
  }));

  // coordinator side menu (لوحة الجهة): «قوائم الحصر» lists the assigned
  // stream(s) — one entry when a single stream, several when multi-assigned —
  // then «دفعات الإطلاق». (Demo mode lists all streams for testing.)
  const coordStreamIds = process.env.NEXT_PUBLIC_DEMO_MODE === '1' ? PATHS.map((p) => p.id) : s.myPaths?.length ? s.myPaths : [myPath];
  const cntEntStream = (pid: string) => s.items.filter((i) => ent(i) === entityName && i.path === pid).length;
  const plainNav = (key: string, label: string, icon: string) => ({
    key,
    label,
    icon,
    sub: false,
    pin: false,
    heading: false,
    count: undefined as number | undefined,
    active: navSection === key,
    onClick: () => s.setNavSection(key),
  });
  const invHead = { key: 'invhead', label: 'قوائم الحصر', icon: '', sub: false, pin: false, heading: true, count: undefined as number | undefined, active: false, onClick: () => {} };
  const lplanHead = { key: 'lplanhead', label: 'دفعات الإطلاق', icon: '', sub: false, pin: false, heading: true, count: undefined as number | undefined, active: false, onClick: () => {} };
  // دفعات الإطلاق per-stream subitems — every batches page is bound to its own
  // stream, so entries can never be placed on another stream's batches
  const lplanItem = (pid: string, active: boolean, onClick: () => void) => ({
    key: 'lp-' + pid,
    label: 'مسار ' + pathById(pid).name,
    icon: PIC[pid],
    sub: true,
    pin: true,
    heading: false,
    count: undefined as number | undefined,
    active,
    onClick,
  });
  const streamItem = (pid: string, count: number, active: boolean, onClick: () => void) => ({
    key: 'inv-' + pid,
    label: 'مسار ' + pathById(pid).name,
    icon: PIC[pid],
    sub: true,
    pin: true,
    heading: false,
    count: count as number | undefined,
    active,
    onClick,
  });
  const navItemsOut =
    rawRole === 'proj'
      ? [plainNav('stratProjects', 'المشاريع الاستراتيجية', NAV_GRID4)]
      : rawRole === 'coord'
      ? [
          invHead,
          ...coordStreamIds.map((pid) =>
            streamItem(pid, cntEntStream(pid), navSection === 'all' && myPath === pid, () => {
              s.setMyPath(pid);
              s.setNavSection('all');
            })
          ),
          lplanHead,
          ...coordStreamIds.map((pid) =>
            lplanItem(pid, navSection === 'lplan' && myPath === pid, () => {
              s.setMyPath(pid);
              s.setNavSection('lplan');
            })
          ),
        ]
      : rawRole === 'path'
        ? [
            // stream head / deputy: the stream's inventory (all entities —
            // review + approval happen from the list), then the batches
            invHead,
            streamItem(myPath, roleBase.filter((i) => i.path === myPath).length, navSection === 'all', () => s.setNavSection('all')),
            plainNav('lplan', 'دفعات الإطلاق', NAV_ROCKET),
            plainNav('entities', 'الجهات المشاركة', NAV_BUILDING),
          ]
        : rawRole === 'ai'
          ? [
              // committee chair + secretariat: national dashboard, then the
              // three streams' inventories (view-only) and the batches
              plainNav('overview', 'الرئيسية', NAV_HOME),
              invHead,
              ...PATHS.map((p) =>
                streamItem(p.id, roleBase.filter((i) => i.path === p.id).length, navSection === 'all' && navStream === p.id, () => {
                  s.setNavSection('all');
                  s.setNavStream(p.id);
                })
              ),
              { key: 'inv-moca', label: 'وزارة شؤون مجلس الوزراء', icon: NAV_BUILDING, sub: true, pin: true, heading: false, count: undefined as number | undefined, active: navSection === 'mocaInv', onClick: () => s.setNavSection('mocaInv') },
              lplanHead,
              ...PATHS.map((p) =>
                lplanItem(p.id, navSection === 'lplan' && navStream === p.id, () => {
                  s.setNavSection('lplan');
                  s.setNavStream(p.id);
                })
              ),
              { key: 'lp-moca', label: 'وزارة شؤون مجلس الوزراء', icon: NAV_BUILDING, sub: true, pin: true, heading: false, count: undefined as number | undefined, active: navSection === 'mocaLplan', onClick: () => s.setNavSection('mocaLplan') },
              { key: 'uc-moca', label: 'حالات الاستخدام', icon: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c.6.6 1 1.2 1 2h6c0-.8.4-1.4 1-2a6 6 0 0 0-4-10z', sub: false, pin: false, heading: false, count: undefined as number | undefined, active: navSection === 'mocaUse', onClick: () => s.setNavSection('mocaUse') },
              plainNav('entities', 'الجهات المشاركة', NAV_BUILDING),
              // إدارة المشاريع الاستراتيجية واعتماد نماذجها — صفحة اللجنة الخاصة
              plainNav('stratProjects', 'المشاريع الاستراتيجية', NAV_GRID4),
              ]
          : navItems;

  const typeSections: Record<string, string> = {
    all: 'جميع المدخلات',
    projects: 'المشاريع والمبادرات',
    operations: 'العمليات',
    services: 'الخدمات الحكومية',
  };
  const isTypeSection = navSection in typeSections;
  // committee/stream-head entity filter applies to the whole portfolio page
  const portfolioBase =
    (rawRole === 'ai' || rawRole === 'path') && ui.entFilter !== 'all'
      ? roleBase.filter((i) => ent(i) === ui.entFilter)
      : roleBase;
  // stream summary cards on top of portfolio pages — «الكل» first, clickable filters
  const portfolioStreams = !isTypeSection
    ? []
    : [
        { id: null as string | null, name: 'الكل' },
        ...roleStreams
          .filter((p) =>
            navSection === 'operations'
              ? streamHasType(p.id, 'operation')
              : navSection === 'services'
                ? streamHasType(p.id, 'service')
                : true
          )
          .map((p) => ({ id: p.id as string | null, name: p.name })),
      ].map((st) => {
        const inScope = portfolioBase.filter(
          (i) =>
            bucketOf(navSection)(i) &&
            (st.id ? i.path === st.id : true) &&
            (batchFilter ? i.execBatch === batchFilter : true)
        );
        return {
          ...st,
          total: inScope.length,
          active: (navStream || null) === st.id,
          onClick: () => s.setNavStream(st.id),
        };
      })
      // hide zero-count streams except «الكل» when the coord's own stream (single) —
      // keep all for consistency; multi-stream roles see all five
      ;
  // recap strip for the active selection
  const portfolioScope = !isTypeSection
    ? []
    : portfolioBase.filter(
        (i) =>
          bucketOf(navSection)(i) &&
          (navStream ? i.path === navStream : true) &&
          (batchFilter ? i.execBatch === batchFilter : true)
      );
  const recap = {
    total: portfolioScope.length,
    transformable: portfolioScope.filter(isTransformableEntry).length,
    targeted: portfolioScope.filter(isTargetedEntry).length,
    notCapable: portfolioScope.filter((i) => !isTransformableEntry(i)).length,
  };
  // per-stream dropdown filters — the same rules as the overview pipeline,
  // applied to the coordinator/head list too (an entry matches when ANY of
  // its activities matches the picked value)
  const streamFilterMatch = (i: Item): boolean => {
    if (filterStream === 'services') {
      if (ui.svcServiceF !== 'all' && (i.title || '') !== ui.svcServiceF) return false;
      if (ui.svcTransformF !== 'all' && !itemActivities(i).some((a) => activityTransformYes('services', a) === ui.svcTransformF)) return false;
      if (
        ui.svcPrioF !== 'all' &&
        !(i.type === 'service' && itemActivities(i).some((a) => String(svcPriority(a.usageIntensity, a.complexity, a.readinessLevel) ?? '') === ui.svcPrioF))
      )
        return false;
    }
    if (filterStream === 'strategy') {
      if (ui.stgAxisF !== 'all' && (i.axis || '') !== ui.stgAxisF) return false;
      if (ui.stgTransformF !== 'all' && !itemActivities(i).some((a) => activityTransformYes('strategy', a) === ui.stgTransformF)) return false;
      if (ui.stgPrioF !== 'all' && !itemActivities(i).some((a) => (stgPriority(a)?.cat || '') === ui.stgPrioF)) return false;
    }
    if (filterStream === 'ops') {
      if (ui.opsCatF !== 'all' && (i.opType || '') !== ui.opsCatF) return false;
      if (
        ui.opsTransformF !== 'all' &&
        !itemActivities(i).some((a) => activityTransformYes('ops', a) === ui.opsTransformF)
      )
        return false;
      if (ui.opsSupportF !== 'all' && (i.supportFn || '') !== ui.opsSupportF) return false;
    }
    return true;
  };
  // list inside the portfolio page (respects search + status + fund filters)
  const sectionCards = !isTypeSection
    ? []
    : portfolioScope
        .filter(streamFilterMatch)
        .filter((i) => (ui.statusFilter !== 'all' ? statusMatch(i, ui.statusFilter, rawRole, s) : true))
        .filter((i) =>
          ui.fundFilter === 'funded' ? !!i.funded : ui.fundFilter === 'notfunded' ? !i.funded : true
        )
        .filter((i) => {
          const q2 = (ui.search || '').trim().toLowerCase();
          if (!q2) return true;
          return (i.title || '').toLowerCase().includes(q2) || stripHtml(i.desc || '').toLowerCase().includes(q2);
        })
        .sort((a, b) => stageOrderOf(a) - stageOrderOf(b))
        .map((i) => mkCard(i, s, { rawRole, role, myName, ent }));

  // committee «الجهات» page: one card per entity
  const entityCards =
    rawRole !== 'ai' && rawRole !== 'path'
      ? []
      : [...new Set(roleBase.map((i) => ent(i)))].map((e) => {
          const inEnt = roleBase.filter((i) => ent(i) === e);
          const execBudget = inEnt.reduce((a, i) => a + parseBudget(i.budget), 0);
          const fundedItems = inEnt.filter((i) => !!i.funded);
          const approvedCost = fundedItems.reduce((a, i) => a + parseBudget(i.budget), 0);
          // committee: broken down across every stream (full names, fixed order);
          // stream head: by type, only the types his stream carries (items are
          // already scoped to his stream via roleBase)
          const byStream =
            rawRole === 'path'
              ? [
                  ...(streamHasType(myPath, 'operation')
                    ? [{ name: 'العمليات', count: inEnt.filter((i) => i.type === 'operation').length }]
                    : []),
                  ...(streamHasType(myPath, 'service')
                    ? [{ name: 'الخدمات الحكومية', count: inEnt.filter((i) => i.type === 'service').length }]
                    : []),
                ]
              : PATHS.map((p) => ({ name: p.name, count: inEnt.filter((i) => i.path === p.id).length }));
          return {
            name: e,
            total: inEnt.length,
            byStreamTitle: rawRole === 'path' ? 'المدخلات حسب التصنيف' : 'المدخلات حسب المسار',
            byStream,
            // approved = accepted by رئيس المسار into a دفعة (no nomination stage)
            pendingApproval: inEnt.filter((i) => wfOf(i) === 'ent1').length,
            funded: inEnt.filter((i) => ['exec', 'budget', 'launch', 'done'].includes(wfOf(i))).length,
            approvedCostLabel: approvedCost > 0 ? formatMoney(approvedCost) : '—',
            execBudgetLabel: execBudget > 0 ? formatMoney(execBudget) : '—',
            onOpen: () => {
              s.setNavSection('all');
              s.setEntFilter(e);
            },
          };
        }).sort((a, b) => b.total - a.total);

  const cards = visible.map((i) => mkCard(i, s, { rawRole, role, myName, ent }));
  // اعتماد جماعي لفريق عمل المسار: كل الظاهر أمامه القابل للاعتماد — المُرسَل
  // للاعتماد ومسودات رفعه بالنيابة — ويحترم التصفية الحالية (الجهة…)
  const approveAllIds =
    rawRole === 'path'
      ? visible
          .filter((i) => {
            const w = wfOf(i);
            return w === 'ent1' || (w === 'draft' && isTeamUpload(i));
          })
          .map((i) => i.id)
      : [];

  // bulk-assign selection state (change vs first assignment)
  const assignSelItems = s.items.filter((i) => ui.assignSel.includes(i.id));
  const assignSelBatches = Array.from(
    new Set(assignSelItems.map((i) => i.execBatch).filter((b): b is string => !!b))
  );
  const assignIsChange = assignSelItems.length > 0 && assignSelItems.every((i) => !!i.execBatch);

  // ---- committee analytics ----
  // Scope to what the committee actually sees (roleBase drops draft + ent1),
  // so the headline «إجمالي المدخلات» reconciles with every list/breakdown below.
  const aiBase = roleBase;
  const withScore = aiBase.filter((i) => wfOf(i) !== 'draft');
  const scores = withScore.map((i) => transformScore(i).v);
  const sumV = scores.reduce((a, b) => a + b, 0);
  const n = scores.length || 1;
  // spent budget = own budgets of committee-funded items + each funded launch
  // plan's group budget counted ONCE (items without an own budget share it)
  // plan budgets are DERIVED from item budgets, so totals sum items directly
  const fundedItems = aiBase.filter((i) => i.funded);
  const spentBudget = fundedItems.reduce((a, i) => a + parseBudget(i.budget), 0);
  const aiNomByCommittee = (i: Item) =>
    !!i.nom && (!!i.nom.direct || i.nom.role === 'اللجنة الوطنية' || i.nom.by === 'اللجنة الوطنية');
  const aiStats = {
    entCount: new Set(aiBase.map((i) => ent(i))).size,
    total: aiBase.length,
    // the committee acts only on stream-head nominations, not on raw submissions
    nominated: aiBase.filter((i) => !!i.nom && !i.funded).length,
    nominatedHeads: aiBase.filter((i) => !!i.nom && !i.funded && !aiNomByCommittee(i)).length,
    nominatedCommittee: aiBase.filter((i) => !!i.nom && !i.funded && aiNomByCommittee(i)).length,
    funded: aiBase.filter((i) => i.funded).length,
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

  // participating entities — ranked by number of inputs submitted (committee view).
  // entities with zero submissions never appear.
  const entityRanking = (() => {
    const counts = new Map<string, number>();
    roleBase.forEach((i) => {
      const name = ent(i);
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const rows = [...counts.entries()]
      .map(([name, n]) => ({ name, n }))
      .filter((r) => r.n > 0)
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'ar'));
    const max = rows.length ? rows[0].n : 1;
    return rows.map((r, idx) => ({ ...r, frac: r.n / max, top: idx === 0 }));
  })();

  // ---- program steps + countdown ----
  const firstMs = execMilestones()[0];
  const cd = countdown(firstMs.end!);
  const dl = daysLeft(firstMs.end!);
  const banner = {
    title: 'تقدم مشروع الذكاء الاصطناعي المساعد',
    // big page heading shown ABOVE the blue box; the coordinator sees his stream
    pageTitle:
      rawRole === 'coord' || rawRole === 'path'
        ? 'مسار ' + pathById(myPath).name
        : rawRole === 'entity'
          ? 'لوحة متابعة الإدخال'
          : 'مشروع الذكاء الاصطناعي المساعد',
    // small title inside the blue box
    boxTitle: 'ملخص التقدم',
    subtitle:
      rawRole === 'entity'
        ? 'متابعة مدخلات الجهة حسب المسارات، مراحل التقدم، وحالة الاعتماد.'
        : rawRole === 'coord'
          ? 'متابعة مدخلات المسار حسب النوع والأولوية ودفعات الإطلاق.'
          : rawRole === 'path'
            ? 'مراجعة مدخلات جميع الجهات ضمن المسار واعتمادها.'
            : 'رحلة منظمة من الحصر والاختيار إلى التنفيذ وقياس الأثر لضمان تحول فعّال ومؤثر',
    firstMsName: firstMs.name,
    // top-bar countdown display copy (assessment/review phase closing)
    countdownLabel: 'مرحلة التقييم والمراجعة',
    countdownCaption: 'المتبقي على إغلاق التقييم',
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
  // منسق جهته وزارة شؤون مجلس الوزراء يعمل في نسخة الوزارة المستقلة —
  // في النسخة الحية الدور والجهة من الجلسة، فالتحويل هنا للنسخة التجريبية فقط
  const rolePills = ROLE_PILLS.map((p) => ({
    key: p.key,
    label: p.label,
    active: actualRole === p.key,
    onClick: () => {
      if (
        p.key === 'coord' &&
        process.env.NEXT_PUBLIC_DEMO_MODE === '1' &&
        /وزارة شؤون مجلس الوزراء/.test(entityName)
      ) {
        s.setRole('coord');
        try { useMoca.getState().setRole('coord'); } catch { /* ignore */ }
        window.location.href = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/moca/';
        return;
      }
      s.setRole(p.key);
    },
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
      ? PATH_REPS[myPath] || 'فريق عمل المسار في المشروع'
      : rawRole === 'ai'
        ? 'اللجنة الوطنية للذكاء الاصطناعي المساعد'
        : rawRole === 'admin'
          ? 'مشرف النظام'
          : rawRole === 'coord'
            ? s.setup.owners[myPath]?.name || 'منسق المسار في الجهة الاتحادية'
            : repName;
  const profilePos =
    rawRole === 'path'
      ? 'فريق عمل مسار ' + pathById(myPath).name
      : rawRole === 'ai'
        ? ROLE.ai.sub
        : rawRole === 'admin'
          ? ROLE.admin.sub
          : rawRole === 'coord'
            ? 'منسق مسار ' + pathById(myPath).name + ' في الجهة'
            : repPos;
  const profileInitials =
    profileName.split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || 'م';

  // ---- admin console (لوحة المشرف) ----
  const isAdmin = rawRole === 'admin';
  const roleOrder: RoleKey[] = ['admin', 'ai', 'path', 'coord'];
  const streamName = (id?: string) => (id ? pathById(id).name : '');
  const adminUsers = [...s.users]
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) || a.name.localeCompare(b.name, 'ar'))
    .map((u) => ({
      ...u,
      roleLabel: ROLE[u.role]?.label || u.role,
      roleBadge: ROLE[u.role]?.badge || '#64748B',
      roleBg: ROLE[u.role]?.bg || '#EEF2F7',
      streamLabel: streamName(u.streamId),
      // عضو المشاريع الاستراتيجية: نطاقه قائده المسؤول لا الجهة/المسار
      scopeLabel:
        u.role === 'proj'
          ? u.projLead
            ? 'القائد: ' + u.projLead
            : '—'
          : [u.entityName, streamName(u.streamId)].filter(Boolean).join(' · ') || '—',
      initials: u.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || 'م',
    }));
  const admin = {
    users: adminUsers,
    roleInfo: ROLE_INFO,
    // heads can be assigned for all five project streams (not only the three
    // managed inside the platform)
    streams: CONTACT_STREAMS.filter((c) => c.key !== 'general').map((c) => ({ id: c.key, name: c.label })),
    // القائمة الكاملة: دليل الخدمات (47 جهة) + مجموعة الجهات الأصلية +
    // وزارة شؤون مجلس الوزراء (بنيتها المستقلة) + جهة الجلسة
    entities: Array.from(
      new Set([DEFAULT_ENTITY, ...svcCatalogEntities(), ...FEDERAL_ENTITIES, entityName].filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'ar')),
    counts: {
      total: s.users.length,
      active: s.users.filter((u) => u.active).length,
      heads: s.users.filter((u) => u.role === 'path').length,
      committee: s.users.filter((u) => u.role === 'ai').length,
    },
    contactEmails: s.contactEmails,
    setContactEmail: (k: string, v: string) => s.setContactEmail(k, v),
    saveUser: (u: (typeof s.users)[number]) => s.adminSaveUser(u),
    toggleUser: (id: string) => s.adminToggleUser(id),
    removeUser: (id: string) => s.adminRemoveUser(id),
  };

  // ---- services coordinator KPI strip (أعداد الخدمات الفرعية) ----
  const svcItems = roleBase.filter((i) => i.path === 'services' && i.type === 'service');
  // أولوية الاختيار is always derived from the matrix. أولوية التحول (نعم/لا)
  // affects ONLY «المستهدف تحويلها» — القابلة للتحول = priority 1-3 regardless
  const svcPr = (i: Item) => svcPriority(i.usageIntensity, i.complexity, i.readinessLevel);
  // every child (نشاط / خدمة فرعية) carries its own details — KPIs count
  // the activities themselves, not the parent entries
  const svcSubs = svcItems.flatMap((i) => itemActivities(i));
  const svcSubPr = (a: ActivityDetail) => svcPriority(a.usageIntensity, a.complexity, a.readinessLevel);
  const svcKpis =
    filterStream === 'services'
      ? {
          mainSvc: new Set(svcItems.map((i) => (i.title || '').trim()).filter(Boolean)).size,
          total: svcSubs.length,
          transformable: svcSubs.filter((a) => { const p = svcSubPr(a); return p != null && p <= 3; }).length,
          targeted: svcSubs.filter((a) => activityTransformYes('services', a) === 'نعم').length,
          p1: svcSubs.filter((a) => svcSubPr(a) === 1).length,
          p2: svcSubs.filter((a) => svcSubPr(a) === 2).length,
          p3: svcSubs.filter((a) => svcSubPr(a) === 3).length,
        }
      : null;

  // ---- strategy coordinator KPI strip (أعداد المهام والأنشطة) ----
  const stgTasks = roleBase.filter((i) => i.path === 'strategy' && i.type === 'operation');
  const stgActList = stgTasks.flatMap((i) => itemActivities(i));
  const stgCatOfA = (a: ActivityDetail) => stgPriority(a)?.cat || '';
  const stgKpis =
    filterStream === 'strategy'
      ? {
          tasks: stgTasks.length,
          acts: stgActList.length,
          transformable: stgActList.filter((a) => ['أولوية عالية', 'أولوية متوسطة'].includes(stgCatOfA(a))).length,
          targeted: stgActList.filter((a) => activityTransformYes('strategy', a) === 'نعم').length,
          p1: stgActList.filter((a) => stgCatOfA(a) === 'أولوية عالية').length,
          p2: stgActList.filter((a) => stgCatOfA(a) === 'أولوية متوسطة').length,
          p3: stgActList.filter((a) => stgCatOfA(a) === 'أولوية منخفضة').length,
        }
      : null;

  // ---- operations coordinator KPI strip (ملخص الحصر) ----
  const opsTasks = roleBase.filter((i) => i.path === 'ops' && i.type === 'operation');
  const opsActList = opsTasks.flatMap((i) => itemActivities(i));
  const opsKpis =
    filterStream === 'ops'
      ? {
          ops: opsTasks.length,
          acts: opsActList.length,
          // the ops rating matrix is pending approval — «القابلة للتحول»
          // mirrors the activities flagged for transformation
          transformable: opsActList.filter((a) => (a.transformYes || '') === 'نعم').length,
          targeted: opsActList.filter((a) => (a.transformYes || '') === 'نعم').length,
        }
      : null;

  // ---- دفعات الإطلاق: per-stream tables (coordinator + head/deputy) ----
  const actsCompact = (i: Item) =>
    stripHtml(i.subActivities || '')
      .split(/\n/)
      .map((t) => t.trim())
      .filter(Boolean)
      .join('، ');
  // أولوية الاختيار of ONE نشاط (used by the دفعات tables)
  const actPrioCellOf = (i: Item, a: ActivityDetail) => {
    if (i.type === 'service') {
      const p = svcPriority(a.usageIntensity, a.complexity, a.readinessLevel);
      return p ? 'الأولوية ' + p : '—';
    }
    if (i.path === 'strategy' && i.type === 'operation') return stgPriority(a)?.cat || '—';
    return '—'; // operations: pending the matrix
  };
  const prioCellOf = (i: Item) => {
    const acts = itemActivities(i);
    if (i.type === 'service') {
      const prs = (acts.length
        ? acts.map((a) => svcPriority(a.usageIntensity, a.complexity, a.readinessLevel))
        : [svcPriority(i.usageIntensity, i.complexity, i.readinessLevel)]
      ).filter((p): p is 1 | 2 | 3 | 4 => p != null);
      const uniq = Array.from(new Set(prs)).sort();
      return uniq.length ? 'الأولوية ' + uniq.join('، ') : '—';
    }
    if (i.path === 'strategy' && i.type === 'operation') {
      const cats = (acts.length ? acts.map((a) => stgPriority(a)?.cat || '') : [stgPriority(i)?.cat || '']).filter(Boolean);
      return cats.length ? Array.from(new Set(cats)).join('، ') : '—';
    }
    return '—'; // operations: pending the matrix
  };
  // coordinator + head/deputy work on their own stream; the committee (chair +
  // secretariat) gets the same tables for whichever stream is selected
  const btStream =
    rawRole === 'coord' || rawRole === 'path'
      ? myPath
      : rawRole === 'ai'
        ? filterStream !== 'all'
          ? filterStream
          : PATHS[0].id
        : null;
  const batchTables = btStream
    ? (() => {
        const bPath = btStream;
        // مسار العمليات: التوزيع آلي من «فترة التحويل» المختارة عند الإدخال —
        // الصفحة عرض فقط لكل الأدوار ولا دورة اعتماد ثانية (الاعتماد مرة
        // واحدة على المدخل نفسه)
        const autoPlaced = bPath === 'ops';
        // «الدفعة X - شهر» → دفعة الإطلاق المطابقة + الشهر
        const periodBatchOf = (period?: string): { batch: string; month: string } | null => {
          const v = String(period || '').trim();
          if (!v) return null;
          for (const b of streamLaunchBatches(bPath)) {
            const short = b.name.replace('إطلاق ', '');
            if (v.startsWith(short + ' - ')) return { batch: b.name, month: v.slice(short.length + 3).trim() };
          }
          return null;
        };
        return {
          streamName: pathById(bPath).name,
          autoPlaced,
          canEditDates: rawRole === 'coord' && !autoPlaced,
          // rows are أنشطة (خدمات فرعية / عمليات فرعية بحسب المسار)
          unitLabel: bPath === 'services' ? 'خدمات فرعية' : bPath === 'ops' ? 'عمليات فرعية' : 'أنشطة',
          unitSingular: bPath === 'services' ? 'خدمة فرعية' : bPath === 'ops' ? 'عملية فرعية' : 'نشاط',
          // coordinator: move/remove DRAFT placements freely, then send the
          // توزيعات for approval — a cycle fully separate from item approval
          canArrange: rawRole === 'coord' && !autoPlaced,
          moveOptions: streamLaunchBatches(bPath).map((b) => ({ v: b.name, label: batchDafaaLabel(b.name) })),
          // فريق عمل المسار reviews pending توزيعات from here
          canReview: rawRole === 'path' && !autoPlaced,
          // الأدوار ذات الاطلاع على كل الجهات ترى عمود الجهة وفلترها
          showEntity: rawRole === 'path' || rawRole === 'ai',
          submitLabel: 'إرسال للاعتماد',
          // توزيعات مسودة بانتظار الإرسال — أياً كانت حالة مدخلاتها
          draftCount: autoPlaced
            ? 0
            : roleBase
                .filter((i) => i.path === bPath && ['exec', 'launch', 'done'].includes(wfOf(i)))
                .reduce((n, i) => n + itemActivities(i).filter((a) => placementState(i, a) === 'draft').length, 0),
          pendingCount: autoPlaced
            ? 0
            : roleBase
                .filter((i) => i.path === bPath)
                .reduce((n, i) => n + itemActivities(i).filter((a) => placementState(i, a) === 'pending').length, 0),
          onSubmitAll: () => s.submitPlacements(bPath),
          // send a chosen subset of توزيعات (keys itemId::actIdx)
          onSubmitIds: (ids: string[]) => s.submitPlacements(bPath, ids),
          // move-to-batch options (raw names carried; labels shown)
          batchOptions: streamLaunchBatches(bPath).map((b) => ({ v: b.name, label: batchDafaaLabel(b.name) })),
          onMove: (id: string, batch: string) => s.assignItemBatch(id, batch),
          // the دفعات work at نشاط level: every نشاط / خدمة فرعية is its own
          // row with its own dates and its own أولوية الاختيار
          cols:
            bPath === 'services'
              ? ['الخدمة', 'الخدمة الفرعية']
              : bPath === 'strategy'
                ? ['المحور', 'المهمة', 'النشاط']
                : ['تصنيف العملية', 'العملية الرئيسية', 'العملية الفرعية'],
          batches: streamLaunchBatches(bPath).map((b) => {
            // flatten the stream's entries into (entry, نشاط) pairs once
            const pairs = roleBase
              .filter((i) => i.path === bPath)
              .flatMap((i) => itemActivities(i).map((a, ai) => ({ i, a, ai })));
            // مسار العمليات: العضوية من «فترة التحويل» (مع إبقاء التوزيعات
            // القديمة المحفوظة قبل التحديث ظاهرة في دفعاتها)
            const inBatch = pairs.filter(({ i, a }) =>
              autoPlaced
                ? (periodBatchOf(a.transformPeriod)?.batch || activityBatch(i, a)) === b.name
                : activityBatch(i, a) === b.name
            );
            return {
              name: batchDafaaLabel(b.name),
              rawName: b.name,
              period: b.period || '',
              // نشاط dates must stay inside the دفعة window
              minDate: b.start || '',
              maxDate: b.end || '',
              count: inBatch.length,
              rows: inBatch.map(({ i, a, ai }) => ({
                id: i.id + '::' + ai,
                itemId: i.id,
                actIdx: ai,
                lead:
                  bPath === 'services'
                    ? [i.title || '—', a.name || '—']
                    : bPath === 'strategy'
                      ? [i.axis || '—', i.title || '—', a.name || '—']
                      : [i.opType || '—', i.title || '—', a.name || '—'],
                entity: ent(i),
                month: autoPlaced ? periodBatchOf(a.transformPeriod)?.month || '' : '',
                start: a.startDate ?? i.startDate ?? '',
                end: a.endDate ?? i.endDate ?? '',
                prio: actPrioCellOf(i, a),
                // حالة محتوى المدخل نفسه (دورة الاعتماد الأولى)
                status: i.ret ? (isRejected(i) ? REJECTED_STATUS : RETURNED_STATUS) : wfMeta(i).label,
                // حالة التوزيع (دورة الاعتماد الثانية) — شريحة مستقلة؛
                // لا وجود لها في مسار العمليات (التوزيع آلي بلا اعتماد ثانٍ)
                placement: autoPlaced ? null : placementChip(i, a),
                locked: autoPlaced ? true : placementLocked(i, a),
                notes: stripHtml(a.notes || i.notes || '') || '—',
                batch: activityBatch(i, a),
                onOpen: () => s.openDetail(i.id),
                // coordinator actions on the placement itself
                onMove: (to: string) => s.assignActivityBatch(i.id, ai, to),
                onRemove: () => s.assignActivityBatch(i.id, ai, ''),
                // إرسال هذا التوزيع وحده للاعتماد
                canSubmit: !autoPlaced && rawRole === 'coord' && placementState(i, a) === 'draft',
                onSubmit: () => s.submitPlacements(bPath, [i.id + '::' + ai]),
                // فريق عمل المسار: قرار على التوزيع المعلّق نفسه
                canReview: !autoPlaced && rawRole === 'path' && placementState(i, a) === 'pending',
                onApprove: () => s.reviewPlacement(i.id, ai, 'approve'),
                onReturn: (note: string) => s.reviewPlacement(i.id, ai, 'info', note),
                onReject: (note: string) => s.reviewPlacement(i.id, ai, 'reject', note),
              })),
              // أنشطة of this stream NOT in this دفعة — the per-batch picker
              // shows each نشاط with its own priority so placement is informed
              // لا يُعرض في منتقي الإضافة إلا أنشطة المدخلات المعتمدة
              addable: (autoPlaced ? [] : pairs)
                .filter(({ i }) => ['exec', 'launch', 'done'].includes(wfOf(i)))
                .filter(({ i, a }) => activityBatch(i, a) !== b.name)
                .map(({ i, a, ai }) => ({
                  id: i.id + '::' + ai,
                  entity: ent(i),
                  title: a.name || '—',
                  sub: [i.title || '', bPath === 'services' ? '' : bPath === 'strategy' ? i.axis || '' : i.opType || ''].filter(Boolean).join(' · '),
                  sector: a.sector || i.sector || '',
                  prio: actPrioCellOf(i, a),
                  currentBatch: activityBatch(i, a) ? batchDafaaLabel(activityBatch(i, a)) : 'بدون دفعة',
                  onAssign: () => s.assignActivityBatch(i.id, ai, b.name),
                })),
            };
          }),
        };
      })()
    : null;

  // ---- expected results (النتائج المتوقعة) ----
  const resInScope = (r: { path?: string }) =>
    rawRole === 'coord' || rawRole === 'path' ? (r.path || myPath) === myPath : true;
  const itemTitleById = new Map(s.items.map((i) => [i.id, i.title] as const));
  const resultItemOpts = roleBase.map((i) => ({ id: i.id, title: i.title, type: typeLabelFor(i.type, i.path) }));
  const resultsPage = {
    cards: s.expectedResults.filter(resInScope).map((r) => ({
      id: r.id,
      text: r.text,
      streamName: r.path ? pathById(r.path).name : '',
      items: r.itemIds.map((id) => ({ id, title: itemTitleById.get(id) || '—' })).filter((x) => x.title !== '—'),
      count: r.itemIds.filter((id) => itemTitleById.has(id)).length,
      onEdit: () => s.openResultModal(r.id),
      onDelete: () => s.deleteResult(r.id),
    })),
    onAdd: () => s.openResultModal(),
  };
  const rm = ui.resultModal;
  const resultModal = rm
    ? {
        isEdit: !!rm.id,
        text: rm.text,
        selectedCount: rm.itemIds.length,
        itemOptions: resultItemOpts.map((o) => ({ ...o, checked: rm.itemIds.includes(o.id) })),
        onText: (v: string) => s.setResultText(v),
        onToggle: (id: string) => s.toggleResultItem(id),
        onSave: () => s.saveResult(),
        onClose: () => s.closeResultModal(),
      }
    : null;

  return {
    batchTables,
    opsKpis,
    stgKpis,
    stgFilterBar,
    opsFilterBar,
    inlineCreate: ui.inlineCreate && !!ui.draft && (ui.mStep === 'form' || ui.mStep === 'type'),
    confirmAdd: ui.confirmAdd,
    svcFilterBar,
    svcKpis,
    resultsPage,
    resultModal,
    isAdmin,
    // دور أعضاء المشاريع الاستراتيجية — صفحته داخل قالب المنصة القياسي
    isProj: rawRole === 'proj',
    adminReturn: s.role === 'admin' && !!s.ui.adminDash,
    admin,
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
    // النسخة التجريبية: مبدّل الأدوار للجميع. النسخة الحية: لمشرف النظام
    // فقط — يتنقل به بين لوحات الأدوار ولوحة الإدارة (جلسة واحدة موحّدة).
    showRoleSwitcher: process.env.NEXT_PUBLIC_DEMO_MODE === '1' || s.sessionAdmin,
    // coordinator assigned to several streams: header dropdown to switch the
    // ACTIVE stream (everything on screen is scoped to it). In demo mode we list
    // ALL streams so every stream can be exercised from one coordinator login;
    // in production the list stays scoped to the coordinator's assigned streams.
    streamSwitcher: (() => {
      const demoAllStreams = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
      const ids = demoAllStreams ? PATHS.map((p) => p.id) : s.myPaths?.length ? s.myPaths : [myPath];
      return {
        // the coordinator switches streams from قوائم الحصر in the side nav —
        // only the stream head/deputy keeps the header switcher
        show: rawRole === 'path' && actualRole !== 'coord' && (demoAllStreams || ids.length > 1),
        value: myPath,
        options: ids.map((id) => ({ v: id, label: pathById(id).name })),
      };
    })(),
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
    showProgramBanner: rawRole === 'entity' || rawRole === 'coord' || rawRole === 'path',
    banner,
    isAiRole,
    // rail + kpis
    showRail,
    pathRail,
    totalCount,
    shownCount: visible.length,
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
    grandBudgetTotalLabel: formatMoney(execBudgetTotal + launchBudgetTotal),
    execBudgetTotal,
    launchBudgetTotal,
    costCard,
    inputsCard,
    nomCard,
    streamOverviewCards,
    typeOverviewCards,
    streamTypeKeys,
    stageDist,
    committeeStreamCards,
    showOpsKpi: filterStream === 'all' || streamHasType(filterStream, 'operation'),
    showSvcKpi: filterStream === 'all' || streamHasType(filterStream, 'service'),
    notAiRole: !isAiRole,
    // filters
    tabs,
    filterValue: effTypeFilter,
    statusOptions,
    statusFilterValue: ui.statusFilter,
    emptyDesc,
    navItems: navItemsOut,
    navSection,
    navStream,
    kpiBreak,
    sectionTitle:
      navSection === 'all' && ui.navStream
        ? 'مدخلات مسار ' + pathById(ui.navStream).name
        : navSection === 'all'
          ? rawRole === 'entity'
            ? 'جميع مدخلات الجهة'
            : rawRole === 'coord'
              ? 'جميع مدخلات المسار'
              : rawRole === 'path'
                ? 'قائمة حصر مسار ' + pathById(myPath).name
                : rawRole === 'ai'
                  ? 'قائمة الاعتماد'
                  : ''
          : (navSection in typeSections ? (navSection === 'operations' && myPath === 'strategy' ? 'المهام' : typeSections[navSection]) : '') || '',
    portfolioStreams,
    recap,
    sectionCards,
    entityCards,
    // stage items manager: role-visible items that can be assigned to a مرحلة
    stageAssignItems: roleBase
      .filter((i) => agentifiable(i))
      .map((i) => ({
        id: i.id,
        title: i.title,
        typeLabel: typeLabelFor(i.type, i.path),
        // «للتحديد بعد الدراسة» counts as unplanned in the stage-planning modal
        batch: i.execBatch === TBD_BATCH ? '' : i.execBatch || '',
      })),
    // active مرحلة drill-down chip on portfolio pages
    listStream: filterStream,
    batchChip: batchFilter
      ? { label: batchFilter.replace(/^إطلاق /, ''), onClear: () => s.setBatchFilter(null) }
      : null,
    launchedCount: roleBase.filter((i) => devStatusOfItem(i) === 'launched').length,
    fundOptions,
    fundFilterValue: ui.fundFilter,
    batchFilterOptions,
    batchFilterValue: ui.batchFilter || 'all',
    entityRank,
    // entity rep, all-streams view: type counts expand to per-stream totals
    showStreamDist: rawRole === 'entity' && filterStream === 'all',
    showFundFilter: rawRole === 'entity',
    searchValue: ui.search,
    pathOptions,
    pathFilterValue: ui.navStream || ui.activePath,
    typeOptions,
    anyFilterActive,
    showEntFilter,
    entOptions,
    entFilterValue: ui.entFilter,
    // مراحل التنفيذ / خطة الإطلاق title-row filters
    execFilter: {
      ent: ui.execEnt,
      stream: ui.execStream,
      entOptions: [{ v: 'all', label: 'كل الجهات' }, ...entValues.map((e) => ({ v: e, label: e }))],
      streamOptions: [{ v: 'all', label: 'كل المسارات' }, ...PATHS.map((p) => ({ v: p.id, label: p.name }))],
      // filters per role: committee = entities + streams, stream head =
      // entities only, entity rep = streams only (their entity is fixed)
      showEnt: rawRole === 'ai' || rawRole === 'path',
      showStream: rawRole === 'ai' || rawRole === 'entity',
      // scope-info chips on launch cards/entries follow the same logic
      showStreamInfo: rawRole === 'ai' || rawRole === 'entity',
      showEntInfo: rawRole === 'ai' || rawRole === 'path',
      // «المسار» breakdown row in exec phase cards is only meaningful across streams
      // (committee spans all streams; an entity spans several within itself)
      showStreamBreak: rawRole === 'ai' || rawRole === 'entity',
      setEnt: (v: string) => s.setExecEnt(v),
      setStream: (v: string) => s.setExecStream(v),
    },
    showAddBtn,
    showTeamBulk,
    approveAllIds,
    // committee
    aiStats,
    entityRanking,
    // cards
    cards,
    // basket + fund bar
    basket,
    fundBarShow: false,
    fundSelCount: ui.fundSel.length,
    fundBarActionLabel: 'ترشيح للاعتماد',
    // coordinator bulk-assign bar + modal — re-selecting planned items reads as
    // a CHANGE, not a fresh assignment
    assignBar: {
      show: rawRole === 'coord' && ui.assignSel.length > 0,
      count: ui.assignSel.length,
      actionLabel: assignIsChange ? 'تغيير دفعة الإطلاق' : 'تعيين دفعة الإطلاق',
    },
    // coordinator draft selection: group send-for-approval with missing-data gate
    draftBar: (() => {
      const sel = s.items.filter((i) => ui.draftSel.includes(i.id) && wfOf(i) === 'draft');
      return {
        show: (rawRole === 'coord' || rawRole === 'path') && sel.length > 0,
        // فريق المسار: أزرار اعتماد/حذف بدل إرسال المنسق
        pathMode: rawRole === 'path',
        count: sel.length,
        items: sel.map((i) => ({
          id: i.id,
          title: i.title || 'بدون عنوان',
          missing: missingFieldsOf(i as unknown as Record<string, unknown>),
        })),
        anyMissing: sel.some((i) => missingFieldsOf(i as unknown as Record<string, unknown>).length > 0),
        onSend: () => s.submitDrafts(sel.map((i) => i.id)),
        onApproveSel: () => s.openApproveAll(sel.map((i) => i.id)),
        onDelete: () => s.openDeleteDrafts(sel.map((i) => i.id)),
        // multi-select: opens the first entry that still has missing fields
        onComplete: sel.length
          ? () => s.openDetail((sel.find((i) => missingFieldsOf(i as unknown as Record<string, unknown>).length > 0) || sel[0]).id)
          : null,
        onClear: () => s.clearDraftSel(),
      };
    })(),
    assignModal: ui.assign
      ? {
          batch: ui.assign.batch,
          isChange: assignIsChange,
          currentBatches: assignSelBatches,
          batchOptions: streamLaunchBatches(myPath).map((b) => ({
            name: b.name,
            label: (b.period ? b.name + ' · ' + b.period : b.name).replace(/^إطلاق /, ''),
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
    launchPlanMgr: streamLaunchBatches(rawRole === 'coord' || rawRole === 'path' ? myPath : null).map((b) => ({
      batch: b.name,
      period: b.period || '',
      plans: s.launchPlans
        .filter((p) => p.batch === b.name)
        .map((p) => ({
          ...p,
          // items that can be launched in this plan — non-agentifiable
          // (غير قابل) items carry no launch plan
          items: roleBase
            .filter((i) => (i.transformability || '') !== 'غير قابل')
            .map((i) => ({
            id: i.id,
            title: i.title,
            typeLabel: typeLabelFor(i.type, i.path),
            catLabel: i.path === 'ops' && i.opType ? i.opType : typeLabelFor(i.type, i.path),
            supportFn: i.supportFn || '',
            checked: (i.launchPlanIds || []).includes(p.id),
            otherBatch: !!i.execBatch && i.execBatch !== p.batch,
            launched: devStatusOfItem(i) === 'launched',
            // the item's own EXECUTION cost — editable inline in the manager
            budget: i.budget || '',
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
    confirmModal: ui.confirmModal,
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
  // simplified role statuses
  // «للتعديل» = returned for more info · «تم الرفض» = rejected outright
  if (f === 'rejected') return i.ret?.type === 'reject';
  if (f === 'review')
    return rawRole === 'coord' ? !!i.ret && i.ret.type !== 'reject' : ['pm1', 'pm2', 'ent2'].includes(w) || !!i.ret;
  if (f === 'approve') return w === 'ent1';
  if (f === 'inprog') return ['budget', 'exec', 'launch', 'done'].includes(w);
  // «مسودة» excludes returned entries — those show (and filter) as «للتعديل»
  if (f === 'draft') return w === 'draft' && !i.ret;
  return w === f;
}

// simplified delivery status; null = not yet in the delivery pipeline.
// «غير قابل للتحول» items never enter the pipeline — they count under
// غير قابل للتحول only, unless their transformability is changed.
function devStatusOfItem(i: Item): 'underDev' | 'developed' | 'launched' | null {
  if ((i.transformability || '') === 'غير قابل') return null;
  const w = wfOf(i);
  if (w === 'done') return 'launched';
  if (w === 'launch') return 'developed';
  if (w === 'budget' || w === 'exec') return 'underDev';
  return null;
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
    { key: 'all', label: 'جميع التصنيفات', optLabel: 'جميع التصنيفات' },
    { key: 'projinit', label: 'المشاريع / المبادرات', optLabel: 'المشاريع / المبادرات' },
  ];
  if (activePath === 'all' || streamHasType(activePath, 'operation'))
    defs.push({ key: 'operation', label: 'العمليات', optLabel: 'العمليات' });
  if (activePath === 'all' || streamHasType(activePath, 'service'))
    defs.push({ key: 'service', label: 'الخدمات الحكومية', optLabel: 'الخدمات الحكومية' });
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
  // approval is فريق عمل المسار's responsibility — the team can also approve
  // its own on-behalf uploaded drafts directly (even when incomplete)
  const canApprove =
    ((rawRole === 'path' || rawRole === 'entity') && w === 'ent1') ||
    (rawRole === 'path' && w === 'draft' && isTeamUpload(i));
  const isFunded = !!i.funded;
  // status chip mirrors the real lifecycle exactly:
  // مسودة → بحاجة إلى تعديل → بانتظار اعتماد ممثل الجهة → مخطط · المرحلة N → مكتمل
  const isReturned = !!i.ret;
  const batchShort = (i.execBatch || '').replace('إطلاق ', '');
  let wfLabel = wm.label;
  let wfChip = wm.chip;
  let wfBg = wm.bg;
  if (isReturned) {
    // rejected → red «تم الرفض»; more-info → amber «للتعديل»
    wfLabel = isRejected(i) ? REJECTED_STATUS : RETURNED_STATUS;
    wfChip = isRejected(i) ? '#C0303B' : '#B45309';
    wfBg = isRejected(i) ? '#FDECEE' : '#FFF3DE';
  } else if (w === 'exec' || w === 'launch' || w === 'done') {
    wfLabel = 'معتمد';
    wfChip = '#0B8A4B';
    wfBg = '#EAF7F0';
  }
  // nomination/selection checkbox removed for stream heads & committee
  const showSelectCheck = false;
  // every card shows an execution batch + (optional) launch plan
  const msNames = execMilestones();
  // only show the real batch — no synthetic fallback
  const batchLabel = i.execBatch || '';
  const named = (i.launches || []).filter((l) => (l.title || '').trim());
  const launchLabel = named.length
    ? named[0].title + (named.length > 1 ? ' (+' + (named.length - 1) + ')' : '')
    : '';

  const launchNames = (i.launchPlanIds || [])
    .map((pid) => (s.launchPlans.find((p) => p.id === pid)?.title || '').trim())
    .filter(Boolean);

  // ---- design-handover card state: (role, workflow) → status key + caption + action ----
  // status keys: draft|pendEnt|apprEnt|rejEnt|nominated|pendFund|apprFund|launched
  const recoBand: 'reco' | 'wait' = score.color === '#0B8A4B' ? 'reco' : 'wait';
  const recoPct = Math.round((score.v / 5) * 100);
  const isRet = !!i.ret;
  const nomByMe = !!i.nom && i.nom.by === myName;
  // committee-specific overrides (task: committee labels win for rawRole 'ai')
  let pillLabel = ''; // '' → component falls back to the generic status-pill label
  let recoStripLabel = recoBand === 'reco' ? 'موصى به للاعتماد · ' + recoPct + '%' : score.ar;
  let cardStatus:
    | 'draft'
    | 'pendEnt'
    | 'apprEnt'
    | 'rejEnt'
    | 'nominated'
    | 'pendFund'
    | 'apprFund'
    | 'launched';
  let cardCaption: string;
  let cardAction:
    | 'edit'
    | 'withdraw'
    | 'editResubmit'
    | 'viewDetails'
    | 'approveInfoReject'
    | 'nominate'
    | 'cancelNom'
    | 'fundTick'
    | 'fundApproveReject'
    | 'funded'
    | 'none';
  if (rawRole === 'coord') {
    if (w === 'draft' && isRet) {
      cardStatus = 'rejEnt';
      cardCaption = 'مرفوض — يتطلب تعديلاً';
      cardAction = 'editResubmit';
    } else if (w === 'draft') {
      cardStatus = 'draft';
      cardCaption = 'مسودة — قيد التعبئة';
      cardAction = 'edit';
    } else if (w === 'ent1') {
      cardStatus = 'pendEnt';
      cardCaption = 'بانتظار اعتماد فريق عمل المسار';
      cardAction = 'withdraw';
    } else if (isFunded) {
      cardStatus = 'apprFund';
      cardCaption = '';
      cardAction = 'viewDetails';
    } else if (w === 'done') {
      cardStatus = 'launched';
      cardCaption = 'تم الإطلاق';
      cardAction = 'viewDetails';
    } else {
      cardStatus = 'apprEnt';
      cardCaption = 'معتمد من الجهة';
      cardAction = 'viewDetails';
    }
  } else if (rawRole === 'entity') {
    if (w === 'draft' && isRet) {
      cardStatus = 'rejEnt';
      cardCaption = 'مرفوض من الجهة';
      cardAction = 'viewDetails';
    } else if (w === 'ent1') {
      cardStatus = 'pendEnt';
      cardCaption = 'بانتظار الاعتماد — إجراء مطلوب';
      cardAction = 'approveInfoReject';
    } else if (isFunded) {
      cardStatus = 'apprFund';
      cardCaption = '';
      cardAction = 'viewDetails';
    } else if (w === 'done') {
      cardStatus = 'launched';
      cardCaption = 'تم الإطلاق';
      cardAction = 'viewDetails';
    } else {
      cardStatus = 'apprEnt';
      cardCaption = 'معتمد — رُفع للأعلى';
      cardAction = 'viewDetails';
    }
  } else if (rawRole === 'path') {
    if (w === 'draft') {
      // مسودة لدى الجهة (غالباً من رفع بالنيابة) — الفريق يعتمدها أو يعيدها
      cardStatus = 'draft';
      cardCaption = 'مسودة لدى الجهة — يمكن اعتمادها أو إعادتها';
      cardAction = 'approveInfoReject';
    } else if (w === 'ent1') {
      // pending review: the head/deputy approves or requests more information
      cardStatus = 'pendFund';
      cardCaption = '';
      cardAction = 'approveInfoReject';
    } else if (w === 'done') {
      cardStatus = 'launched';
      cardCaption = 'تم الإطلاق';
      cardAction = 'viewDetails';
    } else {
      cardStatus = 'apprFund';
      cardCaption = '';
      cardAction = 'viewDetails';
    }
  } else {
    // rawRole === 'ai' — اللجنة الوطنية للذكاء الاصطناعي المساعد: view-only over
    // entries approved by the stream heads
    if (w === 'done') {
      cardStatus = 'launched';
      cardCaption = 'تم الإطلاق';
      cardAction = 'viewDetails';
    } else {
      cardStatus = 'apprFund';
      cardCaption = '';
      cardAction = 'viewDetails';
    }
  }

  return {
    id: i.id,
    // design-handover card state
    cardStatus,
    cardCaption,
    cardAction,
    // committee: item already past funding approval (funded or launched) →
    // its selection box is a locked, gray, checked, non-clickable mark
    fundLocked: false,
    recoBand,
    pillLabel,
    recoStripLabel,
    title: i.title,
    desc: [i.sector, i.dept].filter(Boolean).join(' · ') || stripHtml(i.desc || ''),
    launchNames,
    stageMoved: !!i.stageMove,
    typeLabel: typeLabelFor(i.type, i.path),
    // ops entries classify by opType; the support function gets its own column
    catLabel: i.path === 'ops' && i.opType ? i.opType : typeLabelFor(i.type, i.path),
    supportFn: i.supportFn || '',
    axis: i.axis || '',
    subService: i.subService || '',
    // computed أولوية الاختيار — distinct values across the entry's activities
    prioLabel: (() => {
      const acts = itemActivities(i);
      if (i.path === 'strategy') {
        const cats = (acts.length ? acts.map((a) => stgPriority(a)?.cat || '') : [stgPriority(i)?.cat || '']).filter(Boolean);
        return Array.from(new Set(cats)).join('، ');
      }
      if (i.type === 'service') {
        const prs = (acts.length
          ? acts.map((a) => svcPriority(a.usageIntensity, a.complexity, a.readinessLevel))
          : [svcPriority(i.usageIntensity, i.complexity, i.readinessLevel)]
        ).filter((p): p is 1 | 2 | 3 | 4 => p != null);
        const uniq = Array.from(new Set(prs)).sort();
        return uniq.length ? 'الأولوية ' + uniq.join('، ') : '';
      }
      return '';
    })(),
    typeColor: t.color,
    typeBg: t.bg,
    pathName: p.name,
    pathColor: p.color,
    // stream is already shown once in the footer dot-row — no separate «المسار: …» line
    showPathLine: false,
    approval: i.approval,
    apprBg: appr.bg,
    apprColor: appr.c,
    wfLabel,
    wfChip,
    wfBg,
    isReturned: rawRole === 'coord' && !!i.ret,
    retBannerLabel: isRejected(i) ? 'سبب الرفض من فريق عمل المسار' : 'ملاحظات فريق عمل المسار',
    retNote: i.ret ? i.ret.note || (i.ret.type === 'info' ? 'طُلبت تفاصيل إضافية' : 'لم يُذكر سبب') : '',
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
    // committee can approve a pending nomination straight from the card
    canFundNom: rawRole === 'ai' && !!i.nom && !i.funded,
    onFundNom: () => s.fundItem(i.id, !!i.nom?.direct),
    showSelectCheck,
    fundChecked: s.ui.fundSel.includes(i.id),
    fundCheckBorder: s.ui.fundSel.includes(i.id) ? '#2563EB' : '#C7D1E2',
    fundCheckBg: s.ui.fundSel.includes(i.id) ? '#2563EB' : '#fff',
    // execution batch + launch plan meta (shown on every card)
    batchLabel,
    launchLabel,
    // coordinator bulk-assign checkbox
    showAssignCheck: rawRole === 'coord',
    // الاختيار الجماعي للمسودات: المنسق (للإرسال/الحذف)، وفريق المسار
    // لمسودات رفعه بالنيابة فقط (للاعتماد/الحذف)
    showDraftCheck:
      (ctx.rawRole === 'coord' || (ctx.rawRole === 'path' && isTeamUpload(i))) && wfOf(i) === 'draft',
    draftChecked: s.ui.draftSel.includes(i.id),
    onToggleDraftSel: () => s.toggleDraftSel(i.id),
    missingCount: wfOf(i) === 'draft' ? missingFieldsOf(i as unknown as Record<string, unknown>).length : 0,
    assignChecked: s.ui.assignSel.includes(i.id),
    onToggleAssignSel: () => s.toggleAssignSel(i.id),
    nomBy: i.nom?.by || '',
    nomStream: i.nom ? pathById(i.nom.path || i.path).name : '',
    // unified nomination badge — drop person names; show the FULL stream name.
    // (committee spec: «مرشحة للجنة الوطنية · [اسم المسار الكامل]»)
    nomLabel:
      rawRole === 'path'
        ? 'مُرشّح للاعتماد'
        : 'مرشحة للجنة الوطنية · ' + pathById(i.nom?.path || i.path).name,
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
    // منسق الجهة يزيل أي مدخل من مدخلاته ما لم يكن معتمداً
    canDelete: rawRole === 'coord' && (w === 'draft' || w === 'ent1'),
    onDelete: () => s.deleteItem(i.id),
    onWithdrawToDraft: () => s.withdrawToDraft(i.id),
    onReqInfo: () => s.reqInfoItem(i.id),
    onReject: () => s.rejectItem(i.id),
    onPathCta: () => s.openDetail(i.id),
    onToggleFundSel: () => s.toggleFundSel(i.id),
    onNominate: () => s.nominateItem(i.id),
    onWithdrawNom: () => s.withdrawNom(i.id),
    onDeclineNom: () => s.declineNom(i.id),
    onCancelFund: () => s.openCancelFund(i.id),
  };
}

function pathCta(w: string, ret: boolean): string {
  if (w === 'draft') return ret ? 'تعديل المدخل وإعادة إرساله' : 'إكمال وإرسال';
  return 'عرض التفاصيل';
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
    mail?: boolean;
    onOpen: () => void;
  }[] = [];
  const push = (id: string, kind: string, icon: string, title: string, sub: string, itemId?: string, act?: boolean) => {
    const k = NK[kind] || NK.info;
    // main workflow notifications (approval, return, pending, batch moves) are
    // also emailed automatically — flagged so the UI shows the mail badge
    const mail = /^(ent1|x|r|sm|pl)/.test(id);
    rows.push({ id, kind, iconBg: k.bg, iconColor: k.c, icon: NIC[icon], title, sub, act, mail, onOpen: () => (itemId ? s.openNotifItem(itemId) : s.toggleNotifs()) });
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
    const tl = typeLabelFor(i.type, i.path);
    if (rawRole === 'path') {
      // فريق عمل المسار: مدخلات بانتظار اعتماد المحتوى — بأزرار قرار مباشرة
      if (w === 'ent1') push('ent1-' + i.id, 'info', 'inbox', typeLabelDefFor(i.type, i.path) + ' بانتظار اعتمادك', tl + ' · ' + i.title + ' · ' + ent(i), i.id, true);
      // توزيعات معلّقة بانتظار قراره — صف لكل توزيع، يزول فور البتّ فيه
      itemActivities(i).forEach((a, ai) => {
        if (placementState(i, a) === 'pending')
          push(
            'pl-' + i.id + '-' + ai,
            'info',
            'rotate',
            'توزيع بانتظار اعتمادك على ' + batchDafaaLabel(activityBatch(i, a)),
            tl + ' · ' + (a.name || i.title) + ' · ' + ent(i),
            i.id
          );
      });
      if (i.stageMove && i.stageMove.from)
        push('sm-' + i.id, 'info', 'rotate', 'نُقل بين دفعات الإطلاق: من ' + i.stageMove.from + ' إلى ' + i.stageMove.to, tl + ' · ' + i.title + ' · بواسطة ' + i.stageMove.by, i.id);
    } else if (rawRole === 'coord') {
      // coordinator: returns / info requests from the stream head, and approvals
      if (i.ret) push('r-' + i.id, 'alert', 'rotate', (i.ret.type === 'info' ? 'طلب تفاصيل إضافية من ' : 'تم الرفض من ') + (i.ret.from || 'فريق عمل المسار في المشروع'), tl + ' · ' + i.title + (i.ret.note ? ' · ' + i.ret.note : ''), i.id);
      if (w === 'exec' || w === 'launch') push('x-' + i.id, 'ok', 'check', 'اعتمد فريق عمل المسار ' + typeLabelDefFor(i.type, i.path), tl + ' · ' + i.title, i.id);
      // قرارات فريق العمل على توزيعات الدفعات
      itemActivities(i).forEach((a, ai) => {
        const st = placementState(i, a);
        if (st === 'approved')
          push('pla-' + i.id + '-' + ai, 'ok', 'check', 'تم اعتماد التوزيع على ' + batchDafaaLabel(activityBatch(i, a)), tl + ' · ' + (a.name || i.title), i.id);
        else if (st === 'draft' && a.batchRet)
          push(
            'plr-' + i.id + '-' + ai,
            'alert',
            'rotate',
            (a.batchRet === 'reject' ? 'تم رفض التوزيع على ' : 'أُعيد التوزيع للتعديل — ') + batchDafaaLabel(activityBatch(i, a)),
            tl + ' · ' + (a.name || i.title) + (a.batchNote ? ' · ' + a.batchNote : ''),
            i.id
          );
      });
    } else if (rawRole === 'ai') {
      // committee chair + secretariat (view-only): newly approved entries
      if (w === 'exec' || w === 'launch') push('x-' + i.id, 'info', 'send', typeLabelDefFor(i.type, i.path) + ' معتمد من فريق عمل المسار', tl + ' · ' + i.title + ' · ' + ent(i), i.id);
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
  const parseB = (b?: string) => {
    const n = parseInt((b || '').replace(/[^\d]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  };
  // a nomination raised by the committee itself (vs by a stream head)
  const isComNom = (i: Item) =>
    !!i.nom && (!!i.nom.direct || i.nom.role === 'اللجنة الوطنية' || i.nom.by === 'اللجنة الوطنية');

  const mk = (i: Item) => {
    const cost = parseB(i.budget);
    const nomName = i.nom?.by || i.funded?.by || '';
    const byCommittee = nomName === 'اللجنة الوطنية' || isComNom(i) || !!i.funded?.direct;
    return {
      id: i.id,
      title: i.title,
      typeLabel: typeLabelFor(i.type, i.path),
      entity: ent(i),
      pathName: pathById(i.path).name,
      costLabel: cost > 0 ? formatMoney(cost) : '—',
      nomName,
      // unified badge — no person names (names live in the item detail only)
      nomByLine: byCommittee
        ? 'مرشحة للجنة الوطنية · ' + pathById(i.path).name
        : 'مرشحة من فريق عمل المسار · ' + pathById(i.path).name,
      approved: !!i.funded,
      onOpen: () => s.openDetail(i.id),
      onApprove: () => s.fundItem(i.id, isComNom(i)),
      onDecline: () => s.declineNom(i.id),
      onWithdraw: () => s.withdrawNom(i.id),
    };
  };

  const headsSrc = s.items.filter((i) => i.nom && !i.funded && !isComNom(i));
  const comSrc = s.items.filter((i) => i.nom && !i.funded && isComNom(i));
  const appSrc = s.items.filter((i) => i.funded);
  const myNomsSrc = s.items.filter((i) => i.nom && !i.funded && i.nom.by === myName);
  const myAppSrc = s.items.filter((i) => i.funded && i.nom && i.nom.by === myName);

  const active = s.ui.basketTab;
  const tabs = isCom
    ? [
        { id: 'heads' as const, label: 'مرشح من قبل رؤساء المسارات', count: headsSrc.length },
        { id: 'committee' as const, label: 'مرشح من قبل اللجنة الوطنية', count: comSrc.length },
        { id: 'approved' as const, label: 'معتمد', count: appSrc.length },
      ]
    : [
        { id: 'heads' as const, label: 'ترشيحاتي', count: myNomsSrc.length },
        { id: 'approved' as const, label: 'المعتمدة', count: myAppSrc.length },
      ];
  const srcMap: Record<string, Item[]> = isCom
    ? { heads: headsSrc, committee: comSrc, approved: appSrc }
    : { heads: myNomsSrc, committee: [], approved: myAppSrc };
  const items = (srcMap[active] || srcMap.heads).map(mk);

  // budget block — spent = committee-approved funding cost, live from data
  const fundedTotal = appSrc.reduce((a, i) => a + parseB(i.budget), 0);
  const remaining = Math.max(0, APPROVED_BUDGET - fundedTotal);
  const pct = APPROVED_BUDGET ? Math.min(100, Math.round((fundedTotal / APPROVED_BUDGET) * 100)) : 0;

  return {
    isCommittee: isCom,
    title: isCom ? 'سلة اللجنة الوطنية' : 'سلة الترشيحات',
    subtitle: isCom
      ? 'الترشيحات الواردة من رؤساء المسارات واللجنة وما تم اعتماده'
      : 'ما رشّحته لاعتماد اللجنة الوطنية',
    tabs,
    tab: active,
    items,
    activeIsApproved: active === 'approved',
    showBudget: isCom,
    budget: {
      approvedLabel: formatMoney(APPROVED_BUDGET),
      remainingLabel: formatMoney(remaining),
      pct,
    },
    pendingCount: isCom ? headsSrc.length + comSrc.length : myNomsSrc.length,
    fundedTotalLabel: fundedTotal.toLocaleString('en-US') + ' درهم',
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
  const canApproveGate = (rawRole === 'path' || rawRole === 'entity') && w === 'ent1';
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
    typeLabel: typeLabelFor(i.type, i.path),
    typeColor: t.color,
    typeBg: t.bg,
    // same status override as the list cards: returned → للتعديل، approved → معتمد
    wfLabel: i.ret ? (isRejected(i) ? REJECTED_STATUS : RETURNED_STATUS) : ['exec', 'launch', 'done'].includes(w) ? 'معتمد' : wm.label,
    wfChip: i.ret ? (isRejected(i) ? '#C0303B' : '#B45309') : ['exec', 'launch', 'done'].includes(w) ? '#0B8A4B' : wm.chip,
    wfBg: i.ret ? (isRejected(i) ? '#FDECEE' : '#FFF3DE') : ['exec', 'launch', 'done'].includes(w) ? '#EAF7F0' : wm.bg,
    priority: i.priority,
    // services follow the matrix — no manual ترتيب/أولوية chips
    rankLabel: i.type === 'service' ? '' : i.rank ? String(i.rank) : '',
    complexity: i.complexity,
    endDateFmt: fmtDate(i.endDate),
    isReturned: rawRole === 'coord' && !!i.ret,
    retBannerLabel: isRejected(i) ? 'سبب الرفض من فريق عمل المسار' : 'ملاحظات فريق عمل المسار',
    retFrom: i.ret?.from || '',
    retNote: i.ret?.note || '',
    // committee-funding banner removed from the flow — never shown
    dFunded: false,
    dFundedText: '',
    isProj: i.type === 'project' || i.type === 'initiative',
    isOp: i.type === 'operation',
    isSvc: i.type === 'service',
    // project fields
    expectedOutputs: i.expectedOutputs,
    expectedOutcomes: i.expectedOutcomes,
    expectedImpact: i.expectedImpact,
    aiModels: i.aiModels,
    agentNature: i.agentNature,
    targetPct: i.targetPct,
    transformability: i.transformability,
    transformPriority: i.transformPriority,
    readiness: i.readiness,
    // op fields
    opType: i.opType,
    supportFn: i.supportFn || '',
    opWordDef: typeLabelDefFor('operation', i.path),
    linkedToService: i.linkedToService,
    linkedServiceName: i.linkedServiceName,
    usageIntensity: i.usageIntensity,
    subActivities: i.subActivities,
    automationLevel: i.automationLevel,
    automationPct: i.automationPct,
    automationSystem: i.automationSystem,
    complexityLevel: i.complexityLevel,
    durationBefore: i.durationBefore,
    durationAfter: i.durationAfter,
    sector: i.sector,
    dept: i.dept,
    section: i.section,
    itemEntityName: entOf(i, s.entityName),
    // svc fields
    subService: i.subService,
    readinessLevel: i.readinessLevel,
    transformYes: i.transformYes,
    isStgTask: i.type === 'operation' && i.path === 'strategy',
    isOpsTask: i.type === 'operation' && i.path === 'ops',
    isAutomated: i.isAutomated,
    notesText: i.notes,
    axis: i.axis,
    importance: i.importance,
    impactScore: i.impactScore,
    transformScore: i.transformScore,
    outputClarity: i.outputClarity,
    riskLevel: i.riskLevel,
    stgCalc: i.type === 'operation' && i.path === 'strategy' ? stgPriority(i) : null,
    svcSelPriority: i.type === 'service' ? svcPriority(i.usageIntensity, i.complexity, i.readinessLevel) : null,
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
      execMilestones(i.path).find((b) => b.name === i.execBatch)?.period || '',
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
    editLabel: isDraftForCoord ? 'استكمال البيانات وإعادة الإرسال' : 'تعديل',
    // handlers
    onClose: () => s.closeDetail(),
    onApprove: () => s.approveItem(i.id),
    onReqInfo: () => s.reqInfoItem(i.id),
    onReject: () => s.rejectItem(i.id),
    onEdit: () => s.editItem(i.id),
    // إزالة المدخل من داخل التفاصيل — ما لم يكن معتمداً
    canDelete: rawRole === 'coord' && (w === 'draft' || w === 'ent1'),
    onDelete: () => s.deleteItem(i.id),
    onToggleMenu: () => s.toggleDActionMenu(),
    onScopeWork: (v: string) => s.detailField(i.id, 'scopeOfWork', v),
    onBudget: (v: string) => s.detailField(i.id, 'budget', v),
    onSubmitScope: () => s.submitScope(i.id),
    onDownloadScope: () => s.toast('جاري تحميل المرفق…'),
    onGoLaunch: () => s.goToLaunch(i.id),
    onFinishLaunch: () => s.finishLaunch(i.id),
    // simplified 3-state delivery status
    isAgentifiable: (i.transformability || '') !== 'غير قابل',
  };
}

function buildLogRows(i: Item) {
  // Displayed action text (mirrors the design's actLabel()).
  const actLabel = (e: { action: string; role?: string }): string => {
    if (e.action === 'submit') return 'تم إرسال المدخل للاعتماد';
    if (e.action === 'approve') return 'تم الاعتماد من ' + (e.role || '');
    if (e.action === 'pending') return 'قيد الاعتماد لدى ' + (e.role || '');
    if (e.action === 'reject') return 'رفض';
    if (e.action === 'info') return 'طلب تفاصيل إضافية';
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
      rows.push({ action: actLabel({ action: 'approve', role: 'فريق عمل المسار في المشروع' }), color: ALOG.approve.c, sub: fmtDateTime(t.approvedAt), note: '', hasNote: false });
    else if (w === 'ent1')
      rows.push({ action: actLabel({ action: 'pending', role: 'فريق عمل المسار في المشروع' }), color: ALOG.pending.c, sub: fmtDateTime(t.submittedAt), note: '', hasNote: false });
    rows.push({ action: actLabel({ action: 'submit' }), color: ALOG.submit.c, sub: 'منسق المسار في الجهة · ' + fmtDateTime(t.submittedAt), note: '', hasNote: false });
  }
  return rows;
}

// add-panel title lists the types the chosen stream actually offers
function addTitleFor(p: string): string {
  // title mirrors the stream's actual types: خدمات / مهام / عمليات
  const parts = availTypes(p).map((t) => (t.key === 'service' ? 'خدمات' : p === 'strategy' ? 'مهام' : 'عمليات'));
  return 'إضافة ' + parts.join(' أو ');
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
    ({ project: 'بيانات المشروع', initiative: 'بيانات المبادرة', operation: 'بيانات ' + typeLabelDefFor('operation', path), service: 'بيانات الخدمة' } as Record<string, string>)[type] ||
    'البيانات العامة';
  const step2Title =
    ({ project: 'تقييم المشروع', initiative: 'تقييم المبادرة', operation: 'تقييم ' + typeLabelDefFor('operation', path), service: 'تقييم الخدمة' } as Record<string, string>)[type] ||
    'التقييم والأولوية';
  // per-type stepper labels (fallback to generic when no type yet)
  const step1Label =
    ({ project: 'بيانات المشروع', initiative: 'بيانات المبادرة', operation: 'بيانات ' + typeLabelDefFor('operation', path), service: 'بيانات الخدمة' } as Record<string, string>)[type] ||
    'البيانات';
  const step2Label =
    ({ project: 'تقييم المشروع', initiative: 'تقييم المبادرة', operation: 'تقييم ' + typeLabelDefFor('operation', path), service: 'تقييم الخدمة' } as Record<string, string>)[type] ||
    'التقييم';
  // services stream: a single-step form (exactly the approved field set)
  const isStgTaskForm = type === 'operation' && path === 'strategy';
  const isOpsForm = type === 'operation' && path === 'ops';
  const fLabels = type === 'service' ? ['بيانات الخدمة'] : isStgTaskForm ? ['بيانات المهمة'] : isOpsForm ? ['بيانات العملية'] : [step1Label, step2Label, 'النتائج المتوقعة', 'نطاق العمل والتكلفة المتوقعة', 'البرنامج الزمني'];
  const fTitles = type === 'service' ? ['بيانات الخدمة'] : isStgTaskForm ? ['بيانات المهمة'] : isOpsForm ? ['بيانات العملية'] : [step1Title, step2Title, 'النتائج المتوقعة', 'نطاق العمل والتكلفة المتوقعة', 'البرنامج الزمني'];
  const fHints = [
    'ابدأ بالمعلومات الأساسية',
    'حدّد الأولوية وقابلية التحول',
    'النتائج والأثر المستهدف',
    'نطاق العمل والتكلفة المتوقعة والمرفقات',
    'اختر مرحلة التنفيذ والإطلاق',
  ];
  return {
    mStep: ui.mStep,
    createTitle: ui.editingId ? 'تعديل ' + typeLabelDefFor(type, path) : mPathName ? addTitleFor(draft?.path || path) : 'إضافة جديدة',
    // «operation» reads as «مهمة» in the strategy stream (definite form for labels)
    opWordDef: typeLabelDefFor('operation', path),
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
    mIsStgTask: isStgTaskForm,
    mIsOpsForm: isOpsForm,
    axesOptions: STRATEGY_AXES,
    stgCalc: isStgTaskForm && draft ? stgPriority(draft) : null,
    mIsProjectish: type === 'project' || type === 'initiative',
    mTypeLabel,
    fLabels,
    fHints,
    fStepTitle: fTitles[ui.fStep - 1] || '',
    fStepHint: fHints[ui.fStep - 1] || '',
    fNextLabel: ui.fStep >= fLabels.length ? 'إرسال للاعتماد' : 'التالي',
    // أولوية الاختيار — live matrix result while filling the services form
    // >0 → the form highlights the required fields left empty
    reqHighlight: ui.reqHighlight,
    svcSelPriority: type === 'service' ? svcPriority(draft?.usageIntensity, draft?.complexity, draft?.readinessLevel) : null,
    svcExcluded: false,
    // execution batches (البرنامج الزمني) + centrally-managed launch plans
    batchOptions: [
      ...streamLaunchBatches(path).map((b) => ({
        name: b.name,
        label: (b.period ? b.name + ' · ' + b.period : b.name).replace(/^إطلاق /, ''),
      })),
      { name: TBD_BATCH, label: TBD_BATCH },
    ],
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
    bulkReviewCount: ui.bulkRows.filter((r) => r._v === 'بيانات ناقصة').length,
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
