'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar userRole={userRole} />
      <main className="lg:pl-64 min-h-screen transition-all duration-200">
        <div className="container mx-auto p-6 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
