'use client';
import { useEffect, useState } from 'react';
import { AdminPanel } from '@/components/AdminPanel';

/**
 * /admin — Dedicated full-page admin panel.
 * Checks auth + admin role before rendering.
 * If not authorized, redirects to /.
 */
export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          window.location.href = '/';
          return;
        }
        const data = await res.json();
        // Check if user has system_admin or program_admin role
        // Roles are at data.roles as an array of strings (e.g. ["system_admin"])
        const roles: string[] = data.roles || [];
        const isAdmin = roles.some((r: string) =>
          ['system_admin', 'program_admin', 'ai_committee'].includes(r)
        );
        if (!isAdmin) {
          window.location.href = '/';
          return;
        }
        setAuthorized(true);
      } catch {
        window.location.href = '/';
      }
    })();
  }, []);

  if (authorized === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#EEF2F9', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E7ECF4', borderTopColor: '#0B2A66', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#54627B' }}>جارٍ التحقق من الصلاحيات...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return <AdminPanel onClose={() => { window.location.href = '/'; }} fullPage />;
}
