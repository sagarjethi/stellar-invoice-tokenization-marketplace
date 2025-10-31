'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  TrendingUp, 
  Settings, 
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!isAuthenticated || !user) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-light-blue">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-light-lavender rounded-md transition-colors text-dark-navy"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link href="/" className="text-xl font-bold text-dark-navy">
                StellarFlow
              </Link>
              <div className="flex items-center gap-2 text-dark-navy">
                <span className="text-base">{getGreeting()}, {userName}!</span>
                <span className="text-lg">👋</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 rounded-md border-2 border-gray-200 bg-white text-sm text-dark-navy focus:border-primary focus:outline-none w-64"
                />
              </div>

              {/* Quick Actions */}
              {user.role === 'SMB' && (
                <Button onClick={() => router.push('/invoices/new')}>
                  Create Invoice
                </Button>
              )}

              {/* Icons */}
              <button className="relative p-2 hover:bg-light-lavender rounded-md transition-colors">
                <Bell className="w-5 h-5 text-dark-navy" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full"></span>
              </button>
              
              <button className="p-2 hover:bg-light-lavender rounded-md transition-colors">
                <Settings className="w-5 h-5 text-dark-navy" />
              </button>

              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Left Sidebar */}
        <aside 
          className={`bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden absolute'
          }`}
        >
          <nav className="p-4 space-y-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-light-lavender text-primary font-semibold'
                  : 'text-dark-navy hover:bg-light-lavender'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>

            {user.role === 'SMB' && (
              <>
                <Link
                  href="/invoices"
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    pathname?.startsWith('/invoices')
                      ? 'bg-light-lavender text-primary font-semibold'
                      : 'text-dark-navy hover:bg-light-lavender'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Invoices</span>
                </Link>
                {pathname?.startsWith('/invoices') && (
                  <div className="ml-4 space-y-1">
                    <Link
                      href="/invoices"
                      className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                        pathname === '/invoices'
                          ? 'bg-light-lavender text-primary font-medium'
                          : 'text-muted-foreground hover:text-dark-navy'
                      }`}
                    >
                      All Invoices
                    </Link>
                    <Link
                      href="/invoices/new"
                      className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                        pathname === '/invoices/new'
                          ? 'bg-light-lavender text-primary font-medium'
                          : 'text-muted-foreground hover:text-dark-navy'
                      }`}
                    >
                      Create Invoice
                    </Link>
                  </div>
                )}
              </>
            )}

            <Link
              href="/marketplace"
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                pathname === '/marketplace'
                  ? 'bg-light-lavender text-primary font-semibold'
                  : 'text-dark-navy hover:bg-light-lavender'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Marketplace</span>
            </Link>

            {user.role === 'INVESTOR' && (
              <Link
                href="/investments"
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  pathname === '/investments'
                    ? 'bg-light-lavender text-primary font-semibold'
                    : 'text-dark-navy hover:bg-light-lavender'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>My Investments</span>
              </Link>
            )}

            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  pathname === '/admin'
                    ? 'bg-light-lavender text-primary font-semibold'
                    : 'text-dark-navy hover:bg-light-lavender'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Upgrade Card */}
            <div className="mt-8">
              <Card className="bg-primary text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🚀</span>
                    <h3 className="font-semibold text-sm">Unlimited Creation</h3>
                  </div>
                  <ul className="space-y-1 text-xs mb-3">
                    <li className="flex items-center gap-1">
                      <span>✓</span> Instant Support
                    </li>
                    <li className="flex items-center gap-1">
                      <span>✓</span> Use 1 Years Free
                    </li>
                  </ul>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full bg-white text-primary hover:bg-white/90"
                  >
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Support Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 px-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-light-lavender flex items-center justify-center">
                    <span className="text-lg">💬</span>
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red rounded-full flex items-center justify-center text-white text-xs">
                    1
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-dark-navy">Support</p>
                  <p className="text-xs text-muted-foreground">Paul Bot</p>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

