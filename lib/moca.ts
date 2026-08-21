// ============================================================================
// نسخة وزارة شؤون مجلس الوزراء — وحدة مستقلة تماماً
// ----------------------------------------------------------------------------
// هذه الوحدة خاصة بوزارة شؤون مجلس الوزراء وحدها، ولا تشترك في أي حالة أو
// منطق مع منصة الجهات الاتحادية (lib/domain.ts · lib/store.ts · lib/viewModel.ts).
// الفروق الجوهرية:
//   • لا مسارات — التنظيم بالجهات والقطاعات الداخلية للوزارة.
//   • حقول الإدخال هي أعمدة ملف «حصر المهام والعمليات» حرفياً (19 عموداً).
//   • الاعتماد يذهب مباشرة إلى اللجنة الوطنية للذكاء الاصطناعي المساعد.
// ============================================================================

// ---- 1. الجهات والقطاعات داخل الوزارة --------------------------------------
export type MocaUnit = { id: string; name: string; sectors?: string[] };

export const MOCA_UNITS: MocaUnit[] = [
  { id: 'sg', name: 'الأمانة العامة لمجلس الوزراء' },
  {
    id: 'pmo',
    name: 'مكتب رئاسة مجلس الوزراء',
    sectors: [
      'قطاع الاستراتيجية والابتكار',
      'قطاع الأداء والتميز الحكومي',
      'قطاع الخدمات الحكومية',
      'قطاع العلاقات الدولية',
      'بناء القدرات وإدارة المواهب',
      'القمة العالمية للحكومات',
    ],
  },
  { id: 'media', name: 'المكتب الإعلامي لحكومة دولة الإمارات' },
  { id: 'knowledge', name: 'مكتب التبادل المعرفي الحكومي' },
  { id: 'future', name: 'مكتب التطوير الحكومي والمستقبل' },
  { id: 'fcsc', name: 'المركز الاتحادي للتنافسية والإحصاء' },
  { id: 'central', name: 'قطاع الخدمات المركزية' },
  { id: 'governance', name: 'قطاع الحوكمة والرقابة المالية' },
  { id: 'dubai', name: 'المكتب التنفيذي - دبي' },
];

export const MOCA_MINISTRY = 'وزارة شؤون مجلس الوزراء';

export const mocaUnitById = (id: string): MocaUnit =>
  MOCA_UNITS.find((u) => u.id === id) || MOCA_UNITS[0];

/** كل خيارات «الجهة أو المكتب» — الوحدة، ومعها قطاعاتها إن وُجدت */
export const mocaUnitOptions = (): { unitId: string; sector: string; label: string }[] => {
  const out: { unitId: string; sector: string; label: string }[] = [];
  for (const u of MOCA_UNITS) {
    if (u.sectors?.length) {
      for (const s of u.sectors) out.push({ unitId: u.id, sector: s, label: `${u.name} — ${s}` });
    } else {
      out.push({ unitId: u.id, sector: '', label: u.name });
    }
  }
  return out;
};

export const mocaScopeLabel = (unitId: string, sector?: string): string => {
  const u = mocaUnitById(unitId);
  return sector ? `${u.name} — ${sector}` : u.name;
};

// ---- 2. خيارات القوائم المنسدلة (ورقة «المعادلات» في الملف) -----------------
export const MOCA_SPECIALIZATION = ['تخصصية', 'مشتركة'];

export const MOCA_TRANSFORMABILITY = ['قابل كلياً', 'قابل جزئياً', 'غير قابل للتحول'];
export const MOCA_NOT_TRANSFORMABLE = 'غير قابل للتحول';

export const MOCA_READINESS = [
  'الجاهزية للتحول بنسبة 80% فأكثر',
  'الجاهزية للتحول بنسبة بين 50% إلى 80%',
  'الجاهزية للتحول بنسبة بين 30% إلى 50%',
  'الجاهزية للتحول بنسبة 30% فأقل',
];

export const MOCA_PRIORITY = ['نعم', 'لا'];
export const MOCA_IMPACT = ['عالي', 'متوسط', 'منخفض'];
export const MOCA_COMPLEXITY = ['عالي', 'متوسط', 'منخفض'];

// ---- 3. الحقول — أعمدة الملف حرفياً وبالترتيب نفسه --------------------------
export type MocaFieldType = 'text' | 'longtext' | 'select' | 'percent';

export type MocaField = {
  key: string;
  /** عنوان العمود كما هو في ملف الحصر */
  label: string;
  group: 'general' | 'automation' | 'transform';
  type: MocaFieldType;
  options?: string[];
  required?: boolean;
  hint?: string;
};

export const MOCA_GROUPS: { key: MocaField['group']; label: string }[] = [
  { key: 'general', label: 'البيانات العامة' },
  { key: 'automation', label: 'بيانات الأتمتة والكثافة والحجم' },
  { key: 'transform', label: 'التحول للذكاء الاصطناعي المساعد' },
];

export const MOCA_FIELDS: MocaField[] = [
  // البيانات العامة
  { key: 'mainProcess', label: 'العملية والمهمة الرئيسية', group: 'general', type: 'text', required: true },
  { key: 'subProcess', label: 'العملية والمهمة الفرعية', group: 'general', type: 'text', required: true },
  { key: 'outputs', label: 'المخرجات من العملية الفرعية', group: 'general', type: 'longtext', required: true },
  { key: 'beneficiary', label: 'الفئة المستفيدة من العملية والمهمة الفرعية', group: 'general', type: 'text', required: true },
  { key: 'specialization', label: 'هل تعتبر تخصصية أو مشتركة؟', group: 'general', type: 'select', options: MOCA_SPECIALIZATION, required: true },
  { key: 'sector', label: 'القطاع المعني', group: 'general', type: 'text', required: true },
  { key: 'dept', label: 'الإدارة المعنية', group: 'general', type: 'text', required: true },
  { key: 'section', label: 'القسم المعني', group: 'general', type: 'text', required: true },
  // بيانات الأتمتة والكثافة والحجم
  { key: 'automationPct', label: 'ما هي نسبة الأتمتة الحالية للعملية والمهمة؟', group: 'automation', type: 'percent', required: true, hint: 'نسبة مئوية من 0 إلى 100' },
  { key: 'automationSystem', label: 'ما هو نظام الأتمتة؟', group: 'automation', type: 'text' },
  { key: 'usageIntensity', label: 'كثافة الاستخدام', group: 'automation', type: 'text', required: true },
  { key: 'frequency', label: 'معدل تكرار العملية المنفذة', group: 'automation', type: 'text', required: true, hint: 'شهرياً، سنوياً، كل سنتين… الخ' },
  { key: 'duration', label: 'المدة الزمنية المستغرقة لإنجاز المهمة أو العملية الفرعية', group: 'automation', type: 'text', required: true, hint: 'بالساعات أو بالأيام' },
  // التحول للذكاء الاصطناعي المساعد
  { key: 'transformability', label: 'القابلية للتحول للذكاء الاصطناعي المساعد', group: 'transform', type: 'select', options: MOCA_TRANSFORMABILITY, required: true },
  { key: 'readiness', label: 'الجاهزية للتحول للذكاء الاصطناعي المساعد', group: 'transform', type: 'select', options: MOCA_READINESS, required: true },
  { key: 'priority', label: 'أولوية التحول للذكاء الاصطناعي المساعد', group: 'transform', type: 'select', options: MOCA_PRIORITY, required: true },
  { key: 'impact', label: 'مستوى الأثر المتوقع من التحول', group: 'transform', type: 'select', options: MOCA_IMPACT, required: true },
  { key: 'complexity', label: 'تقييم مستوى التعقيد', group: 'transform', type: 'select', options: MOCA_COMPLEXITY, required: true },
  { key: 'notes', label: 'الملاحظات', group: 'transform', type: 'longtext' },
];

/** عناوين الأعمدة كما تُكتب في ملف Excel (بالترتيب) */
export const MOCA_EXCEL_HEADERS: string[] = [
  'العملية والمهمة الرئيسية',
  'العملية والمهمة الفرعية',
  'المخرجات من العملية الفرعية ',
  'الفئة المستفيدة من العملية والمهمة الفرعية',
  'هل تعتبر تخصصية أو مشتركة؟',
  'القطاع المعني',
  'الإدارة المعنية',
  'القسم المعني',
  'ما هي نسبة الأتمتة الحالية للعملية والمهمة؟',
  'ما هو نظام الأتمتة؟',
  'كثافة الاستخدام',
  'معدل تكرار العملية المنفذة \n(شهرياً، سنوياً، كل سنتين. الخ)',
  'المدة الزمنية المستغرقة لإنجاز المهمة أو العملية الفرعية \n(بالساعات أو بالأيام)',
  'القابلية للتحول للذكاء الاصطناعي المساعد',
  'الجاهزية  للتحول للذكاء الاصطناعي المساعد',
  'أولوية التحول  للذكاء الاصطناعي المساعد',
  'مستوى الأثر المتوقع من التحول',
  'تقييم مستوى التعقيد',
  'الملاحظات',
];

/** مجموعات الأعمدة في صف العناوين العلوي (يطابق دمج الخلايا في الملف) */
export const MOCA_EXCEL_GROUPS: { label: string; span: number }[] = [
  { label: 'البيانات العامة', span: 8 },
  { label: 'بيانات الأتمتة والكثافة والحجم', span: 5 },
  { label: 'التحول للذكاء الاصطناعي المساعد', span: 6 },
];

// ---- 4. المدخل وحالته -------------------------------------------------------
/**
 * دورة الاعتماد في نسخة الوزارة — خطوة واحدة:
 *   مسودة ──► قيد اعتماد اللجنة الوطنية ──► معتمد
 *                                     └──► للتعديل / تم الرفض (تعود للمنسق)
 */
export type MocaWf = 'draft' | 'pending' | 'approved';
export type MocaReturn = { type: 'info' | 'reject'; note: string; at: string } | null;

export type MocaEntry = {
  id: string;
  unitId: string;
  /** القطاع داخل الوحدة إن وُجد */
  unitSector: string;
  wf: MocaWf;
  ret: MocaReturn;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  createdBy?: string;
  // التوزيع على دفعات الإطلاق — للمدخل المعتمد فقط
  execBatch?: string;
  startDate?: string;
  endDate?: string;
  batchWf?: 'draft' | 'pending' | 'approved';
  batchRet?: 'info' | 'reject';
  batchNote?: string;
} & Record<string, unknown>;

export const MOCA_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'مسودة', color: '#5A6B86', bg: '#EEF2F8' },
  pending: { label: 'قيد اعتماد اللجنة الوطنية', color: '#B45309', bg: '#FFF7EB' },
  approved: { label: 'معتمد', color: '#0B8A4B', bg: '#EAF7F0' },
  info: { label: 'للتعديل', color: '#B45309', bg: '#FFF3DE' },
  reject: { label: 'تم الرفض', color: '#C0303B', bg: '#FDECEE' },
};

export const mocaStatusOf = (e: MocaEntry): { label: string; color: string; bg: string } => {
  if (e.ret) return MOCA_STATUS[e.ret.type === 'reject' ? 'reject' : 'info'];
  return MOCA_STATUS[e.wf] || MOCA_STATUS.draft;
};

export const mocaIsRejected = (e: MocaEntry): boolean => e.ret?.type === 'reject';

/** الحقول المطلوبة الناقصة — تُستخدم قبل الإرسال وفي مراجعة الرفع */
export function mocaMissing(e: Partial<MocaEntry>): string[] {
  const out: string[] = [];
  for (const f of MOCA_FIELDS) {
    if (!f.required) continue;
    // «غير قابل للتحول» يُلغي الحاجة إلى الجاهزية والأثر
    if (blockedByTransformability(f.key, e)) continue;
    const v = e[f.key];
    if (v === undefined || v === null || String(v).trim() === '') out.push(f.label);
  }
  return out;
}

/** عند «غير قابل للتحول» تُعطَّل الجاهزية والأثر المتوقع وتُحتسب صفراً */
export function blockedByTransformability(key: string, e: Partial<MocaEntry>): boolean {
  if (key !== 'readiness' && key !== 'impact') return false;
  return String(e.transformability || '') === MOCA_NOT_TRANSFORMABLE;
}

// ---- 5. الاحتساب ------------------------------------------------------------
const READINESS_SCORE: Record<string, number> = {
  'الجاهزية للتحول بنسبة 80% فأكثر': 4,
  'الجاهزية للتحول بنسبة بين 50% إلى 80%': 3,
  'الجاهزية للتحول بنسبة بين 30% إلى 50%': 2,
  'الجاهزية للتحول بنسبة 30% فأقل': 1,
};
const TRANSFORM_SCORE: Record<string, number> = { 'قابل كلياً': 4, 'قابل جزئياً': 2, 'غير قابل للتحول': 0 };
const LEVEL_SCORE: Record<string, number> = { عالي: 3, متوسط: 2, منخفض: 1 };

/**
 * أولوية التحول المحسوبة: القابلية + الجاهزية + الأثر − التعقيد.
 * «غير قابل للتحول» يُصفّر الجاهزية والأثر ويجعل المدخل خارج الأولوية.
 */
export function mocaPriorityScore(e: Partial<MocaEntry>): { total: number; band: string } | null {
  const t = TRANSFORM_SCORE[String(e.transformability || '')];
  if (t === undefined) return null;
  if (t === 0) return { total: 0, band: 'غير قابل للتحول' };
  const r = READINESS_SCORE[String(e.readiness || '')] ?? 0;
  const im = LEVEL_SCORE[String(e.impact || '')] ?? 0;
  const cx = LEVEL_SCORE[String(e.complexity || '')] ?? 0;
  const total = t + r + im - cx;
  const band = total >= 8 ? 'عالية' : total >= 5 ? 'متوسطة' : 'منخفضة';
  return { total, band };
}

export const MOCA_BAND_STYLE: Record<string, { color: string; bg: string }> = {
  عالية: { color: '#C0303B', bg: '#FDECEE' },
  متوسطة: { color: '#B45309', bg: '#FFF3DE' },
  منخفضة: { color: '#54627B', bg: '#F1F4F9' },
  'غير قابل للتحول': { color: '#64748B', bg: '#EEF2F7' },
};

// ---- 6. دفعات الإطلاق المعتمدة ---------------------------------------------
export type MocaBatch = { name: string; period: string; start: string; end: string; months: number };

export const MOCA_BATCHES: MocaBatch[] = [
  { name: 'إطلاق الدفعة الأولى', period: 'أغسطس – نوفمبر 2026', start: '2026-08-01', end: '2026-11-30', months: 4 },
  { name: 'إطلاق الدفعة الثانية', period: 'ديسمبر 2026 – فبراير 2027', start: '2026-12-01', end: '2027-02-28', months: 3 },
  { name: 'إطلاق الدفعة الثالثة', period: 'مارس – مايو 2027', start: '2027-03-01', end: '2027-05-31', months: 3 },
  { name: 'إطلاق الدفعة الرابعة', period: 'يونيو – أغسطس 2027', start: '2027-06-01', end: '2027-08-31', months: 3 },
  { name: 'إطلاق الدفعة الخامسة', period: 'سبتمبر – نوفمبر 2027', start: '2027-09-01', end: '2027-11-30', months: 3 },
  { name: 'إطلاق الدفعة السادسة', period: 'ديسمبر 2027 – فبراير 2028', start: '2027-12-01', end: '2028-02-29', months: 3 },
  { name: 'التوسع في التطبيق', period: 'مارس – مايو 2028', start: '2028-03-01', end: '2028-05-31', months: 3 },
];

/** حالة توزيع المدخل على دفعته — دورة اعتماد مستقلة عن اعتماد المحتوى */
export type MocaPlacementState = 'none' | 'draft' | 'pending' | 'approved';
export function mocaPlacementState(e: MocaEntry): MocaPlacementState {
  if (!String(e.execBatch || '').trim()) return 'none';
  return (e.batchWf as MocaPlacementState) || 'draft';
}
export const mocaPlacementLocked = (e: MocaEntry): boolean => {
  const st = mocaPlacementState(e);
  return st === 'pending' || st === 'approved';
};
export const MOCA_PLACEMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'مسودة', color: '#5A6B86', bg: '#EEF2F8' },
  pending: { label: 'قيد الاعتماد', color: '#B45309', bg: '#FFF7EB' },
  approved: { label: 'معتمد', color: '#0B8A4B', bg: '#EAF7F0' },
  returned: { label: 'مُعاد للتعديل', color: '#B45309', bg: '#FFF3DE' },
  rejected: { label: 'مرفوض', color: '#C0303B', bg: '#FDECEE' },
};
export function mocaPlacementChip(e: MocaEntry): { label: string; color: string; bg: string; note?: string } | null {
  const st = mocaPlacementState(e);
  if (st === 'none') return null;
  if (st === 'draft' && e.batchRet)
    return { ...MOCA_PLACEMENT_STATUS[e.batchRet === 'reject' ? 'rejected' : 'returned'], note: (e.batchNote as string) || '' };
  return { ...MOCA_PLACEMENT_STATUS[st] };
}

// ---- 6ب. حالات الاستخدام (Use Cases) ---------------------------------------
// متابعة حالات الاستخدام المبنية على المهام الفرعية المعتمدة: لكل حالة
// عمليتها الرئيسية والفرعية وحالتها، وسجل تحديثات (التحديث/المزود/التاريخ
// يُلتقط تلقائياً عند الإضافة).
export type MocaUcUpdate = { text: string; vendor: string; at: string };

export type MocaUseCase = {
  id: string;
  unitId: string;
  unitSector?: string;
  /** معرف المدخل المعتمد الذي بُنيت عليه الحالة */
  entryId?: string;
  mainProcess: string;
  subProcess: string;
  status: string;
  updates: MocaUcUpdate[];
  createdAt: string;
};

export const MOCA_UC_STATUSES = ['لم تبدأ بعد', 'قيد التنفيذ', 'مكتملة', 'متوقفة مؤقتاً'];

export const MOCA_UC_STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  'لم تبدأ بعد': { color: '#54627B', bg: '#F1F4F9' },
  'قيد التنفيذ': { color: '#B45309', bg: '#FFF7EB' },
  مكتملة: { color: '#0B8A4B', bg: '#EAF7F0' },
  'متوقفة مؤقتاً': { color: '#C0303B', bg: '#FDECEE' },
};

// ---- 7. الأدوار -------------------------------------------------------------
export type MocaRole = 'coord' | 'committee';

export const MOCA_ROLES: { key: MocaRole; label: string; sub: string }[] = [
  { key: 'coord', label: 'منسق الجهة أو القطاع', sub: 'يحصر مهام وعمليات جهته ويرسلها لاعتماد اللجنة الوطنية' },
  { key: 'committee', label: 'اللجنة الوطنية للذكاء الاصطناعي المساعد', sub: 'تعتمد المدخلات الواردة من جهات الوزارة أو تعيدها للتعديل' },
];
