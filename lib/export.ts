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
    'نطاق العمل': i.scopeOfWork || '',
    'نسبة الإنجاز': stageWeight(i) + '%',
    'درجة التحول': transformScore(i).v,
    'تمويل اللجنة': i.funded ? 'نعم' : 'لا',
  };
}

export async function exportExcel(items: Item[], entityName: string) {
  const mod = await import('exceljs');
  const ExcelJS = (mod as { default?: typeof import('exceljs') }).default || mod;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('العناصر', { views: [{ rightToLeft: true }] });
  const headers = Object.keys(row(items[0] || ({} as Item), entityName));
  const widths = [12, 34, 24, 24, 20, 12, 18, 40, 12, 12, 12];
  ws.columns = headers.map((h, idx) => ({ header: h, key: h, width: widths[idx] || 16 }));
  ws.getRow(1).font = { bold: true };
  items.forEach((i) => ws.addRow(row(i, entityName)));

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'عناصر_التحول_الذكي.xlsx'
  );
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
    s.addText(i.scopeOfWork || '—', {
      x: 7.1, y: 1.6, w: 5.8, h: 4.5, align: 'right', valign: 'top', color: '33405A', fontSize: 12,
    });
  }

  await p.writeFile({ fileName: 'عرض_التحول_الذكي.pptx' });
}
