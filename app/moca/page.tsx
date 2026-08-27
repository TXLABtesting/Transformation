// نسخة وزارة شؤون مجلس الوزراء — مسار مستقل لا يمس منصة الجهات الاتحادية
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMoca } from '@/lib/mocaStore';
import { useStore } from '@/lib/store';
import { MocaWorkspace } from '@/components/MocaWorkspace';

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1';

export default function MocaPage() {
  const router = useRouter();
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
    if (mainRole === 'admin' || !isMocaUser) {
      router.replace('/dashboard');
      return;
    }
    syncSession(mainRole === 'coord' ? 'coord' : 'committee', mainEntity, mainMocaUnits);
  }, [mainHydrated, mainAuthChecked, mainView, mainRole, mainEntity, mainMocaUnits, syncSession, router]);

  // لا نرسم شيئاً قبل قراءة التخزين المحلي تفادياً لاختلاف SSR/CSR
  const liveBlocked =
    !DEMO &&
    (!mainHydrated || !mainAuthChecked || mainView === 'login' || mainRole === 'admin' || !/وزارة شؤون مجلس الوزراء/.test(String(mainEntity || '')));
  if (!hydrated || liveBlocked)
    return <div style={{ minHeight: '100vh', background: '#EEF2F9' }} />;
  return <MocaWorkspace />;
}
