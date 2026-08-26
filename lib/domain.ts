// ============================================================================
// Domain layer — faithful port of `class Component extends DCLogic`
// constants, types, workflow, scoring, program phases. All Arabic strings,
// numbers, colors and formulas are verbatim from the Claude Design prototype.
// ============================================================================

export type RoleKey = 'entity' | 'path' | 'coord' | 'ai' | 'admin';
export type ItemType = 'project' | 'initiative' | 'operation' | 'service';
export type WfState =
  | 'draft'
  | 'ent1'
  | 'pm1'
  | 'pm2'
  | 'ent2'
  | 'budget'
  | 'exec'
  | 'launch'
  | 'done';

// ---- 1.1 PATHS (streams) ---------------------------------------------------
export type Path = {
  id: string;
  name: string;
  desc: string;
  color: string;
  extra: 'operation' | 'service' | null;
};

export const PATHS: Path[] = [
  {
    id: 'ops',
    name: 'العمليات والدعم المؤسسي',
    desc: 'تحويل العمليات التخصصية وعمليات الدعم المؤسسي لتطبيق نماذج وأنظمة الذكاء الاصطناعي المساعد',
    color: '#2563EB',
    extra: 'operation',
  },
  {
    id: 'strategy',
    name: 'العمل الحكومي الاستراتيجي',
    desc: 'تحويل المهام الاستراتيجية لتطبيق نماذج وأنظمة الذكاء الاصطناعي المساعد',
    color: '#2563EB',
    extra: null,
  },
  {
    id: 'services',
    name: 'الخدمات الحكومية',
    desc: 'تحويل الخدمات وباقات الخدمات لتطبيق نماذج وأنظمة الذكاء الاصطناعي المساعد',
    color: '#2563EB',
    extra: 'service',
  },
];

// المحاور السبعة لمسار العمل الحكومي الاستراتيجي (حقل «المحور» في المهام)
export const STRATEGY_AXES = [
  'الاستراتيجية والمشاريع',
  'الذكاء الاستراتيجي والاستشراف',
  'السياسات',
  'الأداء الحكومي',
  'الهياكل الحكومية',
  'الابتكار في العمل الحكومي',
  'التنافسية العالمية',
];

// Contact-page inquiry routing — the PUBLIC site lists the project's five
// streams + the secretariat (per the approved handoff), independent of the
// three streams managed inside the platform. One inbox per entry, editable
// from the admin backoffice; the mapping is never surfaced to the visitor.
export const CONTACT_STREAMS: { key: string; label: string }[] = [
  { key: 'services', label: 'الخدمات الحكومية' },
  { key: 'strategy', label: 'العمل الحكومي الاستراتيجي' },
  { key: 'ops', label: 'العمليات والدعم المؤسسي' },
  { key: 'capacity', label: 'بناء القدرات والتدريب' },
  { key: 'tech', label: 'تقنيات الذكاء الاصطناعي والبيانات' },
  { key: 'general', label: 'الاستفسارات العامة' },
];
export const DEFAULT_CONTACT_EMAILS: Record<string, string> = {
  services: 'services@aigp.gov.ae',
  strategy: 'strategy@aigp.gov.ae',
  ops: 'operations@aigp.gov.ae',
  capacity: 'capacity@aigp.gov.ae',
  tech: 'technology@aigp.gov.ae',
  general: 'secretariat@aigp.gov.ae',
};

// ---- public-site content managed from the admin backoffice ----
export type DocCat = 'guide' | 'policy' | 'other';
export const DOC_CATS: { key: DocCat; label: string }[] = [
  { key: 'guide', label: 'الأدلة والمعايير' },
  { key: 'policy', label: 'السياسات والاستراتيجيات' },
  { key: 'other', label: 'أخرى' },
];
export const docCatLabel = (c: string) => DOC_CATS.find((x) => x.key === c)?.label || 'أخرى';
export type LibraryDoc = { id: string; title: string; cat: DocCat; date: string; fileUrl?: string; coverUrl?: string };
export const DEFAULT_LIBRARY_DOCS: LibraryDoc[] = [
  { id: 'guide', title: 'الدليل التعريفي للذكاء الاصطناعي المساعد', cat: 'guide', date: 'يوليو 2026' },
  { id: 'system', title: 'نظام عمل مشروع الذكاء الاصطناعي المساعد', cat: 'policy', date: 'يوليو 2026' },
];
export const DEFAULT_ABOUT_HERO =
  'بتوجيهات من صاحب السمو الشيخ محمد بن زايد آل نهيان، رئيس الدولة "حفظه الله"، أعلن صاحب السمو الشيخ محمد بن راشد آل مكتوم، نائب رئيس الدولة رئيس مجلس الوزراء حاكم دبي "رعاه الله"، في أبريل 2026 عن إطلاق مشروع وطني استراتيجي، بإشراف سمو الشيخ منصور بن زايد آل نهيان، نائب رئيس الدولة نائب رئيس مجلس الوزراء رئيس ديوان الرئاسة، يهدف إلى تحويل 50% من العمليات والمهام والإجراءات والخدمات الحكومية إلى نماذج وأنظمة مدعومة بالذكاء الاصطناعي المساعد خلال عامين، بما يسهم في خفض التكاليف التشغيلية، ورفع الكفاءة الحكومية، وتعزيز جودة المخرجات والخدمات، وتسريع الإنجاز، ودعم اتخاذ القرار، وذلك لبناء أفضل حكومة في العالم ولتعزيز جاهزية الدولة لمتغيرات المستقبل.';
// full About-page content — every section editable from the admin backoffice
export type AboutContent = {
  timeline: { year: string; title: string; sub: string; major: boolean; img?: string }[];
  targets: { label1: string; value1: string; text1: string; label2: string; value2: string; text2: string };
  tracks: { title: string; desc: string }[];
  scope: { title: string; desc: string }[];
  outOfScope: string;
  principles: { title: string; desc: string }[];
};
export const DEFAULT_ABOUT: AboutContent = {
  timeline: [
    { year: '2001', title: 'الحكومة الإلكترونية', sub: '', major: true },
    { year: '2013', title: 'الحكومة الذكية', sub: '', major: true },
    { year: '2017', title: 'تعيين أول وزير', sub: 'للذكاء الاصطناعي', major: false, img: 'assets/timeline-2017.jpg' },
    { year: '2019', title: 'الحكومة الرقمية', sub: '', major: true },
    { year: '2026', title: 'حكومة الذكاء الاصطناعي المساعد', sub: '', major: true, img: 'assets/timeline-2026.jpg' },
  ],
  targets: {
    label1: 'تحويل',
    value1: '50%',
    text1: 'من العمليات والمهام والإجراءات والخدمات في الجهة الاتحادية إلى نماذج مدعومة بالذكاء الاصطناعي المساعد',
    label2: 'تدريب وتأهيل',
    value2: '100%',
    text2: 'من موظفي الجهة الاتحادية على الذكاء الاصطناعي المساعد',
  },
  tracks: [
    { title: 'مسار العمليات والدعم المؤسسي', desc: 'تحويل العمليات التخصصية وعمليات الدعم المؤسسي لتطبيق نماذج وأنظمة الذكاء الاصطناعي المساعد، بما يعزز الإنتاجية والأداء الحكومي' },
    { title: 'مسار العمل الحكومي الاستراتيجي', desc: 'تحويل المهام الاستراتيجية لتطبيق نماذج وأنظمة الذكاء الاصطناعي المساعد، بما يدعم جودة وسرعة صناعة القرار الحكومي' },
    { title: 'مسار الخدمات الحكومية', desc: 'تحويل الخدمات وباقات الخدمات لتطبيق نماذج وأنظمة الذكاء الاصطناعي المساعد، بما يحسّن تجربة المتعامل ويرفع من كفاءة الخدمة' },
    { title: 'مسار تقنيات الذكاء الاصطناعي والبيانات', desc: 'تطوير وتنفيذ المتطلبات اللازمة لضمان حوكمة وجاهزية ونضج وأمن وسلامة المنظومة التقنية والبنية التحتية للذكاء الاصطناعي المساعد' },
    { title: 'مسار بناء القدرات والتدريب', desc: 'تطوير وتأهيل الموظفين الحكوميين في مجال الذكاء الاصطناعي المساعد، بما يعزز جاهزية الكوادر للاستفادة من الفرص التي تتيحها التقنيات الحديثة' },
  ],
  scope: [
    { title: 'العمليات التخصصية', desc: 'العمليات المرتبطة باختصاصات الوزارات والجهات الاتحادية وفق تشريعات إنشائها، والتشريعات المنظمة لأعمالها' },
    { title: 'عمليات الدعم المؤسسي', desc: 'العمليات المرتبطة بتقديم الدعم والمساندة وتمكين عمل الوحدات التنظيمية في الجهة الاتحادية والتي لا ينتج عنها خدمة للأفراد وقطاع الأعمال، كالموارد البشرية والمشتريات والعقود والشؤون المالية وغيرها' },
    { title: 'الخدمات الحكومية', desc: 'باقات الخدمات والخدمات التي تقوم الجهات بتقديمها من أجل تلبية احتياجات المتعاملين من أفراد وقطاع أعمال وتمكينهم من الحصول على قيمة نهائية مضافة، عبر مختلف قنوات تقديم الخدمة' },
    { title: 'المهام الاستراتيجية', desc: 'الإجراءات والأنشطة الاستراتيجية على المستوى الوطني ومستوى الجهات الاتحادية المرتبطة بالاستراتيجيات والأجندات والسياسات والمشاريع وإدارة الأداء والهياكل التنظيمية وغيرها' },
  ],
  outOfScope:
    'العمليات والمهام والإجراءات والخدمات التي سيتم تحديدها واعتمادها بأنها غير قابلة/غير مجدية لتبني الذكاء الاصطناعي المساعد من قبل اللجنة الوطنية للذكاء الاصطناعي المساعد أو فريق عمل المسار المعني على مستوى الحكومة.',
  principles: [
    { title: 'التكنولوجيا لا تستبدل الإنسان', desc: 'تعزيز قدرات الموظف الحكومي وتمكينه من التركيز على المهام ذات القيمة المضافة والأثر الأكبر' },
    { title: 'الإشراف والمساءلة البشرية', desc: 'مسؤولية جودة ودقة المخرجات والنتائج لنماذج وأنظمة الذكاء الاصطناعي المساعد تقع على الإنسان' },
    { title: 'الأدوار والمسؤوليات', desc: 'تحديد أدوار وصلاحيات ومسؤوليات الذكاء الاصطناعي المساعد ضمن العمليات والخدمات والمهام والأنشطة المستهدفة للتحول بوضوح' },
    { title: 'الاستكشاف المستمر للفرص', desc: 'استكشاف فرص توظيف الذكاء الاصطناعي المساعد في المهام اليومية للجهة وتحديد المجالات ذات الأولوية' },
    { title: 'سهولة الوصول والشمولية', desc: 'سهولة الوصول والاستخدام لجميع فئات المتعاملين، مع مراعاة احتياجاتهم وظروفهم المختلفة' },
    { title: 'الاستخدام الأمثل للموارد', desc: 'الاستفادة من الموارد البشرية والتقنية والمالية في الجهة لتطبيق المشروع' },
    { title: 'المشاركة والتوسع', desc: 'تعزيز تبادل أفضل الممارسات بين الجهات وتسريع تعميم الحلول الناجحة' },
    { title: 'إشراك الأطراف المعنية', desc: 'إشراك الموظفين والأطراف المعنية عنصراً أساسياً لنجاح التحول وفي تحديد الفرص ذات الأولوية' },
    { title: 'الإدارة الاستباقية للمخاطر', desc: 'الرصد المستمر لمخاطر الذكاء الاصطناعي وتقييمها ومعالجتها' },
    { title: 'المرونة والتكيف', desc: 'تصميم نماذج وأنظمة للذكاء الاصطناعي المساعد تتسم بالمرونة وقابلية التوسع والتطوير والتكيف مع المتغيرات المستقبلية' },
    { title: 'التشغيل الآمن والمسؤول', desc: 'حماية البيانات في المنظومة التقنية والبنية التحتية للذكاء الاصطناعي المساعد من التهديدات والمخاطر الأمنية' },
    { title: 'بيانات مترابطة وموثوقة', desc: 'الربط بين أنظمة الذكاء الاصطناعي المساعد وتبادل بيانات دقيقة وحديثة وموثوقة' },
    { title: 'مصادقة موحدة وآمنة', desc: 'الالتزام بتبني وتكامل الهوية الرقمية (UAE Pass) كوسيلة موحدة وآمنة لإثبات هوية المتعاملين والمصادقة على دخولهم' },
    { title: 'الالتزام بالتوجهات المعتمدة', desc: 'تطبيق السياسات والأدلة والمعايير الحكومية والتعاميم والإجراءات الصادرة عن اللجنة ورؤساء المسارات على المستوى الحكومي' },
  ],
};

// a submitted تواصل معنا inquiry (ticket) — routed to the stream inbox
export type ContactInquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  stream: string;
  message: string;
  ts: number;
  done: boolean;
};

// ---- per-stream entry field specs (single source for the entry form, the
// Excel template, bulk import mapping and missing-data checks) ----
// عمليات الدعم المؤسسي: الوظائف المساندة المعتمدة
export const SUPPORT_FUNCTIONS = [
  'الموارد البشرية',
  'الشؤون المالية',
  'المشتريات والعقود',
  'الدعم التقني',
  'الأمن السيبراني',
  'الشؤون الإدارية',
  'التدقيق الداخلي والحوكمة المؤسسية',
  'إدارة المرافق والصيانة',
  'الشؤون التشريعية',
  'الإعلام والاتصال الحكومي',
];
export const SUPPORT_OPTYPE = 'عمليات الدعم المؤسسي';
export const OPS_SPECIAL_OPTYPE = 'العمليات التخصصية';

// خيارات حقول مسار العمليات — من نموذج حصر العمليات المعتمد (ورقة «المعادلات»)
export const OPS_AUTOMATED_OPTIONS = ['نعم', 'جزئياً', 'لا'];
export const OPS_INTENSITY_OPTIONS = ['عالية التكرار', 'متوسطة التكرار', 'منخفضة التكرار'];
export const OPS_READINESS_OPTIONS = [
  'جاهزة للتحول بنسبة 80% فأكثر',
  'جاهزة للتحول بنسبة بين 50% إلى 80%',
  'جاهزة للتحول بنسبة بين 30% إلى 50%',
  'جاهزة للتحول بنسبة 30% فأقل',
];
export const OPS_LEVEL_OPTIONS = ['عالي', 'متوسط', 'منخفض']; // مستوى الأثر ومستوى التعقيد
export const OPS_TRANSFORM_OPTIONS = ['قابل كلياً', 'قابل جزئياً', 'غير قابل للتحول'];
export const OPS_NOT_TRANSFORMABLE = 'غير قابل للتحول';
// أولوية التحول: قائمة يدوية مؤقتاً — إلى حين اعتماد الاحتساب الآلي.
// «ليست ذات أولوية» تعطّل فترة التحويل (لا فترة لما لن يُحوَّل)
export const OPS_NO_PRIORITY = 'ليست ذات أولوية';
export const OPS_PRIORITY_OPTIONS = ['منخفضة', 'متوسطة', 'مرتفعة', OPS_NO_PRIORITY];
export const OPS_RISK_OPTIONS = ['عالية', 'متوسطة', 'منخفضة'];

export const STREAM_FIELDS: Record<string, { key: string; label: string }[]> = {
  services: [
    { key: 'title', label: 'الخدمة' },
    { key: 'subService', label: 'الخدمة الفرعية' },
    { key: 'sector', label: 'القطاع المعني' },
    { key: 'dept', label: 'الإدارة المعنية' },
    { key: 'section', label: 'القسم المعني' },
    { key: 'usageIntensity', label: 'كثافة الاستخدام' },
    { key: 'complexity', label: 'مستوى التعقيد' },
    { key: 'readinessLevel', label: 'مستوى الجاهزية' },
    // أولوية الاختيار وأولوية التحول تُشتقان من المصفوفة — ليستا عمودَي إدخال
  ],
  strategy: [
    { key: 'axis', label: 'المحور' },
    { key: 'title', label: 'المهمة' },
    // one Excel row per نشاط — repeat the المهمة cell for each
    { key: 'subActivities', label: 'اسم النشاط' },
    { key: 'sector', label: 'القطاع المعني' },
    { key: 'dept', label: 'الإدارة المعنية' },
    { key: 'section', label: 'القسم المعني' },
    { key: 'automationLevel', label: 'مستوى الأتمتة' },
    { key: 'automationPct', label: 'نسبة الأتمتة (%)' },
    { key: 'automationSystem', label: 'نظام الأتمتة' },
    { key: 'importance', label: 'مستوى الأهمية' },
    { key: 'usageIntensity', label: 'كثافة الاستخدام' },
    { key: 'outputClarity', label: 'وضوح المخرجات وقابليتها للمراجعة' },
    { key: 'transformScore', label: 'قابلية التحول' },
    { key: 'readinessLevel', label: 'مستوى الجاهزية' },
    { key: 'impactScore', label: 'مستوى الأثر المتوقع من التحول' },
    { key: 'riskLevel', label: 'مستوى المخاطر' },
    // أولوية الاختيار وأولوية التحول تُشتقان من المصفوفة — ليستا عمودَي إدخال
  ],
  // مسار العمليات — الأعمدة نفسها في نموذج حصر العمليات المعتمد (ورقتا
  // «العمليات الرئيسية» و«عمليات الدعم المؤسسي»)؛ «التصنيف» تحدده الورقة
  ops: [
    { key: 'opType', label: 'التصنيف' },
    { key: 'title', label: 'العملية الرئيسية' },
    // one Excel row per نشاط — repeat the العملية الرئيسية cell for each
    { key: 'subActivities', label: 'الأنشطة الفرعية للعملية الرئيسية' },
    { key: 'sector', label: 'القطاع المعني' },
    { key: 'dept', label: 'الإدارة المعنية' },
    { key: 'section', label: 'القسم المعني' },
    { key: 'isAutomated', label: 'هل النشاط\\ العملية مؤتمتة؟' },
    { key: 'automationSystem', label: 'ما هو نظام الأتمتة؟' },
    { key: 'automationPct', label: 'ما هي نسبة الأتمتة؟' },
    { key: 'usageIntensity', label: 'كثافة النشاط/ العملية' },
    { key: 'readinessLevel', label: 'الجاهزية للتحول للذكاء الاصطناعي المساعد' },
    { key: 'impactScore', label: 'مستوى الأثر المتوقع من التحول' },
    { key: 'complexity', label: 'مستوى التعقيد' },
    { key: 'transformScore', label: 'القابلية للتحول للذكاء الاصطناعي المساعد' },
    // النموذج الرسمي (2026-08-26) ينتهي بعمود «ملاحظات» — الأولوية والفترة
    // والمخاطر تُستكمل داخل المنصة لا في ملف الجهة
    { key: 'notes', label: 'ملاحظات' },
  ],
};
// select-field options per stream — mirrors the entry forms exactly (used for
// the Excel template dropdowns)
// قابلية التحول (استراتيجي): three approved choices and their backend scores
export const STG_TRANSFORM_OPTIONS = ['قابل كلياً', 'قابل جزئياً', 'غير قابل'];
export const STG_TRANSFORM_SCORES: Record<string, number> = { 'قابل كلياً': 5, 'قابل جزئياً': 4, 'غير قابل': 0 };
export const STG_NOT_TRANSFORMABLE = 'غير قابل';
const SCALE_1_5 = ['1', '2', '3', '4', '5'];
export const STREAM_FIELD_OPTIONS: Record<string, Record<string, string[]>> = {
  services: {
    usageIntensity: ['منخفضة', 'متوسطة', 'مرتفعة'],
    complexity: ['منخفض', 'متوسط', 'مرتفع'],
    readinessLevel: ['منخفض', 'متوسط', 'مرتفع'],
  },
  strategy: {
    automationLevel: ['مؤتمتة كلياً', 'مؤتمتة جزئياً', 'غير مؤتمتة'],
    importance: SCALE_1_5,
    usageIntensity: SCALE_1_5,
    readinessLevel: SCALE_1_5,
    impactScore: SCALE_1_5,
    transformScore: STG_TRANSFORM_OPTIONS,
    outputClarity: SCALE_1_5,
    riskLevel: ['منخفض', 'متوسط', 'عالي'],
  },
  ops: {
    opType: [OPS_SPECIAL_OPTYPE, SUPPORT_OPTYPE],
    isAutomated: OPS_AUTOMATED_OPTIONS,
    usageIntensity: OPS_INTENSITY_OPTIONS,
    readinessLevel: OPS_READINESS_OPTIONS,
    impactScore: OPS_LEVEL_OPTIONS,
    complexity: OPS_LEVEL_OPTIONS,
    transformScore: OPS_TRANSFORM_OPTIONS,
  },
};
// sample row shown (in gray italics) under the header to guide filling
export const STREAM_FIELD_SAMPLE: Record<string, Record<string, string>> = {
  services: {
    title: 'خدمة تجديد الرخصة التجارية',
    subService: 'تجديد فوري للرخصة',
    sector: 'قطاع الاقتصاد',
    dept: 'إدارة التسجيل التجاري',
    section: 'قسم الرخص',
    usageIntensity: 'مرتفعة',
    complexity: 'منخفض',
    readinessLevel: 'مرتفع',
  },
  strategy: {
    axis: 'محور السياسات العامة',
    title: 'تحليل اتجاهات السياسات',
    subActivities: 'جمع البيانات، التحليل، إعداد التقرير',
    sector: 'قطاع الاستراتيجية',
    dept: 'إدارة السياسات',
    section: 'قسم التحليل',
    automationLevel: 'مؤتمتة جزئياً',
    automationPct: '60',
    automationSystem: 'نظام إدارة الوثائق',
    usageIntensity: '4',
    importance: '5',
    readinessLevel: '3',
    impactScore: '4',
    transformScore: 'قابل جزئياً',
    outputClarity: '5',
    riskLevel: 'منخفض',
  },
  ops: {
    opType: 'عمليات الدعم المؤسسي',
    title: 'تدقيق طلبات الموارد البشرية',
    subActivities: 'استلام الطلبات والتحقق منها',
    sector: 'قطاع الخدمات المساندة',
    dept: 'إدارة الموارد البشرية',
    section: 'قسم شؤون الموظفين',
    isAutomated: 'جزئياً',
    automationSystem: 'نظام بياناتي',
    automationPct: '60',
    usageIntensity: 'عالية التكرار',
    readinessLevel: 'جاهزة للتحول بنسبة بين 50% إلى 80%',
    impactScore: 'عالي',
    complexity: 'متوسط',
    transformScore: 'قابل جزئياً',
    transformPeriod: 'الربع الأول 2027',
    transformPriority: 'متوسطة',
    riskLevel: 'متوسطة',
  },
};

const plainOf = (v: unknown): string => String(v ?? '').replace(/<[^>]*>/g, '').trim();
// labels of the required entry fields this item has not filled yet
export function missingFieldsOf(i: Record<string, unknown> & { path?: string }): string[] {
  // per-نشاط records: validate the header fields + every activity in full
  const acts = i.activities as ActivityDetail[] | undefined;
  if (Array.isArray(acts) && acts.length) {
    const path = i.path || '';
    const out: string[] = [];
    if (path === 'ops') {
      if (!plainOf(i.opType)) out.push('التصنيف');
      if (!plainOf(i.title)) out.push('العملية الرئيسية');
    } else if (path === 'strategy') {
      if (!plainOf(i.axis)) out.push('المحور');
      if (!plainOf(i.title)) out.push('المهمة');
    } else if (path === 'services') {
      if (!plainOf(i.title)) out.push('الخدمة');
    }
    acts.forEach((a, ai) => {
      const unit = path === 'services' ? 'الخدمة الفرعية' : path === 'ops' ? 'العملية الفرعية' : 'النشاط';
      const tag = acts.length > 1 ? ` (${unit} ${ai + 1})` : '';
      activityMissing(path, a).forEach((lbl) => out.push(lbl + tag));
    });
    return out;
  }
  const spec = STREAM_FIELDS[i.path || ''] || [];
  const automationKey = (k: string) => k === 'automationSystem' || k === 'automationPct';
  return spec
    // الملاحظات حقل اختياري
    .filter((f) => f.key !== 'notes')
    // فترة التحويل غير مطلوبة لعملية غير قابلة للتحول
    .filter((f) => (f.key === 'transformPeriod' && i.path === 'ops' ? plainOf(i.transformPriority) !== OPS_NO_PRIORITY : true))
    // نظام/نسبة الأتمتة مطلوبان فقط للعمليات المؤتمتة (كلياً أو جزئياً)
    .filter((f) => (automationKey(f.key) && i.path === 'ops' ? ['نعم', 'جزئياً'].includes(plainOf(i.isAutomated)) : true))
    .filter((f) => (automationKey(f.key) && i.path === 'strategy' ? plainOf(i.automationLevel) !== 'غير مؤتمتة' : true))
    .filter((f) => !plainOf(i[f.key]))
    .map((f) => f.label);
}

// required fields of ONE activity/sub-service, per stream (labels of the gaps)
export function activityMissing(path: string, a: ActivityDetail): string[] {
  const out: string[] = [];
  const need = (v: unknown, lbl: string) => {
    if (!plainOf(v)) out.push(lbl);
  };
  need(a.name, path === 'services' ? 'الخدمة الفرعية' : path === 'ops' ? 'اسم العملية الفرعية' : 'اسم النشاط');
  need(a.sector, 'القطاع المعني');
  need(a.dept, 'الإدارة المعنية');
  need(a.section, 'القسم المعني');
  if (path === 'ops') {
    // حقول نموذج حصر العمليات المعتمد — عمودٌ لكل حقل
    need(a.isAutomated, 'هل النشاط/ العملية مؤتمتة؟');
    if (['نعم', 'جزئياً'].includes(plainOf(a.isAutomated))) {
      need(a.automationSystem, 'نظام الأتمتة');
      need(a.automationPct, 'نسبة الأتمتة');
    }
    need(a.usageIntensity, 'كثافة النشاط/ العملية');
    need(a.readinessLevel, 'الجاهزية للتحول للذكاء الاصطناعي المساعد');
    need(a.impactScore, 'مستوى الأثر المتوقع من التحول');
    need(a.complexity, 'مستوى التعقيد');
    need(a.transformScore, 'القابلية للتحول للذكاء الاصطناعي المساعد');
    need(a.transformPriority, 'أولوية التحول للذكاء الاصطناعي المساعد');
    // فترة التحويل تتبع الأولوية: مطلوبة لمنخفضة/متوسطة/مرتفعة، ومعطّلة
    // تماماً عند «ليست ذات أولوية» (والقيم القديمة غير القابلة للتحول)
    {
      const pr = plainOf(a.transformPriority);
      if (pr && pr !== OPS_NO_PRIORITY && pr !== OPS_NOT_TRANSFORMABLE && pr !== 'أولوية 4')
        need(a.transformPeriod, 'فترة التحويل للذكاء الاصطناعي المساعد');
    }
    need(a.riskLevel, 'مخاطر التحول للذكاء الاصطناعي المساعد');
  } else if (path === 'strategy') {
    need(a.automationLevel, 'مستوى الأتمتة');
    if (plainOf(a.automationLevel) && plainOf(a.automationLevel) !== 'غير مؤتمتة') {
      need(a.automationSystem, 'نظام الأتمتة');
      need(a.automationPct, 'نسبة الأتمتة');
    }
    need(a.importance, 'مستوى الأهمية');
    need(a.usageIntensity, 'كثافة الاستخدام');
    need(a.outputClarity, 'وضوح المخرجات وقابليتها للمراجعة');
    need(a.transformScore, 'قابلية التحول');
    // «غير قابل للتحول» يغلق الحقلين ويحتسبهما صفراً
    if (!isStgBlocked(a.transformScore)) {
      need(a.readinessLevel, 'مستوى الجاهزية');
      need(a.impactScore, 'مستوى الأثر المتوقع من التحول');
    }
    need(a.riskLevel, 'مستوى المخاطر');
  } else if (path === 'services') {
    need(a.usageIntensity, 'كثافة الاستخدام');
    need(a.complexity, 'مستوى التعقيد');
    need(a.readinessLevel, 'مستوى الجاهزية');
  }
  return out;
}

// derived أولوية التحول of one activity (stg/svc matrices; ops is manual)
export function activityTransformYes(path: string, a: ActivityDetail): string {
  if (path === 'strategy') {
    const c = stgPriority(a);
    return c ? (c.cat === 'أولوية منخفضة' ? 'لا' : 'نعم') : '';
  }
  if (path === 'services') {
    const p = svcPriority(a.usageIntensity, a.complexity, a.readinessLevel);
    return p ? (p === 4 ? 'لا' : 'نعم') : '';
  }
  // ops: مشتقة من «أولوية التحول» — منخفضة/متوسطة/مرتفعة نعم،
  // «ليست ذات أولوية» لا (والقيم القديمة أولوية 4/غير قابل تبقى لا)
  const pr = plainOf(a.transformPriority);
  if (pr) return pr === OPS_NO_PRIORITY || pr === 'أولوية 4' || pr === OPS_NOT_TRANSFORMABLE ? 'لا' : 'نعم';
  return plainOf(a.transformYes);
}

// normalized activity list of an item — falls back to synthesizing one entry
// from the legacy flat fields so older records keep working everywhere
export function itemActivities(i: Item): ActivityDetail[] {
  if (Array.isArray(i.activities) && i.activities.length) return i.activities;
  const names =
    i.path === 'services'
      ? [i.subService || ''].filter(Boolean)
      : String(i.subActivities || '')
          .replace(/<[^>]*>/g, '\n')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
  if (!names.length) return [];
  return names.map((name, idx) => ({
    name,
    sector: i.sector,
    dept: i.dept,
    section: i.section,
    isAutomated: i.isAutomated,
    automationLevel: i.automationLevel,
    automationSystem: i.automationSystem,
    automationPct: i.automationPct ?? undefined,
    importance: i.importance,
    usageIntensity: i.usageIntensity,
    readinessLevel: typeof i.readinessLevel === 'string' ? i.readinessLevel : undefined,
    impactScore: i.impactScore,
    transformScore: typeof i.transformScore === 'string' ? i.transformScore : undefined,
    outputClarity: i.outputClarity,
    riskLevel: i.riskLevel,
    complexity: i.complexity,
    transformYes: i.transformYes,
    transformPeriod: i.transformPeriod,
    transformPriority: i.transformPriority,
    notes: idx === 0 ? i.notes : undefined,
  }));
}

// mirror the activities back onto the legacy flat fields (first entry wins)
// so tables, filters, exports and older records stay consistent
export function mirrorActivities<T extends Partial<Item> & { path?: string }>(d: T): T {
  const acts = d.activities;
  if (!Array.isArray(acts) || !acts.length) return d;
  const path = d.path || '';
  const withDerived = acts.map((a) => ({ ...a, transformYes: activityTransformYes(path, a) || a.transformYes }));
  const first = withDerived[0];
  const out: T = { ...d, activities: withDerived };
  if (path === 'services') out.subService = withDerived.map((a) => a.name).filter(Boolean).join('، ');
  else out.subActivities = withDerived.map((a) => a.name).filter(Boolean).join('\n');
  out.sector = first.sector;
  out.dept = first.dept;
  out.section = first.section;
  out.isAutomated = first.isAutomated;
  out.automationLevel = first.automationLevel;
  out.automationSystem = first.automationSystem;
  out.automationPct = first.automationPct ?? undefined;
  out.importance = first.importance;
  out.usageIntensity = first.usageIntensity;
  out.readinessLevel = first.readinessLevel;
  out.impactScore = first.impactScore;
  out.transformScore = first.transformScore as never;
  out.outputClarity = first.outputClarity;
  out.riskLevel = first.riskLevel;
  out.complexity = first.complexity;
  out.transformPeriod = first.transformPeriod;
  out.transformPriority = first.transformPriority ?? d.transformPriority;
  out.transformYes = withDerived.some((a) => a.transformYes === 'نعم') ? 'نعم' : first.transformYes;
  out.notes = first.notes ?? d.notes;
  // the entry's own دفعة/dates mirror the first نشاط when it carries them,
  // so batch filters, the detail card, exports and the committee cards keep
  // reading a single item-level value
  if (first.execBatch !== undefined) out.execBatch = first.execBatch;
  if (first.startDate) out.startDate = first.startDate;
  if (first.endDate) out.endDate = first.endDate;
  return out;
}

// «للتحديد بعد الدراسة»: execution stage deferred until the study concludes
export const TBD_BATCH = 'للتحديد بعد الدراسة';

export const pathById = (id: string): Path =>
  PATHS.find((p) => p.id === id) || PATHS[0];

// Path icon SVG paths (rail + create-modal cards)
export const PIC: Record<string, string> = {
  capacity: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7',
  tech: 'M3 5h18v14H3zM7 10l2.5 2.5L7 15M13 15h4',
  ops: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 3v2M12 19v2M4.6 4.6 6 6M18 18l1.4 1.4M3 12h2M19 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  strategy: 'M4 20V10M10 20V4M16 20v-8M21 20H3',
  services: 'M3 5h18v14H3zM3 9h18M6.2 7h.01',
};

// Allowed item types per path — project & initiative are ONE merged type
export type TypeOption = { key: ItemType; label: string };
export function availTypes(path: string): TypeOption[] {
  // the services stream accepts SERVICE entries only (no projects)
  if (path === 'services') return [{ key: 'service', label: 'خدمة' }];
  // the strategy stream accepts TASK (مهمة) entries only (no projects)
  if (path === 'strategy') return [{ key: 'operation', label: 'مهمة' }];
  // مشاريع as a standalone type are gone — the operations stream records
  // operations only (المشاريع is one of its تصنيف values)
  return [{ key: 'operation', label: 'عملية' }];
}

// which type columns apply to a stream (drives dashboard breakdowns)
export const streamHasType = (path: string, t: 'operation' | 'service'): boolean =>
  availTypes(path).some((o) => o.key === t);

// ---- 1.2 TYPE map (project/initiative merged for display) ------------------
export const TYPE: Record<ItemType, { label: string; color: string; bg: string }> = {
  project: { label: 'مشروع', color: '#2563EB', bg: '#E5EEFF' },
  initiative: { label: 'مشروع', color: '#2563EB', bg: '#E5EEFF' },
  operation: { label: 'عملية', color: '#2563EB', bg: '#E5EEFF' },
  service: { label: 'خدمة', color: '#2563EB', bg: '#E5EEFF' },
};

export const typeLabel = (t: string): string =>
  ({
    project: 'مشروع',
    initiative: 'مشروع',
    operation: 'عملية',
    service: 'خدمة',
  } as Record<string, string>)[t] || 'عنصر';

// path-aware label: in العمل الحكومي الاستراتيجي an «operation» is a «مهمة»
export const typeLabelFor = (t: string, path?: string): string =>
  t === 'operation' && path === 'strategy' ? 'مهمة' : typeLabel(t);
export const typeLabelDefFor = (t: string, path?: string): string =>
  t === 'operation' && path === 'strategy' ? 'المهمة' : typeLabelDef(t);

// definite form for sentences: «تم إرسال المشروع / المبادرة…»
export const typeLabelDef = (t: string): string =>
  ({
    project: 'المشروع',
    initiative: 'المشروع',
    operation: 'العملية',
    service: 'الخدمة',
  } as Record<string, string>)[t] || 'العنصر';

// project & initiative count as one merged bucket
export const isProjInit = (t: string): boolean => t === 'project' || t === 'initiative';

// ---- services stream: أولوية الاختيار matrix -------------------------------
// Inputs: كثافة الاستخدام × مستوى التعقيد × الجاهزية. Rules (in order):
//   1) كثافة منخفضة → 4        2) تعقيد مرتفع → 4
//   3) جاهزية منخفضة → 3       4) كثافة مرتفعة + تعقيد منخفض + جاهزية مرتفعة → 1
//   5) otherwise → 2
const svcLvl = (v?: string): 'low' | 'mid' | 'high' | '' => {
  const x = (v || '').trim();
  if (x.startsWith('منخفض')) return 'low';
  if (x.startsWith('متوسط')) return 'mid';
  if (x.startsWith('مرتفع') || x.startsWith('عال')) return 'high';
  return '';
};
export function svcPriority(usage?: string, complexity?: string, readiness?: string): 1 | 2 | 3 | 4 | null {
  const u = svcLvl(usage), c = svcLvl(complexity), r = svcLvl(readiness);
  if (!u || !c || !r) return null;
  if (u === 'low') return 4;
  if (c === 'high') return 4;
  if (r === 'low') return 3;
  if (u === 'high' && c === 'low' && r === 'high') return 1;
  return 2;
}

// ---- strategy stream: أولوية التنفيذ matrix --------------------------------
// Step 1: six 1-5 criteria summed to a 30-point score, banded
//   عالية 24-30 · متوسطة 16-23 · منخفضة 6-15
// Step 2: مستوى المخاطر (منخفض/متوسط/عالي)
// Step 3: عالي المخاطر → أولوية منخفضة دائماً; otherwise the band decides.
export type StgCalc = { total: number; cat: string; hint: string };
/** numeric score of قابلية التحول — null when unset/invalid (legacy 1-5 kept) */
export function stgTransformScore(v?: string): number | null {
  const t = (v || '').trim();
  if (!t) return null;
  if (t in STG_TRANSFORM_SCORES) return STG_TRANSFORM_SCORES[t];
  const n = parseInt(t, 10); // legacy records stored 1-5
  return isNaN(n) || n < 1 || n > 5 ? null : n;
}
/** «غير قابل للتحول» → مستوى الجاهزية والأثر مغلقان ويُحتسبان صفراً */
export function isStgBlocked(v?: string): boolean {
  return (v || '').trim() === STG_NOT_TRANSFORMABLE;
}

export function stgPriority(i: {
  importance?: string;
  usageIntensity?: string;
  readinessLevel?: string;
  impactScore?: string;
  transformScore?: string;
  outputClarity?: string;
  riskLevel?: string;
}): StgCalc | null {
  // قابلية التحول: three choices scored 5 / 4 / 0 (legacy rows kept a 1-5 number)
  const tScore = stgTransformScore(i.transformScore);
  if (tScore == null) return null;
  const blocked = isStgBlocked(i.transformScore);
  // «غير قابل للتحول» blocks الجاهزية والأثر — both count as 0
  const base = [i.importance, i.usageIntensity, i.outputClarity].map((v) => parseInt(v || '', 10));
  if (base.some((v) => isNaN(v) || v < 1 || v > 5) || !(i.riskLevel || '').trim()) return null;
  let readiness = 0;
  let impact = 0;
  if (!blocked) {
    readiness = parseInt(i.readinessLevel || '', 10);
    impact = parseInt(i.impactScore || '', 10);
    if ([readiness, impact].some((v) => isNaN(v) || v < 1 || v > 5)) return null;
  }
  const vals = [...base, tScore, readiness, impact];
  const total = vals.reduce((a, b) => a + b, 0);
  const highRisk = (i.riskLevel || '').startsWith('عال');
  const band = total >= 24 ? 'عالية' : total >= 16 ? 'متوسطة' : 'منخفضة';
  const cat = highRisk ? 'أولوية منخفضة' : 'أولوية ' + band;
  const hint = cat === 'أولوية عالية' ? 'ابدأ أولاً' : cat === 'أولوية متوسطة' ? 'نفّذ تدريجياً' : 'يؤجل أو يعاد تصميمه';
  return { total, cat, hint };
}

// ---- 1.3 Roles -------------------------------------------------------------
export const ROLE: Record<
  RoleKey,
  { label: string; sub: string; badge: string; bg: string }
> = {
  // one unified badge colour for every role (brand blue) — no rainbow of chips
  entity: {
    label: 'قيادة الجهة',
    sub: 'متابعة شاملة لمسارات الجهة والممثلين',
    badge: '#1D4ED8',
    bg: '#EAF1FE',
  },
  path: {
    label: 'فريق عمل المسار في المشروع',
    sub: 'مراجعة واعتماد مدخلات المسار من جميع الجهات',
    badge: '#1D4ED8',
    bg: '#EAF1FE',
  },
  coord: {
    label: 'منسق المسار في الجهة الاتحادية',
    sub: 'تنسيق ومتابعة بيانات المسار في الجهة',
    badge: '#1D4ED8',
    bg: '#EAF1FE',
  },
  ai: {
    label: 'اللجنة الوطنية للذكاء الاصطناعي المساعد',
    sub: 'اطلاع وطني على المدخلات المعتمدة عبر كل المسارات والجهات',
    badge: '#1D4ED8',
    bg: '#EAF1FE',
  },
  admin: {
    label: 'مشرف النظام',
    sub: 'إدارة المستخدمين والأدوار وتعيين رؤساء المسارات واللجنة',
    badge: '#1D4ED8',
    bg: '#EAF1FE',
  },
};

// Access-role reference (الأدوار والصلاحيات) — mirrors the DB `roles` table.
export const ROLE_INFO: {
  key: RoleKey;
  nameAr: string;
  descAr: string;
  scope: string;
  permissions: string[];
}[] = [
  { key: 'admin', nameAr: 'مشرف النظام', descAr: 'يدير المستخدمين والأدوار، ويعيّن فرق عمل المسارات وأعضاء اللجنة الوطنية.', scope: 'النظام بالكامل', permissions: ['users.manage', 'roles.view', 'streamhead.assign', 'committee.assign'] },
  { key: 'ai', nameAr: 'اللجنة الوطنية للذكاء الاصطناعي المساعد', descAr: 'اطلاع وطني على جميع المدخلات المعتمدة من فرق عمل المسارات عبر كل المسارات والجهات.', scope: 'وطني', permissions: ['item.view.approved.all'] },
  { key: 'path', nameAr: 'فريق عمل المسار في المشروع', descAr: 'يراجع مدخلات كل الجهات ضمن مساره ويعتمدها أو يطلب معلومات إضافية.', scope: 'مسار واحد أو أكثر', permissions: ['item.view.stream', 'item.approve', 'item.info.request', 'plan.view'] },
  { key: 'coord', nameAr: 'منسق المسار في الجهة الاتحادية', descAr: 'يعبّئ جميع بيانات مسارات جهته ويرسلها للاعتماد.', scope: 'مسار واحد أو أكثر داخل جهته', permissions: ['item.create', 'item.update', 'item.submit', 'plan.edit'] },
];

// Real stream representatives (فريق عمل المسار) — one per transformation stream
// Stream heads are identified by their ROLE across the platform — the
// officials' personal names are deliberately not shown anywhere.
export const PATH_REPS: Record<string, string> = {};

// Role-switcher pill labels (display order in the header)
export const ROLE_PILLS: { key: RoleKey; label: string }[] = [
  { key: 'coord', label: 'منسق المسار في الجهة الاتحادية' },
  { key: 'path', label: 'فريق عمل المسار في المشروع' },
  { key: 'ai', label: 'اللجنة الوطنية للذكاء الاصطناعي المساعد' },
  { key: 'admin', label: 'مشرف النظام' },
];

/**
 * أدوار أُلغيت بدمجها في أدوار البنية المعتمدة (أربعة أدوار):
 * نائب رئيس المسار ← فريق عمل المسار في المشروع
 * الأمانة العامة للجنة الوطنية ← اللجنة الوطنية للذكاء الاصطناعي المساعد
 * تُستخدم لترحيل الحسابات والجلسات المحفوظة بالأدوار القديمة.
 */
export const LEGACY_ROLE_MAP: Record<string, RoleKey> = {
  deputy: 'path',
  secretariat: 'ai',
};

export const migrateRole = (r: string | undefined | null): RoleKey =>
  (LEGACY_ROLE_MAP[String(r || '')] || r || 'coord') as RoleKey;

// A managed user account (المستخدمون) as shown/edited in the admin console and,
// in production, stored in the `users` table.
export type UserRec = {
  id: string;
  role: RoleKey;
  name: string;
  title: string;
  email: string;
  phone: string;
  entityName?: string; // entity / coord
  streamId?: string; // coord / path
  active: boolean;
  system?: boolean; // seeded reference account (kept out of the demo delete path)
};

// Starter accounts for the admin console (mirrors prisma/seed.ts): the national
// committee + the five stream heads are set by the admin; the entity rep and
// its coordinators are set by the entity rep (shown here read-only-ish).
export function seedUsers(entityName = DEFAULT_ENTITY): UserRec[] {
  const u: UserRec[] = [
    { id: 'u-admin', role: 'admin', name: 'مشرف النظام', title: 'مسؤول المنصة', email: 'admin@aigp.gov.ae', phone: '', active: true, system: true },
    { id: 'u-committee', role: 'ai', name: 'اللجنة الوطنية للذكاء الاصطناعي', title: 'عضو اللجنة الوطنية', email: 'committee@aigp.gov.ae', phone: '', active: true, system: true },
  ];
  for (const p of PATHS) {
    u.push({ id: `u-head-${p.id}`, role: 'path', name: PATH_REPS[p.id] || `فريق عمل مسار ${p.name}`, title: `فريق عمل مسار ${p.name}`, email: `head.${p.id}@aigp.gov.ae`, phone: '', streamId: p.id, active: true, system: true });
  }
  for (const p of PATHS) {
    u.push({ id: `u-coord-${p.id}`, role: 'coord', name: `منسق ${p.name}`, title: `منسق مسار ${p.name}`, email: `coord.${p.id}@aigp.gov.ae`, phone: '', entityName, streamId: p.id, active: true });
  }
  return u;
}

// ---- 1.4 Status / approval enums ------------------------------------------
export const APPR: Record<string, { bg: string; c: string }> = {
  مسودة: { bg: '#EEF1F6', c: '#64748B' },
  'تم الإرسال': { bg: '#E5EEFF', c: '#2563EB' },
  'قيد المراجعة': { bg: '#FFF3DE', c: '#B45309' },
  معتمد: { bg: '#E3F6EC', c: '#0B8A4B' },
  'بحاجة إلى تحديث': { bg: '#FCEEE6', c: '#C2410C' },
  مرفوض: { bg: '#FCE8E8', c: '#DC2B38' },
};

export const PRIO: Record<string, { bg: string; c: string }> = {
  عالية: { bg: '#FCEEEF', c: '#D23B45' },
  متوسطة: { bg: '#F1F4F9', c: '#54627B' },
  منخفضة: { bg: '#F1F4F9', c: '#54627B' },
};

export const PRI_ORDER = ['عالية', 'متوسطة', 'منخفضة'];
export const CX_ORDER = ['منخفض', 'متوسط', 'عالٍ'];

// Phase / launch / exec-checklist statuses
export const PHASE_STATUS: Record<string, { bg: string; c: string; dot: string }> = {
  مكتملة: { bg: '#E3F6EC', c: '#0B8A4B', dot: '#0B8A4B' },
  'قيد التنفيذ': { bg: '#FFF3DE', c: '#B45309', dot: '#B45309' },
  'لم تبدأ': { bg: '#EEF1F6', c: '#64748B', dot: '#C2CCDC' },
};
export const LAUNCH_STATUS: Record<string, { bg: string; c: string }> = {
  'تم الإطلاق': { bg: '#E3F6EC', c: '#0B8A4B' },
  'قيد الإعداد': { bg: '#FFF3DE', c: '#B45309' },
  مخطط: { bg: '#E5EEFF', c: '#2563EB' },
};
export const SC: Record<string, { bg: string; c: string }> = {
  'لم تبدأ': { bg: '#F1F4F9', c: '#64748B' },
  مكتمل: { bg: '#F1F4F9', c: '#0B8A4B' },
  متأخر: { bg: '#F1F4F9', c: '#C0303B' },
};
export const EXEC_STATUS_OPTS = ['لم تبدأ', 'مكتمل', 'متأخر'];

// Notification kinds + icons
export const NK: Record<string, { bg: string; c: string }> = {
  warn: { bg: '#FFF3DE', c: '#B45309' },
  alert: { bg: '#FCEEEF', c: '#D23B45' },
  ok: { bg: '#E3F6EC', c: '#0B8A4B' },
  info: { bg: '#E5EEFF', c: '#2563EB' },
};
export const NIC: Record<string, string> = {
  clock: 'M12 8v4l2.5 1.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5 5l-3 7v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3-7z',
  wallet: 'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z',
  rotate: 'M3 2v6h6M21 12A9 9 0 0 0 6 5.3L3 8M21 22v-6h-6M3 12a9 9 0 0 0 15 6.7l3-2.7',
  check: 'M20 6 9 17l-5-5',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
};

// Log action map
export const ALOG: Record<string, { t: string; c: string }> = {
  submit: { t: 'أرسل للاعتماد', c: '#2563EB' },
  approve: { t: 'اعتمد', c: '#0B8A4B' },
  pending: { t: 'قيد الاعتماد', c: '#B45309' },
  reject: { t: 'رفض', c: '#C0303B' },
  info: { t: 'طلب تفاصيل إضافية', c: '#B45309' },
  budget: { t: 'أرسل الميزانية ونطاق العمل', c: '#2563EB' },
  nominate: { t: 'رشّح للتمويل', c: '#0E7C86' },
  fund: { t: 'اعتمد التمويل', c: '#0B8A4B' },
  unfund: { t: 'ألغى التمويل', c: '#C0303B' },
  declineNom: { t: 'رفض الترشيح', c: '#C0303B' },
  cancelFund: { t: 'ألغى التمويل', c: '#C0303B' },
};

// ============================================================================
// Item model
// ============================================================================
export type Phase = {
  name: string;
  start?: string;
  end?: string;
  owner?: string;
  status?: string;
  approval?: string;
  outcome?: string;
  notes?: string;
  period?: string;
  desc?: string;
  fixed?: boolean;
  subs?: { name: string; start?: string; end?: string; date?: string }[];
};
export type Launch = {
  title: string;
  ltype: string;
  date: string;
  desc?: string;
  phase?: string;
  status?: string;
  notes?: string;
  done?: boolean;
  doneAt?: number;
  shared?: boolean;
};
export type ExecItem = {
  key: string;
  label: string;
  status: string;
  newDate?: string;
  reason?: string;
};
export type LogEntry = {
  action: string;
  by: string;
  role: string;
  at: number;
  note?: string;
};
export type Nom = { by: string; role: string; path: string; at: number; direct?: boolean };
export type Funded = { by: string; at: number; direct?: boolean };
export type FundCancel = { by: string; at: number; reason: string };
// one نشاط (ops/strategy) or one خدمة فرعية (services) with its OWN details —
// the repeatable unit of every entry form
export type ActivityDetail = {
  name: string;
  sector?: string;
  dept?: string;
  section?: string;
  // ops automation
  isAutomated?: string; // نعم / لا
  // strategy automation
  automationLevel?: string; // مؤتمتة كلياً / جزئياً / غير مؤتمتة
  automationSystem?: string;
  automationPct?: number;
  // strategy matrix (1-5 each + المخاطر)
  importance?: string;
  usageIntensity?: string;
  readinessLevel?: string;
  impactScore?: string;
  transformScore?: string;
  outputClarity?: string;
  riskLevel?: string;
  // services matrix
  complexity?: string;
  // أولوية التحول — manual yes/no in ops, derived from the matrix in stg/svc
  transformYes?: string;
  // نموذج حصر العمليات: فترة التحويل، أولويات التحول (قائمة يدوية مؤقتاً)
  transformPeriod?: string;
  transformPriority?: string;
  notes?: string;
  // دفعة الإطلاق of THIS نشاط + its own window-bounded dates. Activities of
  // one entry may sit in different دفعات; the item's own execBatch mirrors
  // the first activity so item-level consumers keep working.
  execBatch?: string;
  startDate?: string;
  endDate?: string;
  // اعتماد التوزيع — دورة مستقلة عن اعتماد محتوى المدخل نفسه:
  // مسودة ← إرسال للاعتماد ← قيد اعتماد فريق عمل المسار ← معتمد (يُقفل التوزيع)
  // الإعادة/الرفض تُرجعه مسودةً مع سبب يظهر للمنسق.
  batchWf?: 'draft' | 'pending' | 'approved';
  batchRet?: 'info' | 'reject';
  batchNote?: string;
};

/** حالة توزيع نشاط على دفعته — undefined على نشاط موزَّع قديم تعني مسودة */
export type PlacementState = 'none' | 'draft' | 'pending' | 'approved';
export function placementState(i: Item, a: ActivityDetail): PlacementState {
  if (!activityBatch(i, a)) return 'none';
  return a.batchWf || 'draft';
}

/** التوزيع المعتمد مقفل — لا نقل ولا إزالة ولا تعديل تواريخ */
export const placementLocked = (i: Item, a: ActivityDetail): boolean => {
  const st = placementState(i, a);
  return st === 'approved' || st === 'pending';
};

export const PLACEMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'توزيع مسودة', color: '#5A6B86', bg: '#EEF2F8' },
  pending: { label: 'قيد اعتماد التوزيع', color: '#B45309', bg: '#FFF7EB' },
  approved: { label: 'توزيع معتمد', color: '#0B8A4B', bg: '#EAF7F0' },
  returned: { label: 'توزيع مُعاد للتعديل', color: '#B45309', bg: '#FFF3DE' },
  rejected: { label: 'توزيع مرفوض', color: '#C0303B', bg: '#FDECEE' },
};

export function placementChip(i: Item, a: ActivityDetail): { label: string; color: string; bg: string; note?: string } | null {
  const st = placementState(i, a);
  if (st === 'none') return null;
  if (st === 'draft' && a.batchRet) {
    const c = PLACEMENT_STATUS[a.batchRet === 'reject' ? 'rejected' : 'returned'];
    return { ...c, note: a.batchNote };
  }
  return { ...PLACEMENT_STATUS[st] };
}

/** effective دفعة of one نشاط — its own, else the parent entry's */
export function activityBatch(i: Item, a: ActivityDetail): string {
  // an explicit '' means «removed from its دفعة»; only an UNSET value inherits
  // the entry's batch (legacy rows written before per-نشاط batches)
  return a.execBatch !== undefined ? (a.execBatch || '').trim() : (i.execBatch || '').trim();
}

export type Ret = { type: 'info' | 'reject'; from: string; note: string; gate?: string };

export type Item = {
  id: string;
  wf: WfState;
  type: ItemType;
  title: string;
  desc: string;
  path: string;
  approval: string;
  priority?: string;
  rank?: number;
  complexity?: string;
  impact?: string;
  status?: string;
  entity?: string;
  transformability?: string;
  readiness?: string | number;
  usageIntensity?: string;
  transformPriority?: string;
  transformPeriod?: string;
  automationPct?: number;
  automationLevel?: string;
  automationSystem?: string;
  // المدة الزمنية للإنجاز قبل/بعد التحويل (للعمليات والخدمات فقط)
  durationBefore?: string;
  durationAfter?: string;
  complexityLevel?: string;
  progress?: number;
  scopeOfWork?: string;
  budget?: string;
  scopeApproval?: string;
  scopeFile?: string;
  expectedOutputs?: string;
  expectedOutcomes?: string;
  expectedImpact?: string;
  aiModels?: number;
  targetPct?: number;
  endDate?: string;
  startDate?: string;
  agentNature?: string;
  linkedToService?: string;
  linkedServiceName?: string;
  // services stream: distinguishes «باقات الخدمات» from a single «خدمة»
  serviceBundle?: boolean;
  // services stream entry fields (الخدمة الفرعية + مدخلات مصفوفة الأولوية)
  subService?: string;
  readinessLevel?: string; // مستوى الجاهزية (خدمات: منخفض/متوسط/مرتفع · مهام: 1-5)
  transformYes?: string; // أولوية التحول: نعم / لا
  // strategy stream task fields (حصر قائمة المهام)
  axis?: string; // المحور (قائمة من 7 محاور)
  importance?: string; // مستوى الأهمية 1-5
  impactScore?: string; // مستوى الأثر المتوقع من التحول 1-5
  transformScore?: string; // قابلية التحول: قابل كلياً / جزئياً / غير قابل
  outputClarity?: string; // وضوح المخرجات وقابليتها للمراجعة 1-5
  riskLevel?: string; // مستوى المخاطر: منخفض / متوسط / عالي
  selPriority?: string; // أولوية الاختيار: عالية / متوسطة / منخفضة
  // operations stream entry fields (حصر قائمة العمليات)
  isAutomated?: string; // هل النشاط/العملية مؤتمت؟ نعم / لا
  notes?: string; // الملاحظات
  // per-نشاط full details (ops/strategy: الأنشطة، services: الخدمات الفرعية).
  // Each child carries its own sector/dept/section, automation, matrix and
  // أولوية التحول; the legacy flat fields mirror the FIRST entry for
  // compatibility with older records and read surfaces.
  activities?: ActivityDetail[];
  // operation-specific
  opType?: string;
  supportFn?: string; // نوع عملية الدعم المؤسسي (عند اختيار عمليات الدعم المؤسسي)
  subActivities?: string;
  fedEntity?: string;
  sector?: string;
  dept?: string;
  section?: string;
  steps?: Record<string, string>[];
  // service-specific
  serviceOwner?: string;
  targetUsers?: string;
  currentJourney?: string;
  painPoints?: string;
  expectedImprovement?: string;
  // execution batch the coordinator selects for this item (predefined milestone)
  execBatch?: string;
  // managed launch plans this item is attached to — one batch per item, but
  // an item may participate in SEVERAL launches within that batch
  launchPlanIds?: string[];
  // set when the item is moved between مراحل — drives stakeholder notifications
  stageMove?: { from: string; to: string; at: number; by: string } | null;
  /** @deprecated legacy single-plan field, migrated to launchPlanIds on hydrate */
  launchPlanId?: string;
  // nested
  phases?: Phase[];
  milestones?: Record<string, unknown>[];
  launches?: Launch[];
  execChecklist?: ExecItem[];
  links?: string[];
  log?: LogEntry[];
  ret?: Ret | null;
  nom?: Nom | null;
  funded?: Funded | null;
  fundCancel?: FundCancel | null;
  fyi?: { by: string; at: number } | null;
  stage?: string;
};

// ============================================================================
// 3. Workflow
// ============================================================================
export function wfOf(i: Item): WfState {
  if (i.wf === 'pm1' || i.wf === 'pm2') return 'exec'; // legacy coercion
  if (i.wf) return i.wf;
  if ((i.progress || 0) >= 100) return 'done';
  if (i.stage === 'tracking' || i.scopeApproval === 'معتمد') return 'exec';
  if (i.approval === 'معتمد') return 'pm1';
  if (i.approval === 'تم الإرسال' || i.approval === 'قيد المراجعة') return 'ent1';
  return 'draft';
}

export type WfMeta = { step: number; label: string; who: string; chip: string; bg: string };
export const WFMETA: Record<string, WfMeta> = {
  draft: { step: 1, label: 'مسودة', who: 'path', chip: '#64748B', bg: '#EFF2F7' },
  ent1: { step: 1, label: 'قيد الاعتماد', who: 'path', chip: '#B45309', bg: '#FFF3DE' },
  pm1: { step: 2, label: 'قيد الاعتماد', who: 'ai', chip: '#B45309', bg: '#FFF3DE' },
  exec: { step: 3, label: 'معتمد', who: 'path', chip: '#0B8A4B', bg: '#EAF7F0' },
  launch: { step: 3, label: 'معتمد', who: 'path', chip: '#0B8A4B', bg: '#EAF7F0' },
  done: { step: 3, label: 'معتمد', who: '-', chip: '#0B8A4B', bg: '#EAF7F0' },
};
export const wfMeta = (i: Item): WfMeta => WFMETA[wfOf(i)] || WFMETA.draft;
export const stepIndexOf = (i: Item): number => wfMeta(i).step;

// Funding / nomination is only allowed once the item has passed the entity gate.
export const isEntityApproved = (i: Item): boolean =>
  ['exec', 'launch', 'done'].includes(wfOf(i));

// Stage-weighted completion (for the "نسبة الإنجاز" KPI).
export function stageWeight(i: Item): number {
  return (
    { draft: 0, ent1: 25, exec: 60, launch: 85, done: 100 } as Record<string, number>
  )[wfOf(i)] ?? 0;
}

// A returned item (has `ret`) surfaces a distinct amber status instead of "مسودة".
export const RETURNED_STATUS = 'للتعديل';
// a rejection is NOT a request for more info — it comes back to the
// coordinator as «تم الرفض» with the reason attached
export const REJECTED_STATUS = 'تم الرفض';
export const isRejected = (i: { ret?: { type?: string } | null }): boolean => i.ret?.type === 'reject';

// exec / launch completion gates
export function execAllDone(it: Item): boolean {
  const list = it.execChecklist || [];
  return list.every(
    (x) => x.status === 'مكتمل' || (x.status === 'متأخر' && !!(x.reason || '').trim())
  );
}
export function launchAllDone(it: Item): boolean {
  const list = it.launches || [];
  return list.length > 0 && list.every((l) => !!l.done);
}

// ============================================================================
// 4. Transformation recommendation score
// ============================================================================
export type Score = { v: number; label: string; ar: string; color: string; expl: string };
export function transformScore(i: Item): Score {
  const impact = ({ منخفض: 1, متوسط: 3, مرتفع: 5, 'عالٍ': 5 } as Record<string, number>)[
    i.impact || ''
  ] || 3;
  const feas =
    ({ 'غير قابل للتحول': 1, 'قابل جزئياً': 3, 'قابل كلياً': 5, 'قابل بالكامل': 5 } as Record<
      string,
      number
    >)[i.transformability || ''] || 3;
  const rd = i.readiness;
  let rdScore: number;
  if (typeof rd === 'number') {
    rdScore = rd < 20 ? 1 : rd < 50 ? 2 : rd <= 80 ? 4 : 5;
  } else {
    rdScore =
      ({
        'الجاهزية للتحول بنسبة 30% فأقل': 1,
        'الجاهزية للتحول بنسبة بين 30% إلى 50%': 2,
        'الجاهزية للتحول بنسبة بين 50% إلى 80%': 4,
        'الجاهزية للتحول بنسبة 80% فأكثر': 5,
      } as Record<string, number>)[rd || ''] || 3;
  }
  const usage = ({ منخفضة: 1, متوسطة: 3, عالية: 5 } as Record<string, number>)[
    i.usageIntensity || ''
  ] || 3;
  const prio = ({ منخفضة: 1, متوسطة: 3, عالية: 5 } as Record<string, number>)[
    i.transformPriority || i.priority || ''
  ] || 3;
  const autoOpp = Math.max(1, Math.min(5, 5 - ((i.automationPct || 0) * 4) / 100));
  const cxEase = ({ منخفض: 5, متوسط: 3, مرتفع: 1, 'عالٍ': 1 } as Record<string, number>)[
    i.complexity || ''
  ] || 3;

  let score =
    impact * 0.25 +
    feas * 0.2 +
    rdScore * 0.15 +
    usage * 0.15 +
    prio * 0.1 +
    autoOpp * 0.1 +
    cxEase * 0.05;
  const bonus = ({ 1: 0.2, 2: 0.1, 3: 0.05 } as Record<number, number>)[Number(i.rank)] || 0;
  score = Math.min(5, score + bonus);
  const v = Math.round(score * 10) / 10;

  const top: [string, number][] = [
    ['الأثر', impact],
    ['القابلية', feas],
    ['الجاهزية', rdScore],
    ['الاستخدام', usage],
  ].sort((a, b) => (b[1] as number) - (a[1] as number)) as [string, number][];

  let label: string, ar: string, color: string, expl: string;
  if (v >= 4.2) {
    label = 'Recommended 100%';
    ar = 'موصى به 100%';
    color = '#0B8A4B';
    expl =
      'يُنصح بالتحول — ' +
      top[0][0] +
      ' و' +
      top[1][0] +
      ' مرتفعان؛ يُنصح بالتحول الفوري وفق الطاقة المتاحة';
  } else if (v >= 2.0) {
    label = 'Waitlist';
    ar = 'قائمة الانتظار';
    color = '#B45309';
    expl = 'تبقى في قائمة الانتظار، ويُحدَّد ترتيبها وفق أولوية الجهة والجاهزية والأثر وسهولة التعقيد';
  } else {
    label = 'Not Recommended';
    ar = 'غير موصى به';
    color = '#DC2B38';
    expl = 'درجة منخفضة — ' + top[3][0] + ' و' + top[2][0] + ' منخفضان؛ لا يُنصح بالتحول حالياً';
  }
  return { v, label, ar, color, expl };
}

// ============================================================================
// 5. Program phases & execution milestones
// ============================================================================
export type ProgramPhase = { n: string; d: string; deadline: string };
export const DEFAULT_PROGRAM_PHASES: ProgramPhase[] = [
  {
    n: 'حصر واختيار أولويات التحول الذكي',
    d: 'تحديد العمليات والمشاريع والخدمات ونطاق العمل والميزانية المطلوبة حسب المسارات المعتمدة',
    deadline: '2026-07-15',
  },
  {
    n: 'اعتماد ممثل الجهة لأولويات التحول',
    d: 'مراجعة واعتماد ممثل الجهة للأولويات وفقاً للأثر والجاهزية والقيمة المضافة',
    deadline: '2026-08-10',
  },
  {
    n: 'تنفيذ واختبار التحول والإطلاق',
    d: 'تنفيذ المراحل، إكمال بناء الوكلاء والاختبار وقوائم الإطلاق ومتابعة التقدّم',
    deadline: '2026-12-20',
  },
];

// مسار تقنيات الذكاء الاصطناعي والبيانات — له برنامج زمني مختلف
export const AI_STREAM_ID = 'tech';

const MS = (name: string, period: string, desc: string, start: string, end: string): Phase => ({
  name,
  period,
  desc,
  start,
  end,
  status: 'لم تبدأ',
  fixed: true,
  subs: [{ name: '', start: '', end: '' }],
});

// البرنامج الزمني للبرنامج (٨ مراحل): يختلف مسار الذكاء الاصطناعي عن بقية
// المسارات — مرحلة تأسيسية بعد التقييم وخمس دفعات بمواعيد مزاحة، بينما بقية
// المسارات ست دفعات، وتنتهي جميعها بمرحلة «التوسع في التطبيق».
export function execMilestones(streamId?: string | null): Phase[] {
  const assess = MS('التقييم والتهيئة', 'يونيو – أغسطس 2026', 'تقييم الوضع الحالي وتحديد الأولويات', '2026-06-01', '2026-08-31');
  const expand = MS('التوسع في التطبيق', 'مارس – مايو 2028', 'التوسع في تطبيق النماذج والأنظمة على نطاق أوسع', '2028-03-01', '2028-05-31');
  if (streamId === AI_STREAM_ID) {
    return [
      assess,
      MS('المرحلة التأسيسية', 'سبتمبر – نوفمبر 2026', 'بناء الأساس التقني والبنية المؤسسية للمساعد الذكي', '2026-09-01', '2026-11-30'),
      MS('إطلاق الدفعة الأولى', 'ديسمبر 2026 – فبراير 2027', 'تطوير وإطلاق أول النماذج', '2026-12-01', '2027-02-28'),
      MS('إطلاق الدفعة الثانية', 'مارس – مايو 2027', 'تطوير نماذج إضافية', '2027-03-01', '2027-05-31'),
      MS('إطلاق الدفعة الثالثة', 'يونيو – أغسطس 2027', 'توسيع التطبيق ليشمل خدمات جديدة', '2027-06-01', '2027-08-31'),
      MS('إطلاق الدفعة الرابعة', 'سبتمبر – نوفمبر 2027', 'إطلاق خدمات الذكاء الاصطناعي للمتعاملين', '2027-09-01', '2027-11-30'),
      MS('إطلاق الدفعة الخامسة', 'ديسمبر 2027 – فبراير 2028', 'استكمال إطلاق النماذج والأنظمة', '2027-12-01', '2028-02-29'),
      expand,
    ];
  }
  return [
    assess,
    MS('إطلاق الدفعة الأولى', 'سبتمبر – نوفمبر 2026', 'تطوير وإطلاق أول 3 نماذج', '2026-09-01', '2026-11-30'),
    MS('إطلاق الدفعة الثانية', 'ديسمبر 2026 – فبراير 2027', 'تطوير 4 نماذج إضافية', '2026-12-01', '2027-02-28'),
    MS('إطلاق الدفعة الثالثة', 'مارس – مايو 2027', 'توسيع التطبيق ليشمل 5 خدمات جديدة', '2027-03-01', '2027-05-31'),
    MS('إطلاق الدفعة الرابعة', 'يونيو – أغسطس 2027', 'إطلاق خدمات الذكاء الاصطناعي للمتعاملين', '2027-06-01', '2027-08-31'),
    MS('إطلاق الدفعة الخامسة', 'سبتمبر – نوفمبر 2027', 'توسعة نطاق التحول على مستوى الجهات', '2027-09-01', '2027-11-30'),
    MS('إطلاق الدفعة السادسة', 'ديسمبر 2027 – فبراير 2028', 'استكمال إطلاق النماذج والأنظمة المتبقية', '2027-12-01', '2028-02-29'),
    expand,
  ];
}

// Launch-eligible batches (الدفعات) — assessment/foundation/expansion excluded
export function launchBatches(streamId?: string | null): Phase[] {
  return execMilestones(streamId).filter((b) => b.name.startsWith('إطلاق الدفعة'));
}

// فترة التحويل للذكاء الاصطناعي المساعد (مسار العمليات): قائمة «الدفعة -
// الشهر» مشتقة من دفعات الإطلاق المعتمدة وحدود كل دفعة الزمنية
const PERIOD_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function opsPeriodOptions(): string[] {
  const out: string[] = [];
  for (const b of launchBatches()) {
    const short = b.name.replace('إطلاق ', '');
    const from = new Date(b.start + 'T00:00:00');
    const to = new Date(b.end + 'T00:00:00');
    for (let d = new Date(from); d <= to; d.setMonth(d.getMonth() + 1)) {
      out.push(short + ' - ' + PERIOD_MONTHS[d.getMonth()]);
    }
  }
  return out;
}

// stream-aware alias: مسار الذكاء الاصطناعي خمس دفعات، والبقية ست
export function streamLaunchBatches(streamId?: string | null): Phase[] {
  return launchBatches(streamId);
}

// «الدفعة الأولى…السادسة» display label for a batch name
export function batchDafaaLabel(name: string): string {
  return name.replace(/^إطلاق /, '');
}

// Centrally managed launch plan (defined per batch via "إدارة خطط الإطلاق")
export type LaunchPlan = {
  id: string;
  batch: string; // batch name (إطلاق المرحلة الأولى…الرابعة)
  title: string;
  ltype: string;
  date: string;
  desc: string;
  // cost can live at the launch level: one scope + estimated budget for the
  // group of operations/services (or projects) transformed together.
  // `budget` is the EXECUTION cost — this is what the committee funds and
  // what all committee totals count. `launchBudget` is the launch/event cost,
  // informational for the entity rep only (never aggregated for funding).
  scope?: string;
  budget?: string;
  launchBudget?: string;
};

// Expected result (النتائج المتوقعة) — defined at the stream level. Each result
// is an open-text statement plus the set of items (inputs) that support it.
export type ExpectedResult = {
  id: string;
  text: string;
  itemIds: string[];
  path?: string; // owning stream
};

export function seedExpectedResults(): ExpectedResult[] {
  if (process.env.NEXT_PUBLIC_DEMO_DATA !== '1') return [];
  return [
    { id: 'er-1', text: 'رفع نسبة إنجاز المعاملات الحكومية آلياً دون تدخل بشري إلى 80%.', itemIds: [], path: 'services' },
    { id: 'er-2', text: 'تقليص زمن دورة العمليات المؤسسية بمقدار النصف عبر مساعدي الذكاء الاصطناعي.', itemIds: [], path: 'ops' },
  ];
}


// item launches derived from its attached (managed) launch plans
export function launchesFromPlans(ids: string[] | undefined, plans: LaunchPlan[]): Launch[] {
  return (ids || [])
    .map((id) => plans.find((p) => p.id === id))
    .filter((p): p is LaunchPlan => !!p)
    .map((p) => ({
      title: p.title,
      ltype: p.ltype,
      date: p.date,
      desc: p.desc,
      shared: true,
      status: 'مخطط',
      done: false,
    }));
}

// Item execution state set by the coordinator during creation
export const START_STATES = ['لم يبدأ بعد', 'قيد التنفيذ', 'مكتمل'];

export const TWO_STEP_PHASES: ProgramPhase[] = [
  {
    n: 'اعتماد اختيار أولويات التحول الذكي',
    d: 'مراجعة واعتماد أولويات التحول الذكي وفقاً للأثر والجاهزية والقيمة المضافة',
    deadline: '2026-08-10',
  },
  {
    n: 'تنفيذ واختبار التحول والإطلاق',
    d: 'تنفيذ المراحل والاختبار وقوائم الإطلاق ومتابعة التقدّم',
    deadline: '2026-12-20',
  },
];

// launch types
export const LAUNCH_TYPES = [
  'إطلاق منتج / خدمة',
  'إعلان رسمي',
  'مؤتمر / فعالية',
  'شراكة استراتيجية',
  'أخرى',
];

// ============================================================================
// Date / countdown utilities
// ============================================================================
const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];
export function fmtDate(d?: string | number): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return `${dt.getDate()} ${AR_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}
export function daysLeft(d: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(d).getTime() - now) / 86400000));
}
export type Countdown = {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  hh: string;
  mm: string;
  ss: string;
};
export function countdown(deadline: string, now = Date.now()): Countdown {
  const end = new Date(deadline + 'T23:59:59').getTime();
  let diff = Math.max(0, end - now);
  const days = Math.floor(diff / 86400000);
  diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  const mins = Math.floor(diff / 60000);
  diff -= mins * 60000;
  const secs = Math.floor(diff / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { days, hours, mins, secs, hh: pad(hours), mm: pad(mins), ss: pad(secs) };
}

// ============================================================================
// Blank item / owner factories
// ============================================================================
export const blankOwner = () => ({
  name: '',
  position: '',
  email: '',
  phone: '',
  self: false,
});

export function blankItem(type: ItemType, path: string): Item {
  const base: Item = {
    id: 'n' + Date.now(),
    wf: 'draft',
    type,
    title: '',
    desc: '',
    path,
    approval: 'مسودة',
    stage: 'build',
    priority: 'متوسطة',
    complexity: 'متوسط',
    impact: 'متوسط',
    progress: 0,
    aiModels: 0,
    targetPct: 0,
    rank: 0,
    execChecklist: [
      { key: 'agents', label: 'بناء النظام الوكيلي', status: 'لم تبدأ', newDate: '', reason: '' },
      { key: 'testing', label: 'الاختبار وضمان الجودة', status: 'لم تبدأ', newDate: '', reason: '' },
      { key: 'pilot', label: 'الإطلاق', status: 'لم تبدأ', newDate: '', reason: '' },
    ],
    phases: execMilestones(path),
    milestones: [],
    launches: [],
    links: [],
  };
  if (type === 'operation') {
    Object.assign(base, {
      status: path === 'strategy' ? 'مهمة جديدة' : 'عملية جديدة',
      opType: path === 'strategy' ? 'المهام التخصصية' : 'العمليات التخصصية',
      subActivities: '',
      sector: '',
      dept: '',
      section: '',
      automationLevel: 'لا',
      automationPct: 0,
      automationSystem: '',
      usageIntensity: 'متوسطة',
      complexityLevel: 'متوسط',
      durationBefore: '',
      durationAfter: '',
      readiness: 60,
      transformability: 'قابل جزئياً',
      transformPriority: 'متوسطة',
      steps: [],
    });
  } else if (type === 'service') {
    Object.assign(base, {
      status: 'خدمة جديدة',
      serviceOwner: '',
      targetUsers: '',
      currentJourney: '',
      painPoints: '',
      expectedImprovement: '',
      automationLevel: 'لا',
      automationPct: 0,
      usageIntensity: 'متوسطة',
      durationBefore: '',
      durationAfter: '',
      transformability: 'قابل جزئياً',
      transformPriority: 'متوسطة',
      readiness: 60,
    });
  } else {
    Object.assign(base, {
      status: 'مشروع جديد',
      expectedOutputs: '',
      expectedOutcomes: '',
      expectedImpact: '',
      transformability: 'قابل جزئياً',
      transformPriority: 'متوسطة',
      readiness: 60,
      usageIntensity: 'متوسطة',
    });
  }
  return base;
}

// Predefined committee funding allocation (approved budget ceiling), in درهم.
export const APPROVED_BUDGET = 100_000_000;

// Parse a free-text budget string ("4,500,000 درهم") into a number.
export function parseBudget(b?: string): number {
  const n = parseInt((b || '').replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

// Format a currency amount for display (abbreviates millions).
export function formatMoney(n: number): string {
  const fmt = (v: number) => {
    const r = Math.round(v * 10) / 10;
    return Number.isInteger(r) ? r.toLocaleString('en-US') : r.toFixed(1);
  };
  if (n >= 1_000_000_000) return fmt(n / 1_000_000_000) + ' مليار درهم';
  if (n >= 1_000_000) return fmt(n / 1_000_000) + ' مليون درهم';
  return n.toLocaleString('en-US') + ' درهم';
}

export const SEED_V = process.env.NEXT_PUBLIC_DEMO_DATA === '1' ? 'demo6' : 'v6';
export const DEFAULT_ENTITY = 'وزارة شؤون مجلس الوزراء';
export const ALT_ENTITY = 'هيئة الإمارات للهوية والجنسية';

// entity resolver — mock items carry `entity` explicitly; default to the
// session entity (the old prototype id-based hack is gone with the new seed)
export function entOf(i: Item, entityName = DEFAULT_ENTITY): string {
  return i.entity || entityName;
}
