import { stripHtml } from './richtext';
// ============================================================================
// Real client-side Excel (.xlsx) and PowerPoint (.pptx) export of the item
// list — replaces the prototype's CDN SheetJS / PptxGenJS with bundled deps.
// Libraries are dynamically imported so they stay out of the initial bundle.
// ============================================================================
import { type Item, typeLabel, pathById, wfMeta, transformScore, stageWeight, entOf } from './domain';

function row(i: Item, entityName: string) {
  return {
    النوع: typeLabel(i.type),
    العنوان: i.title,
    المسار: pathById(i.path).name,
    الجهة: entOf(i, entityName),
    الحالة: wfMeta(i).label,
    الأولوية: i.priority || '',
    الميزانية: i.budget || '',
    'نطاق العمل': stripHtml(i.scopeOfWork || ''),
    'نسبة الإنجاز': stageWeight(i) + '%',
    'درجة التحول': transformScore(i).v,
    'تمويل اللجنة': i.funded ? 'نعم' : 'لا',
  };
}

// ---- shared workbook styling (government-report look) ----------------------
const BRAND = 'FF1D4ED8'; // primary blue
const BRAND_DARK = 'FF0F1F3D';
const HEAD_TXT = 'FFFFFFFF';
const ZEBRA = 'FFF6F9FD';
const BORDER = 'FFE2E8F2';
const NOTE_BG = 'FFEAF1FE';

type XLWorksheet = import('exceljs').Worksheet;
type XLColor = { argb: string };

const thin = (c: string) => ({ style: 'thin' as const, color: { argb: c } });
function boxAll(ws: XLWorksheet, r1: number, r2: number, cols: number) {
  for (let r = r1; r <= r2; r++)
    for (let c = 1; c <= cols; c++) {
      const cell = ws.getCell(r, c);
      cell.border = { top: thin(BORDER), bottom: thin(BORDER), left: thin(BORDER), right: thin(BORDER) };
    }
}
// Title banner + subtitle across `cols`, returns the next free row.
function banner(ws: XLWorksheet, cols: number, title: string, subtitle: string) {
  ws.mergeCells(1, 1, 1, cols);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } };
  t.alignment = { horizontal: 'right', vertical: 'middle' };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } as XLColor };
  ws.getRow(1).height = 30;
  ws.mergeCells(2, 1, 2, cols);
  const sub = ws.getCell(2, 1);
  sub.value = subtitle;
  sub.font = { size: 10.5, color: { argb: 'FF54627B' } };
  sub.alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getRow(2).height = 18;
  return 3;
}
function headerRow(ws: XLWorksheet, rowIdx: number, headers: string[], widths: number[]) {
  headers.forEach((h, i) => {
    ws.getColumn(i + 1).width = widths[i] || 16;
    const cell = ws.getCell(rowIdx, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: HEAD_TXT }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } as XLColor };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: thin(BRAND), bottom: thin(BRAND), left: thin('FFFFFFFF'), right: thin('FFFFFFFF') };
  });
  ws.getRow(rowIdx).height = 24;
}

export async function exportExcel(items: Item[], entityName: string) {
  const mod = await import('exceljs');
  const ExcelJS = (mod as { default?: typeof import('exceljs') }).default || mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'منصة التحول للذكاء الاصطناعي المساعد';
  const ws = wb.addWorksheet('المدخلات', { views: [{ rightToLeft: true, showGridLines: false }] });

  const headers = Object.keys(row(items[0] || ({} as Item), entityName));
  const widths = [14, 36, 24, 24, 22, 12, 18, 44, 13, 13, 13];
  const cols = headers.length;

  banner(ws, cols, 'منصة التحول للذكاء الاصطناعي المساعد — تقرير المدخلات', `الجهة: ${entityName}  ·  عدد المدخلات: ${items.length}`);
  const headRow = 3;
  headerRow(ws, headRow, headers, widths);

  items.forEach((it, i) => {
    const data = row(it, entityName);
    const r = headRow + 1 + i;
    headers.forEach((h, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = (data as Record<string, string | number>)[h] as string;
      cell.alignment = { horizontal: c === 1 || c === 7 ? 'right' : 'center', vertical: 'middle', wrapText: c === 1 || c === 7 };
      cell.font = { size: 10.5, color: { argb: 'FF16233F' } };
      if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } as XLColor };
    });
    ws.getRow(r).height = 20;
  });

  boxAll(ws, headRow, headRow + items.length, cols);
  ws.views = [{ rightToLeft: true, showGridLines: false, state: 'frozen', ySplit: headRow }];
  ws.autoFilter = { from: { row: headRow, column: 1 }, to: { row: headRow, column: cols } };

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'تقرير_المدخلات.xlsx'
  );
}

// Bulk-upload template: النوع (dropdown limited to the stream's types) + العنوان
// + الوصف, laid out as a proper branded, guided sheet.
export async function downloadBulkTemplate(types: { key: string; label: string }[]) {
  const mod = await import('exceljs');
  const ExcelJS = (mod as { default?: typeof import('exceljs') }).default || mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'منصة التحول للذكاء الاصطناعي المساعد';
  const ws = wb.addWorksheet('القالب', { views: [{ rightToLeft: true, showGridLines: false }] });

  const headers = ['النوع', 'العنوان', 'الوصف'];
  const widths = [22, 40, 60];
  const cols = 3;

  banner(ws, cols, 'قالب رفع المدخلات', 'اختر «النوع» من القائمة المنسدلة، ثم أدخل «العنوان» و«الوصف». احذف الصف التوضيحي قبل الرفع.');
  // guidance note row
  ws.mergeCells(3, 1, 3, cols);
  const note = ws.getCell(3, 1);
  note.value = 'ملاحظة: العنوان والوصف حقلان إلزاميان لكل مدخل. يمكن إضافة عدة مدخلات، صفٌّ لكل مدخل.';
  note.font = { size: 10, color: { argb: 'FF1D4ED8' }, italic: true };
  note.alignment = { horizontal: 'right', vertical: 'middle' };
  note.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NOTE_BG } as XLColor };
  ws.getRow(3).height = 20;

  const headRow = 4;
  headerRow(ws, headRow, headers, widths);

  // example row (light, italic) — a filled-in sample
  const ex = headRow + 1;
  const sample = [types[0]?.label || 'مشروع / مبادرة', 'مثال: مساعد ذكي لخدمة المتعاملين', 'وصف مختصر للمدخل وأهدافه ونطاقه.'];
  sample.forEach((v, c) => {
    const cell = ws.getCell(ex, c + 1);
    cell.value = v;
    cell.font = { italic: true, color: { argb: 'FF9AA6BC' }, size: 10.5 };
    cell.alignment = { horizontal: c === 0 ? 'center' : 'right', vertical: 'middle', wrapText: true };
  });

  const list = '"' + types.map((t) => t.label).join(',') + '"';
  for (let r = ex; r <= 60; r++) {
    ws.getCell(r, 1).dataValidation = { type: 'list', allowBlank: true, formulae: [list] };
    ws.getRow(r).height = 20;
  }
  boxAll(ws, headRow, 60, cols);
  ws.views = [{ rightToLeft: true, showGridLines: false, state: 'frozen', ySplit: headRow }];

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'قالب_رفع_المدخلات.xlsx'
  );
}

// ---- Admin: users bulk template + reader -----------------------------------
export async function downloadUsersTemplate(roleLabels: string[], entities: string[], streamNames: string[]) {
  const mod = await import('exceljs');
  const ExcelJS = (mod as { default?: typeof import('exceljs') }).default || mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'منصة التحول للذكاء الاصطناعي المساعد';
  const ws = wb.addWorksheet('المستخدمون', { views: [{ rightToLeft: true, showGridLines: false }] });

  const headers = ['الاسم الكامل', 'البريد الإلكتروني', 'الدور', 'الجهة', 'المسار'];
  const widths = [30, 34, 26, 34, 26];
  const cols = headers.length;

  banner(ws, cols, 'قالب رفع المستخدمين', 'عبّئ صفًّا لكل مستخدم. «الاسم» و«البريد» إلزاميان. اختر «الدور» من القائمة؛ «الجهة»/«المسار» حسب الدور.');
  ws.mergeCells(3, 1, 3, cols);
  const note = ws.getCell(3, 1);
  note.value = 'ملاحظة: منسق المسار يحتاج الجهة والمسار · ممثل الجهة يحتاج الجهة · رئيس المسار يحتاج المسار · المشرف واللجنة لا يحتاجان أيًّا منهما. احذف الصف التوضيحي قبل الرفع.';
  note.font = { size: 10, color: { argb: 'FF1D4ED8' }, italic: true };
  note.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  note.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NOTE_BG } as XLColor };
  ws.getRow(3).height = 30;

  const headRow = 4;
  headerRow(ws, headRow, headers, widths);

  const ex = headRow + 1;
  const sample = ['محمد أحمد العامري', 'm.alameri@aigp.gov.ae', roleLabels[0] || 'منسق المسار في الجهة', entities[0] || '', streamNames[0] || ''];
  sample.forEach((v, c) => {
    const cell = ws.getCell(ex, c + 1);
    cell.value = v;
    cell.font = { italic: true, color: { argb: 'FF9AA6BC' }, size: 10.5 };
    cell.alignment = { horizontal: c === 1 ? 'left' : 'right', vertical: 'middle' };
  });

  const listOf = (arr: string[]) => '"' + arr.join(',').slice(0, 250) + '"';
  for (let r = ex; r <= 80; r++) {
    ws.getCell(r, 3).dataValidation = { type: 'list', allowBlank: true, formulae: [listOf(roleLabels)] };
    if (entities.length) ws.getCell(r, 4).dataValidation = { type: 'list', allowBlank: true, formulae: [listOf(entities)] };
    ws.getCell(r, 5).dataValidation = { type: 'list', allowBlank: true, formulae: [listOf(streamNames)] };
    ws.getRow(r).height = 20;
  }
  boxAll(ws, headRow, 80, cols);
  ws.views = [{ rightToLeft: true, showGridLines: false, state: 'frozen', ySplit: headRow }];

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'قالب_رفع_المستخدمين.xlsx'
  );
}

// Read a filled .xlsx (or .csv) into rows of trimmed cell strings, skipping the
// title/note/header/example rows heuristically (caller filters further).
export async function readSheetRows(file: File): Promise<string[][]> {
  const buf = await file.arrayBuffer();
  if (/\.csv$/i.test(file.name)) {
    const text = new TextDecoder('utf-8').decode(buf).replace(/^﻿/, '');
    return text.split(/\r?\n/).map((l) => l.split(/[,\t]/).map((c) => c.trim())).filter((r) => r.some((c) => c));
  }
  const mod = await import('exceljs');
  const ExcelJS = (mod as { default?: typeof import('exceljs') }).default || mod;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  const rows: string[][] = [];
  ws.eachRow((r) => {
    const cells: string[] = [];
    r.eachCell({ includeEmpty: true }, (c) => {
      const v = c.value as unknown;
      cells.push(v == null ? '' : typeof v === 'object' && v && 'text' in (v as object) ? String((v as { text: string }).text).trim() : String(v).trim());
    });
    if (cells.some((c) => c)) rows.push(cells);
  });
  return rows;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportPpt(items: Item[], entityName: string) {
  const Pptx = (await import('pptxgenjs')).default;
  const p = new Pptx();
  p.layout = 'LAYOUT_WIDE';
  p.rtlMode = true;

  // Title slide
  const title = p.addSlide();
  title.background = { color: '0B2A66' };
  title.addText('مشروع الذكاء الاصطناعي المساعد', {
    x: 0.5, y: 2.4, w: 12.3, h: 1, align: 'center', color: 'FFFFFF', fontSize: 32, bold: true,
  });
  title.addText('حصر أعمال التحول بالذكاء الاصطناعي — ' + entityName, {
    x: 0.5, y: 3.5, w: 12.3, h: 0.6, align: 'center', color: 'AFC6E8', fontSize: 16,
  });

  // One slide per item
  for (const i of items) {
    const s = p.addSlide();
    s.addText(typeLabel(i.type) + ' · ' + i.title, {
      x: 0.4, y: 0.3, w: 12.5, h: 0.7, align: 'right', color: '13213C', fontSize: 22, bold: true,
    });
    const rows: [string, string][] = [
      ['المسار', pathById(i.path).name],
      ['الجهة', entOf(i, entityName)],
      ['الحالة', wfMeta(i).label],
      ['الأولوية', i.priority || '—'],
      ['الميزانية', i.budget || '—'],
      ['نسبة الإنجاز', stageWeight(i) + '%'],
      ['درجة التحول', String(transformScore(i).v)],
      ['تمويل اللجنة', i.funded ? 'نعم' : 'لا'],
    ];
    s.addTable(
      rows.map(([k, v]) => [
        { text: k, options: { bold: true, color: '54627B', align: 'right', fill: { color: 'F1F4F9' } } },
        { text: v, options: { color: '13213C', align: 'right' } },
      ]),
      { x: 0.4, y: 1.2, w: 6.4, colW: [2.4, 4.0], fontSize: 12, border: { pt: 0.5, color: 'E7ECF4' } }
    );
    s.addText('نطاق العمل', { x: 7.1, y: 1.2, w: 5.8, h: 0.4, align: 'right', bold: true, color: '54627B', fontSize: 13 });
    s.addText(stripHtml(i.scopeOfWork || '') || '—', {
      x: 7.1, y: 1.6, w: 5.8, h: 4.5, align: 'right', valign: 'top', color: '33405A', fontSize: 12,
    });
  }

  await p.writeFile({ fileName: 'عرض_التحول_الذكي.pptx' });
}
