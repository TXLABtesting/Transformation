// ============================================================================
// فحص سجل الجهات: يجب أن يطابق الوثيقة المعتمدة تماماً —
// ٤٣ جهة اتحادية + وزارة شؤون مجلس الوزراء، بلا زيادة ولا نقصان.
// يفشل أيضاً إن اشتُقّت خيارات الجهات في الواجهة من دليل الخدمات، فهو يحمل
// تجميعات وجهات محلية خارج النطاق.
//   node scripts/check-entity-register.mjs
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// ---- الوثيقة المعتمدة ------------------------------------------------------
const MINISTRIES = [
  'وزارة المالية', 'وزارة الداخلية', 'وزارة الخارجية', 'وزارة الصحة ووقاية المجتمع',
  'وزارة الدولة لشؤون المجلس الوطني الاتحادي', 'وزارة الطاقة والبنية التحتية',
  'وزارة الصناعة والتكنولوجيا المتقدمة', 'وزارة الرياضة', 'وزارة التجارة الخارجية',
  'وزارة تمكين المجتمع', 'وزارة التربية والتعليم', 'وزارة الاقتصاد والسياحة',
  'وزارة الموارد البشرية والتوطين', 'وزارة التعليم العالي والبحث العلمي', 'وزارة العدل',
  'وزارة الثقافة', 'وزارة الاستثمار', 'وزارة التغير المناخي والبيئة', 'وزارة الأسرة',
];
const AUTHORITIES = [
  'الهيئة الاتحادية للرقابة النووية', 'الهيئة الاتحادية للضرائب',
  'الهيئة العامة للمعاشات والتأمينات الاجتماعية', 'الهيئة العامة للطيران المدني',
  'الهيئة الاتحادية للموارد البشرية الحكومية', 'الهيئة العامة لتنظيم قطاع الاتصالات',
  'الهيئة الاتحادية للهوية والجنسية والجمارك وأمن المنافذ',
  'الهيئة العامة للشؤون الإسلامية والأوقاف والزكاة', 'الهيئة الوطنية للإعلام', 'هيئة سوق المال',
];
const OTHERS = [
  'مؤسسة الإمارات للخدمات الصحية', 'مؤسسة الإمارات للدواء', 'المؤسسة الاتحادية للشباب',
  'المركز الاتحادي للمعلومات الجغرافية', 'جامعة الإمارات العربية المتحدة', 'جامعة زايد',
  'مجمع كليات التقنية العليا', 'مصرف الإمارات العربية المتحدة المركزي', 'وكالة الإمارات للفضاء',
  'الجهاز الوطني لمكافحة المخدرات', 'أكاديمية أنور قرقاش الدبلوماسية', 'النيابة العامة الاتحادية',
  'مجلس تنافسية الكوادر الإماراتية', 'الاتحاد للمعلومات الائتمانية',
];
const EXPECTED = [...MINISTRIES, ...AUTHORITIES, ...OTHERS];
const MOCA = 'وزارة شؤون مجلس الوزراء';

// ---- السجل في الكود --------------------------------------------------------
const src = read('lib/entitiesOfficial.ts');
const block = src.slice(src.indexOf('OFFICIAL_ENTITIES: OfficialEntity[]'), src.indexOf('export const ENTITY_ALIASES'));
const rows = [...block.matchAll(/\{\s*name:\s*(?:'([^']+)'|(MOCA_ENTITY))[^}]*?\}/g)].map((m) => ({
  name: m[2] ? MOCA : m[1],
  pending: /pending:\s*true/.test(m[0]),
  category: (m[0].match(/category:\s*'([^']+)'/) || [])[1],
  order: Number((m[0].match(/order:\s*(\d+)/) || [])[1]),
}));
const active = rows.filter((r) => !r.pending);
const inScope = active.filter((r) => r.name !== MOCA).map((r) => r.name);

let fail = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fail++; };

console.log('— سجل الجهات —');
ok(inScope.length === EXPECTED.length, `عدد الجهات ضمن النطاق ${inScope.length} (المتوقّع ${EXPECTED.length})`);
const missing = EXPECTED.filter((n) => !inScope.includes(n));
const extra = inScope.filter((n) => !EXPECTED.includes(n));
ok(missing.length === 0, missing.length ? 'ناقصة: ' + missing.join('، ') : 'لا جهة ناقصة');
ok(extra.length === 0, extra.length ? 'زائدة: ' + extra.join('، ') : 'لا جهة زائدة');
ok(inScope.join('|') === EXPECTED.join('|'), 'الترتيب مطابق لترتيب الوثيقة');
ok(active.some((r) => r.name === MOCA), 'وزارة شؤون مجلس الوزراء ضمن السجل مفعّلة');

console.log('— التصنيفات —');
const catOf = (n) => (rows.find((r) => r.name === n) || {}).category;
ok(MINISTRIES.every((n) => catOf(n) === 'وزارة'), 'الوزارات التسع عشرة مصنّفة «وزارة»');
ok(AUTHORITIES.every((n) => catOf(n) === 'هيئة اتحادية'), 'الهيئات العشر مصنّفة «هيئة اتحادية»');
ok(OTHERS.every((n) => catOf(n) === 'أخرى'), 'الأربع عشرة الأخرى مصنّفة «أخرى»');

console.log('— خيارات الجهات في الواجهة —');
// دليل الخدمات يحمل أسماء خارج النطاق: لا يجوز اشتقاق خيار جهة منه
const catalog = Object.keys(JSON.parse(read('lib/svcCatalog.json')));
const outside = catalog.filter((n) => !EXPECTED.includes(n) && n !== MOCA);
console.log('    (دليل الخدمات يحمل ' + outside.length + ' اسماً خارج النطاق)');
const panel = read('components/CreatePanel.tsx');
const bulkPicker = panel.slice(panel.indexOf('اختر الجهة…'), panel.indexOf('تُنسب مدخلات الملف لهذه الجهة'));
ok(!/svcCatalogEntities/.test(bulkPicker), 'قائمة «الجهة الاتحادية» في الرفع بالنيابة لا تشتق من دليل الخدمات');
ok(/FEDERAL_ENTITIES/.test(bulkPicker), 'قائمة الرفع بالنيابة تعود للسجل المعتمد عند تعذّر قائمة القاعدة');

console.log(fail ? `\n${fail} فحص فاشل` : '\nكل الفحوص ناجحة');
process.exit(fail ? 1 : 0);
