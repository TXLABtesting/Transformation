// نسخة وزارة شؤون مجلس الوزراء — مسار مستقل لا يمس منصة الجهات الاتحادية
'use client';
import { useEffect } from 'react';
import { useMoca } from '@/lib/mocaStore';
import { MocaWorkspace } from '@/components/MocaWorkspace';

export default function MocaPage() {
  const hydrate = useMoca((s) => s.hydrate);
  const hydrated = useMoca((s) => s._hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // لا نرسم شيئاً قبل قراءة التخزين المحلي تفادياً لاختلاف SSR/CSR
  if (!hydrated) return <div style={{ minHeight: '100vh', background: '#EEF2F9' }} />;
  return <MocaWorkspace />;
}
