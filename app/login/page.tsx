'use client';
// صفحة تسجيل الدخول الزرقاء — بعد نجاح الدخول يعود المستخدم إلى الصفحة
// الرئيسية العامة حيث يظهر شريط الأعضاء وزر «منصة الإدخال».
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useViewModel } from '@/lib/viewModel';
import { Login } from '@/components/Login';

export default function LoginPage() {
  const router = useRouter();
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s._hydrated);
  const authed = useStore((s) => s.view !== 'login');
  const vm = useViewModel();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // مسجّل بالفعل (أو نجح الدخول للتو) → الصفحة الرئيسية
  useEffect(() => {
    if (hydrated && authed) router.replace('/');
  }, [hydrated, authed, router]);

  if (!hydrated || authed) return <div style={{ minHeight: '100vh', background: '#020713' }} />;

  return <Login vm={vm} />;
}
