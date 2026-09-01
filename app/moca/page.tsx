// نسخة وزارة شؤون مجلس الوزراء — مسار مستقل لا يمس منصة الجهات الاتحادية
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMoca } from '@/lib/mocaStore';
import { useStore } from '@/lib/store';
import { mocaUnitOptions } from '@/lib/moca';
import { MocaWorkspace } from '@/components/MocaWorkspace';

// مفاتيح كل وحدات الوزارة وقطاعاتها — نطاق المشرف حين يعمل منسقاً بالنيابة
const ALL_MOCA_UNITS = mocaUnitOptions().map((o) => (o.sector ? o.unitId + '::' + o.sector : o.unitId));

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1';

export default function MocaPage() {
  const router = useRouter();
  // مشرف النظام يفتح نسخة الوزارة للمعاينة من مبدّل الجهات عبر ?preview=1
  // (تُقرأ من العنوان مباشرة — useSearchParams يفرض حدود Suspense على صفحة مُهيّأة مسبقاً)
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).get('preview') === '1');
  }, []);
  const hydrate = useMoca((s) => s.hydrate);
  const hydrated = useMoca((s) => s._hydrated);
  const syncSession = useMoca((s) => s.syncSession);
  const mainHydrate = useStore((s) => s.hydrate);
  const mainHydrated = useStore((s) => s._hydrated);
  const mainAuthChecked = useStore((s) => s._authChecked);
  const mainView = useStore((s) => s.view);
  const mainRole = useStore((s) => s.role);
  const mainEntity = useStore((s) => s.entityName);
  const mainMocaUnits = useStore((s) => s.sessionMocaUnits);
  const mainAdmin = useStore((s) => s.sessionAdmin);

  useEffect(() => {
    hydrate();
    // النسخة الحية تحتاج جلسة المنصة لاشتقاق الدور والتحقق من الدخول
    if (!DEMO) mainHydrate();
  }, [hydrate, mainHydrate]);

  // النسخة الحية: الدخول شرط، والدور يُشتق من جلسة المنصة لا من مبدّل عرض —
  // منسق الجهة يرى مساحة المنسق، وبقية الأدوار (اللجنة/المشرف) مساحة الاعتماد.
  useEffect(() => {
    if (DEMO || !mainHydrated || !mainAuthChecked) return;
    if (mainView === 'login') {
      router.replace('/login');
      return;
    }
    // نسخة الوزارة لمنسوبي وزارة شؤون مجلس الوزراء فقط (عدا المشرف):
    //  - مشرف النظام → لوحة الإدارة الموحدة على /dashboard
    //  - أي دور آخر جهته ليست الوزارة → لوحته الخاصة على /dashboard
    const isMocaUser = /وزارة شؤون مجلس الوزراء/.test(String(mainEntity || ''));
    // المشرف بـ ?preview=1 يدخل نسخة الوزارة أياً كانت جهة جلسته — قصد
    // المعاينة كافٍ، ولا يُشترط أن يكون قد بدّل الجهة في المنصة أولاً
    const adminPreview = mainAdmin && preview;
    if ((mainRole === 'admin' && !preview) || (!isMocaUser && !adminPreview)) {
      router.replace('/dashboard');
      return;
    }
    // المشرف بدور المنسق يعمل بالنيابة على كل وحدات الوزارة — مبدّل الوحدات
    // يعرضها كلها وتُنسب الإضافات للوحدة المختارة
    const units = mainAdmin && mainRole === 'coord' ? ALL_MOCA_UNITS : mainMocaUnits;
    syncSession(mainRole === 'coord' ? 'coord' : 'committee', mainEntity, units);
  }, [mainHydrated, mainAuthChecked, mainView, mainRole, mainEntity, mainMocaUnits, mainAdmin, preview, syncSession, router]);

  // لا نرسم شيئاً قبل قراءة التخزين المحلي تفادياً لاختلاف SSR/CSR
  const liveBlocked =
    !DEMO &&
    (!mainHydrated ||
      !mainAuthChecked ||
      mainView === 'login' ||
      (mainRole === 'admin' && !preview) ||
      (!/وزارة شؤون مجلس الوزراء/.test(String(mainEntity || '')) && !(mainAdmin && preview)));
  if (!hydrated || liveBlocked)
    return <div style={{ minHeight: '100vh', background: '#EEF2F9' }} />;
  return <MocaWorkspace />;
}
