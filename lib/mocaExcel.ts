// ============================================================================
// قالب واستيراد ملف «حصر المهام والعمليات» — نسخة وزارة شؤون مجلس الوزراء
// القالب مطابق للملف المعتمد: صف اسم الجهة، صف المجموعات، صف العناوين،
// وورقة «المعادلات» بخيارات القوائم — مع إضافة تحقق الإدخال على الأعمدة
// ذات الخيارات حتى تظهر القوائم المنسدلة في Excel.
// ============================================================================
import {
  MOCA_EXCEL_HEADERS,
  MOCA_EXCEL_GROUPS,
  MOCA_FIELDS,
  MOCA_SPECIALIZATION,
  MOCA_USAGE_INTENSITY,
  MOCA_TRANSFORMABILITY,
  MOCA_READINESS,
  MOCA_PRIORITY,
  MOCA_IMPACT,
  MOCA_COMPLEXITY,
  mocaMissing,
  type MocaEntry,
} from './moca';

const SHEET = 'المهام والعمليات';
const LOOKUP = 'المعادلات';
const HEADER_ROW = 3;
const FIRST_DATA_ROW = 4;

// عمود لكل حقل بالترتيب نفسه الذي في الملف
const FIELD_ORDER = MOCA_FIELDS.map((f) => f.key);

const colLetter = (n: number): string => {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const COL_WIDTHS = [23.5, 21, 18.5, 17, 10, 12, 12, 12, 10.5, 10.5, 11.5, 13.5, 14.5, 16.5, 15, 14.5, 16, 13, 14];

/** ينشئ القالب (أو يصدّر المدخلات إذا مُرِّرت) وينزّله في المتصفح */
export async function mocaDownloadTemplate(unitLabel: string, entries?: MocaEntry[]) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.views = [{ x: 0, y: 0, width: 20000, height: 20000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];

  const ws = wb.addWorksheet(SHEET, { views: [{ rightToLeft: true, state: 'frozen', ySplit: HEADER_ROW }] });
  const lk = wb.addWorksheet(LOOKUP, { views: [{ rightToLeft: true }] });

  // ---- ورقة المعادلات: خيارات القوائم ----
  lk.getCell(1, 1).value = 'هل تعتبر تخصصية أو مشتركة؟';
  MOCA_SPECIALIZATION.forEach((v, i) => (lk.getCell(2 + i, 1).value = v));
  lk.getCell(1, 2).value = 'كثافة الاستخدام';
  MOCA_USAGE_INTENSITY.forEach((v, i) => (lk.getCell(2 + i, 2).value = v));
  const heads2 = [
    'القابلية للتحول للذكاء الاصطناعي المساعد',
    'الجاهزية للتحول للذكاء الاصطناعي المساعد',
    'أولوية التحول للذكاء الاصطناعي المساعد',
    'مستوى  الأثر المتوقع من التحول',
    'تقييم مستوى التعقيد',
  ];
  heads2.forEach((h, i) => (lk.getCell(5, 1 + i).value = h));
  const lists = [MOCA_TRANSFORMABILITY, MOCA_READINESS, MOCA_PRIORITY, MOCA_IMPACT, MOCA_COMPLEXITY];
  lists.forEach((list, ci) => list.forEach((v, ri) => (lk.getCell(6 + ri, 1 + ci).value = v)));
  lk.columns.forEach((c) => (c.width = 34));
  [1, 5].forEach((r) => {
    for (let c = 1; c <= 5; c++) {
      const cell = lk.getCell(r, c);
      if (!cell.value) continue;
      cell.font = { bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2F8' } };
    }
  });

  // ---- الصف 1: اسم الجهة أو المكتب ----
  const last = colLetter(MOCA_EXCEL_HEADERS.length);
  ws.mergeCells(`A1:${last}1`);
  const c1 = ws.getCell('A1');
  c1.value = 'اسم الجهة أو المكتب: ' + unitLabel;
  c1.font = { bold: true, size: 13, color: { argb: 'FF13213C' } };
  c1.alignment = { horizontal: 'center', vertical: 'middle' };
  c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDE8FA' } };
  ws.getRow(1).height = 26;

  // ---- الصف 2: مجموعات الأعمدة ----
  let start = 1;
  for (const g of MOCA_EXCEL_GROUPS) {
    const from = colLetter(start);
    const to = colLetter(start + g.span - 1);
    ws.mergeCells(`${from}2:${to}2`);
    const cell = ws.getCell(`${from}2`);
    cell.value = g.label;
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F5FE0' } };
    start += g.span;
  }
  ws.getRow(2).height = 24;

  // ---- الصف 3: عناوين الأعمدة ----
  MOCA_EXCEL_HEADERS.forEach((h, i) => {
    const cell = ws.getCell(HEADER_ROW, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10.5, color: { argb: 'FF13213C' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2F8' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFC9D4E5' } },
      bottom: { style: 'thin', color: { argb: 'FFC9D4E5' } },
      left: { style: 'thin', color: { argb: 'FFC9D4E5' } },
      right: { style: 'thin', color: { argb: 'FFC9D4E5' } },
    };
  });
  ws.getRow(HEADER_ROW).height = 52;
  COL_WIDTHS.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  // ---- البيانات (عند التصدير) ----
  const rows = entries || [];
  rows.forEach((e, ri) => {
    FIELD_ORDER.forEach((k, ci) => {
      ws.getCell(FIRST_DATA_ROW + ri, ci + 1).value = (e[k] as string | number | undefined) ?? '';
    });
  });

  // ---- القوائم المنسدلة على أعمدة الخيارات ----
  const dvEnd = FIRST_DATA_ROW + Math.max(rows.length, 400);
  const selectCols: { key: string; ref: string }[] = [
    { key: 'specialization', ref: `'${LOOKUP}'!$A$2:$A$3` },
    { key: 'usageIntensity', ref: `'${LOOKUP}'!$B$2:$B$4` },
    { key: 'transformability', ref: `'${LOOKUP}'!$A$6:$A$8` },
    { key: 'readiness', ref: `'${LOOKUP}'!$B$6:$B$9` },
    { key: 'priority', ref: `'${LOOKUP}'!$C$6:$C$7` },
    { key: 'impact', ref: `'${LOOKUP}'!$D$6:$D$8` },
    { key: 'complexity', ref: `'${LOOKUP}'!$E$6:$E$8` },
  ];
  for (const sc of selectCols) {
    const ci = FIELD_ORDER.indexOf(sc.key) + 1;
    if (ci <= 0) continue;
    for (let r = FIRST_DATA_ROW; r <= dvEnd; r++) {
      ws.getCell(r, ci).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [sc.ref],
        showErrorMessage: true,
        errorTitle: 'قيمة غير مقبولة',
        error: 'اختر قيمة من القائمة المنسدلة',
      };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (entries ? 'حصر المهام والعمليات - ' : 'نموذج حصر المهام والعمليات - ') + unitLabel + '.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

const cellText = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    const o = v as { richText?: { text: string }[]; text?: string; result?: unknown };
    if (Array.isArray(o.richText)) return o.richText.map((t) => t.text).join('').trim();
    if (o.text) return String(o.text).trim();
    if (o.result !== undefined) return String(o.result).trim();
    return '';
  }
  return String(v).trim();
};

const norm = (s: string) => s.replace(/\s+/g, ' ').replace(/[?؟:]/g, '').trim();

/**
 * يقرأ ملف الحصر ويعيد صفوفاً جاهزة للمراجعة.
 * يقبل الملف المعتمد كما هو: العناوين في الصف 3 والبيانات من الصف 4.
 * وإن اختلف موضع العناوين يبحث عنها في أول 10 صفوف.
 */
export async function mocaParseWorkbook(buf: ArrayBuffer): Promise<{ rows: { data: Partial<MocaEntry>; missing: string[] }[]; error: string }> {
  let ExcelJS: typeof import('exceljs');
  try {
    ExcelJS = (await import('exceljs')).default;
  } catch {
    // فشل تحميل مكوّن القراءة (نسخة موقع محدثة بعد فتح الصفحة) — رسالة إرشادية
    return { rows: [], error: 'تعذر تحميل أدوات قراءة الملف — حدّث الصفحة (Ctrl+F5) ثم أعد المحاولة' };
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.getWorksheet(SHEET) || wb.worksheets.find((w) => w.name !== LOOKUP) || wb.worksheets[0];
  if (!ws) return { rows: [], error: 'تعذّرت قراءة الملف — لم يُعثر على ورقة بيانات' };

  // موضع صف العناوين
  let headerRow = 0;
  for (let r = 1; r <= Math.min(ws.rowCount, 10); r++) {
    for (let c = 1; c <= Math.min(ws.columnCount, 40); c++) {
      if (norm(cellText(ws.getCell(r, c).value)) === norm(MOCA_EXCEL_HEADERS[0])) {
        headerRow = r;
        break;
      }
    }
    if (headerRow) break;
  }
  if (!headerRow) return { rows: [], error: 'الملف لا يطابق نموذج حصر المهام والعمليات — تأكد من استخدام النموذج المرفق' };

  // ربط كل عنوان بعموده
  const colOf: Record<string, number> = {};
  for (let c = 1; c <= Math.min(ws.columnCount, 60); c++) {
    const h = norm(cellText(ws.getCell(headerRow, c).value));
    if (!h) continue;
    const idx = MOCA_EXCEL_HEADERS.findIndex((x) => norm(x) === h);
    if (idx >= 0 && colOf[FIELD_ORDER[idx]] === undefined) colOf[FIELD_ORDER[idx]] = c;
  }
  if (colOf.mainProcess === undefined || colOf.subProcess === undefined)
    return { rows: [], error: 'أعمدة النموذج غير مكتملة — نزّل النموذج من الصفحة وأعد المحاولة' };

  const rows: { data: Partial<MocaEntry>; missing: string[] }[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const data: Partial<MocaEntry> = {};
    let any = false;
    for (const [key, c] of Object.entries(colOf)) {
      const v = cellText(ws.getCell(r, c).value);
      if (v) any = true;
      data[key] = key === 'automationPct' ? v.replace(/[^\d.]/g, '') : v;
    }
    if (!any) continue;
    rows.push({ data, missing: mocaMissing(data) });
  }
  if (!rows.length) return { rows: [], error: 'لا توجد صفوف بيانات في الملف' };
  return { rows, error: '' };
}
