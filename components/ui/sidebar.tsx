'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  CalendarCheck,
  CreditCard,
  UtensilsCrossed,
  ShoppingBag,
  FileBarChart,
  LogOut,
  Menu,
  X,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarNavProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  // Close sidebar on mobile on navigation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'ACCOUNTANT', 'FRONTDESK'],
    },
    {
      title: 'Reservations',
      href: '/dashboard/reservations',
      icon: CalendarCheck,
      roles: ['ADMIN', 'FRONTDESK'],
    },
    {
      title: 'Front Desk',
      href: '/dashboard/checkins',
      icon: Users,
      roles: ['ADMIN', 'FRONTDESK'],
    },
    {
      title: 'Rooms',
      href: '/dashboard/rooms',
      icon: BedDouble,
      roles: ['ADMIN', 'FRONTDESK'],
    },
    {
      title: 'Guests',
      href: '/dashboard/guests',
      icon: UserCog,
      roles: ['ADMIN', 'FRONTDESK'],
    },
    {
      title: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
      roles: ['ADMIN', 'ACCOUNTANT', 'FRONTDESK'],
    },
    {
      title: 'Restaurant',
      href: '/dashboard/food',
      icon: UtensilsCrossed,
      roles: ['ADMIN', 'FRONTDESK'],
    },
    {
      title: 'Vendors',
      href: '/dashboard/vendors',
      icon: ShoppingBag,
      roles: ['ADMIN', 'ACCOUNTANT'],
    },
    {
      title: 'Reports',
      href: '/dashboard/reports',
      icon: FileBarChart,
      roles: ['ADMIN', 'ACCOUNTANT'],
    },
    {
      title: 'Expenses',
      href: '/dashboard/expenses',
      icon: ShoppingBag, // Using ShoppingBag as a placeholder, maybe Banknote if available but sticking to imported icons
      roles: ['ADMIN', 'ACCOUNTANT', 'FRONTDESK'],
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 glass-sidebar shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Maria Resorts
            </h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
              Management System
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                    )}
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 transition-colors",
                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                      )}
                    />
                    {item.title}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t bg-gray-50">
            <div className="mb-4 px-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signed in as</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {userRole || 'Loading...'}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
