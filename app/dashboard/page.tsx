'use client';
// ===========================================================================
// منصة الإدخال — لوحات المنصة كما هي (منسق/فريق مسار/لجنة/مشرف).
// الصفحة الرئيسية العامة أصبحت على «/»؛ غير المسجّل يُعاد لصفحة تسجيل الدخول.
// ===========================================================================
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useViewModel } from '@/lib/viewModel';
import { Dashboard } from '@/components/Dashboard';
import { AdminConsole } from '@/components/AdminConsole';
import { StrategicProjects } from '@/components/StrategicProjects';
import { CreatePanel } from '@/components/CreatePanel';
import { DetailPanel } from '@/components/DetailPanel';
import { BasketDrawer, DraftBar, FundBar, AssignBar } from '@/components/Basket';
import { Overlays } from '@/components/Overlays';
import { Toast } from '@/components/Toast';
import { ResponsiveZoom } from '@/components/ResponsiveZoom';

export default function DashboardPage() {
  const router = useRouter();
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s._hydrated);
  // في نسخة الخادم لا يُحكم بعدم التسجيل قبل انتهاء فحص الجلسة، وإلا قُذف
  // المستخدم المسجّل خارج اللوحة عند فتحها بتحميل مباشر
  const authChecked = useStore((s) => s._authChecked);
  const vm = useViewModel();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // غير المسجّل يذهب لصفحة تسجيل الدخول
  useEffect(() => {
    if (hydrated && authChecked && vm.isLogin) router.replace('/login');
  }, [hydrated, authChecked, vm.isLogin, router]);

  // لا شيء يُرسم قبل قراءة الجلسة — يمنع اختلاف SSR/CSR
  if (!hydrated || !authChecked || vm.isLogin) return <div style={{ minHeight: '100vh', background: '#EEF2F9' }} />;

  return (
    <>
      <ResponsiveZoom />
      {vm.isDashboard && vm.isAdmin && <AdminConsole vm={vm} />}
      {vm.isDashboard && !vm.isAdmin && vm.isProj && <StrategicProjects vm={vm} />}
      {vm.isDashboard && !vm.isAdmin && !vm.isProj && (
        <>
          <Dashboard vm={vm} />
          {vm.showBasket && <FundBar vm={vm} />}
          <AssignBar vm={vm} />
          <DraftBar vm={vm} />
          {vm.basketOpen && <BasketDrawer vm={vm} />}
        </>
      )}
      {vm.modalOpen && <CreatePanel vm={vm} />}
      {vm.detailOpen && vm.detail && <DetailPanel vm={vm} />}
      <Overlays vm={vm} />
      {vm.hasToast && <Toast msg={vm.toastMsg} />}
    </>
  );
}
