'use client';
import { Suspense } from 'react';
import { RegisterScreen } from '@/components/Register';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterScreen />
    </Suspense>
  );
}
