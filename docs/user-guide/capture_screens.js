// لقطات الدليل — بلا شريط الترويسة (دور المنسق واسم الجهة)، ومع إخفاء
// جدول «بلا فترة تحويل» في صفحة دفعات الإطلاق
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const S = require('path').join(__dirname, 'shots') + '/';
const B = 'http://localhost:3299/Transformation';
require('fs').mkdirSync(S, { recursive: true });

const clickText = (p, src, sel = 'button') =>
  p.evaluate(([src, sel]) => {
    const rx = new RegExp(src);
    const el = [...document.querySelectorAll(sel)].find((b) => rx.test(b.innerText || ''));
    if (!el) return false;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  }, [src, sel]);

const nav = (p, src, last = false) =>
  p.evaluate(([src, last]) => {
    const rx = new RegExp(src);
    const els = [...document.querySelectorAll('aside button, aside a')].filter((e) => rx.test(e.innerText || ''));
    const x = last ? els[els.length - 1] : els[0];
    if (!x) return false;
    x.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  }, [src, last]);

const pickSelect = (p, idx, src) =>
  p.evaluate(([idx, src]) => {
    const rx = new RegExp(src);
    const s = [...document.querySelectorAll('select')][idx];
    if (!s) return 'no-select';
    const o = [...s.options].find((x) => rx.test(x.textContent));
    if (!o) return 'no-option';
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(s, o.value);
    s.dispatchEvent(new Event('change', { bubbles: true }));
    return o.textContent.trim();
  }, [idx, src]);

/** يُخفي شريط الترويسة العلوي — لا يظهر في الدليل الموزّع على الجميع */
const hideHeader = (p) =>
  p.evaluate(() => {
    const h = document.querySelector('[data-r="hdr"]');
    if (!h) return false;
    h.style.display = 'none';
    return true;
  });

const closePanel = (p) =>
  p.evaluate(() => {
    const b = [...document.querySelectorAll('button')].filter((x) => /^[✕×✖]$/.test(x.innerText.trim()));
    b.forEach((x) => x.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    window.scrollTo(0, 0);
  });

const top = async (p) => {
  await p.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('*').forEach((e) => { if (e.scrollTop) e.scrollTop = 0; });
  });
  await p.waitForTimeout(400);
};

const shot = async (p, name) => {
  await hideHeader(p);
  await top(p);
  await p.waitForTimeout(350);
  await p.screenshot({ path: S + name });
};

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await br.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, locale: 'ar' });
  const p = await ctx.newPage();

  await p.goto(B + '/login/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await clickText(p, 'تسجيل الدخول');
  await p.waitForTimeout(1400);
  await p.goto(B + '/dashboard/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);

  await p.evaluate((extra) => {
    const raw = localStorage.getItem('aitp_state');
    if (!raw) return;
    const s = JSON.parse(raw);
    const have = new Set((s.items || []).map((i) => i.id));
    s.items = [...extra.filter((e) => !have.has(e.id)), ...(s.items || [])];
    localStorage.setItem('aitp_state', JSON.stringify(s));
  }, require('./sample_data')());
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(2600);

  console.log('role:', await pickSelect(p, 0, 'منسق المسار في الجهة'));
  await p.waitForTimeout(2400);
  console.log('entity:', await pickSelect(p, 1, '^وزارة المالية$'));
  await p.waitForTimeout(2600);
  await clickText(p, 'تخطّي|تخطي|لاحقاً');
  await p.waitForTimeout(800);

  console.log('nav inv:', await nav(p, 'العمليات والدعم المؤسسي'));
  await p.waitForTimeout(2600);
  await shot(p, 'inventory.png');

  console.log('form:', await clickText(p, 'إضافة المدخلات'));
  await p.waitForTimeout(2400);
  await hideHeader(p);
  await p.evaluate(() => {
    const h = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /^إضافة عمليات$/.test(e.textContent.trim()));
    if (!h) return;
    const card = h.closest('div').parentElement.parentElement;
    window.scrollTo({ top: window.scrollY + card.getBoundingClientRect().top - 10, behavior: 'instant' });
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    const setN = (el, v) => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    // التعبئة بحسب نصّ الوسم — بنية نموذج الجهات الاتحادية
    const byLabel = (re) => {
      const l = [...document.querySelectorAll('label')].find((x) => re.test(x.textContent.trim()));
      return l && l.parentElement.querySelector('input');
    };
    const main = byLabel(/^العملية الرئيسية/);
    main && setN(main, 'مراجعة طلبات الصرف والاعتمادات');
    const sub = byLabel(/^اسم العملية الفرعية/);
    sub && setN(sub, 'فحص المستندات');
  });
  await p.waitForTimeout(700);
  await p.screenshot({ path: S + 'form.png' });
  await closePanel(p);
  await p.waitForTimeout(1200);

  console.log('detail:', await clickText(p, 'عرض التفاصيل'));
  await p.waitForTimeout(2200);
  await shot(p, 'detail.png');
  await closePanel(p);
  await p.waitForTimeout(1400);

  console.log('nav batches:', await nav(p, 'العمليات والدعم المؤسسي', true));
  await p.waitForTimeout(2800);
  await hideHeader(p);
  // جدول «بلا فترة تحويل – للتحديد» لا يظهر في الدليل
  const hidden = await p.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /بلا فترة تحويل/.test(e.textContent));
    if (!el) return 'not-found';
    let box = el;
    while (box && box !== document.body && getComputedStyle(box).borderRadius === '0px') box = box.parentElement;
    if (!box || box === document.body) return 'no-card';
    box.style.display = 'none';
    return 'hidden';
  });
  console.log('no-period table:', hidden);
  await top(p);
  await p.waitForTimeout(500);
  await p.screenshot({ path: S + 'batches.png' });

  await br.close();
  console.log('done');
})();
