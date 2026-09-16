# -*- coding: utf-8 -*-
"""يبني ملف HTML للطباعة من صفحات الدليل الخمس — A4 أفقي، الصور مضمّنة."""
import base64, os

D = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(D, 'screens')

def b64(name):
    with open(os.path.join(IMG, name), 'rb') as f:
        return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()

PAGES = [
    ('02', 'قوائم الحصر',
     'نقطة البداية. قائمة مدخلات مساركم مع مؤشراتها وحالة كل مدخل — ابحثوا وصفّوا واطّلعوا على ما اعتُمد وما لا يزال مسودة.',
     'inventory.jpg', 'قائمة حصر مسار العمليات والدعم المؤسسي'),
    ('03', 'إضافة المدخلات',
     'نموذج تعبئة العملية الرئيسية وعملياتها الفرعية. أضيفوا مدخلاً واحداً، أو ارفعوا نموذج Excel جاهزاً بعدّة مدخلات دفعة واحدة.',
     'form.jpg', 'نموذج إضافة مدخل جديد'),
    ('04', 'تفاصيل المدخل',
     'بطاقة كاملة لكل مدخل: بياناته وتقييمه وحالة اعتماده. راجعوها قبل الإرسال، وتابعوا عليها ملاحظات اللجنة الوطنية بعده.',
     'detail.jpg', 'لوحة تفاصيل المدخل'),
    ('05', 'دفعات الإطلاق',
     'خطة التحوّل موزّعة على دفعات زمنية. تابعوا في أي دفعة تقع كل عملية فرعية، وحدّدوا فترة التحويل لما لم يُحدَّد بعد.',
     'batches.jpg', 'توزيع العمليات على دفعات الإطلاق'),
]

HEAD = """<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>دليل المستخدم — مشروع الذكاء الاصطناعي المساعد</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alexandria:wght@500;600;700&family=Noto+Kufi+Arabic:wght@300;400;600&display=swap">
<style>
  * { box-sizing: border-box; }
  @page { size: 297mm 210mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Noto Kufi Arabic', system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
    width: 1123px; height: 794px; position: relative; overflow: hidden;
    display: flex; flex-direction: column;
    background-color: #F4F7FC;
    page-break-after: always; break-after: page;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .cover {
    padding: 74px 52px 0;
    background-image:
      radial-gradient(660px 380px at 96% -8%, rgba(39,194,240,.12), transparent 62%),
      radial-gradient(780px 460px at -10% 18%, rgba(37,99,235,.10), transparent 64%),
      linear-gradient(180deg, #F8FAFE 0%, #F1F5FC 46%, #E9EFF9 100%);
  }
  .inner {
    padding: 48px 44px 30px;
    background-image:
      radial-gradient(600px 340px at 98% -10%, rgba(39,194,240,.09), transparent 62%),
      linear-gradient(180deg, #F9FBFE 0%, #F2F6FC 60%, #EDF2FA 100%);
  }
  .eyebrow { display: flex; align-items: center; gap: 12px; }
  .rule { display: block; width: 24px; height: 2px; background: #2563EB; }
  .eyebrow span { font-family: 'Alexandria', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 1px; color: #2563EB; }
  h1 { margin: 18px 0 0; font-family: 'Alexandria', sans-serif; font-weight: 700; font-size: 48px; line-height: 1.3; letter-spacing: -1px; color: #13213C; }
  .lede { margin: 16px 0 0; font-weight: 300; font-size: 17px; line-height: 2; color: #56647F; max-width: 640px; }
  .coverShot { margin-top: auto; display: flex; justify-content: center; }
  .coverShot figure {
    margin: 0; width: 720px; border: 1px solid #E3E9F3; border-bottom: none;
    border-radius: 16px 16px 0 0; overflow: hidden;
    box-shadow: 0 -16px 56px -26px rgba(15,31,61,.42);
  }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: 40px; padding: 0 10px; }
  .htxt { display: flex; flex-direction: column; gap: 12px; max-width: 640px; }
  h2 { margin: 0; font-family: 'Alexandria', sans-serif; font-weight: 700; font-size: 29px; line-height: 1.35; letter-spacing: -.5px; color: #13213C; }
  .desc { margin: 0; font-weight: 300; font-size: 14.5px; line-height: 1.95; color: #56647F; }
  .num { font-family: 'Alexandria', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 2px; color: #BCC7D8; padding-top: 8px; }
  .shot { flex-grow: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 20px 0 16px; }
  .shot figure {
    margin: 0; display: flex; max-width: 100%; max-height: 100%;
    border: 1px solid #E3E9F3; border-radius: 14px; overflow: hidden; background: #fff;
    box-shadow: 0 22px 54px -30px rgba(15,31,61,.40);
  }
  .shot img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
  footer {
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    border-top: 1px solid #E3E9F3; padding: 13px 10px 0;
    font-weight: 300; font-size: 11px; color: #98A4BA;
  }
  img { display: block; width: 100%; height: auto; }
</style>
</head>
<body>
"""

COVER = """<div class="page cover">
  <div class="eyebrow"><span class="rule"></span><span>دليل المستخدم</span></div>
  <h1>مشروع الذكاء الاصطناعي المساعد</h1>
  <p class="lede">منصّة واحدة لحصر مهامكم وعملياتكم، وتحديد القابل منها للتحوّل للذكاء الاصطناعي المساعد، ومتابعة إطلاقه على دفعات.</p>
  <div class="coverShot"><figure><img src="%s" alt="الصفحة الرئيسية للمنصّة"></figure></div>
</div>
"""

PAGE = """<div class="page inner">
  <header>
    <div class="htxt"><h2>%s</h2><p class="desc">%s</p></div>
    <span class="num">%s</span>
  </header>
  <div class="shot"><figure><img src="%s" alt="%s"></figure></div>
  <footer><span>مشروع الذكاء الاصطناعي المساعد — دليل المستخدم</span><span dir="ltr">%s / 05</span></footer>
</div>
"""

out = [HEAD, COVER % b64('front.jpg')]
for num, title, desc, img, alt in PAGES:
    out.append(PAGE % (title, desc, num, b64(img), alt, num))
out.append('</body></html>\n')

dest = os.path.join(D, 'print.html')
with open(dest, 'w', encoding='utf-8') as f:
    f.write(''.join(out))
print('wrote', dest, os.path.getsize(dest) // 1024, 'KB')
