'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from './ui/Button';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();

  // Don't wrap authenticated pages - they use DashboardLayout
  const authenticatedPages = [
    '/dashboard',
    '/invoices',
    '/marketplace',
    '/investments',
    '/admin',
    '/profile'
  ];
  
  if (authenticatedPages.some(page => pathname?.startsWith(page))) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-light-blue">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-dark-navy hover:text-primary transition-colors">
              StellarFlow
            </Link>
            <nav className="flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/marketplace"
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/marketplace' 
                        ? 'text-primary font-semibold' 
                        : 'text-dark-navy hover:text-primary'
                    }`}
                  >
                    Marketplace
                  </Link>
                  {user?.role === 'SMB' && (
                    <Link
                      href="/invoices"
                      className={`text-sm font-medium transition-colors ${
                        pathname?.startsWith('/invoices') 
                          ? 'text-primary font-semibold' 
                          : 'text-dark-navy hover:text-primary'
                      }`}
                    >
                      My Invoices
                    </Link>
                  )}
                  {user?.role === 'INVESTOR' && (
                    <Link
                      href="/investments"
                      className={`text-sm font-medium transition-colors ${
                        pathname === '/investments' 
                          ? 'text-primary font-semibold' 
                          : 'text-dark-navy hover:text-primary'
                      }`}
                    >
                      My Investments
                    </Link>
                  )}
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className={`text-sm font-medium transition-colors ${
                        pathname === '/admin' 
                          ? 'text-primary font-semibold' 
                          : 'text-dark-navy hover:text-primary'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/dashboard' 
                        ? 'text-primary font-semibold' 
                        : 'text-dark-navy hover:text-primary'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <span className="text-sm text-muted-foreground px-3">
                    {user?.email}
                  </span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

