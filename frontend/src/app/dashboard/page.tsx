'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        if (user?.role === 'SMB') {
          const response = await api.get('/invoices');
          const invoices = response.data.invoices || [];
          setStats({
            totalInvoices: invoices.length,
            pendingApproval: invoices.filter((i: any) => i.status === 'PENDING_APPROVAL').length,
            activeListings: invoices.filter((i: any) => i.status === 'LISTED').length,
            totalFunded: invoices.reduce((sum: number, i: any) => sum + (i.totalAmount * (i.fundedPercentage || 0) / 100), 0),
          });
        } else if (user?.role === 'INVESTOR') {
          const response = await api.get('/investments');
          const investments = response.data.investments || [];
          setStats({
            totalInvested: investments.reduce((sum: number, i: any) => sum + i.amount, 0),
            activeInvestments: investments.filter((i: any) => i.status === 'ACTIVE').length,
            totalYield: investments.reduce((sum: number, i: any) => sum + (i.expectedYield || 0), 0),
            portfolioValue: investments.reduce((sum: number, i: any) => sum + i.amount, 0),
          });
        } else if (user?.role === 'ADMIN') {
          const response = await api.get('/admin/invoices/pending');
          const pending = response.data.invoices || [];
          setStats({
            pendingApproval: pending.length,
            totalInvoices: 0,
            totalVolume: 0,
            activeInvestments: 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, router, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark-navy">Dashboard</h1>

        {loading ? (
          <p className="text-dark-navy">Loading...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {user.role === 'SMB' && stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Total Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{stats.totalInvoices}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Pending Approval</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-accent-red">{stats.pendingApproval}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Active Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{stats.activeListings}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Total Funded</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(stats.totalFunded)}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {user.role === 'INVESTOR' && stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Total Invested</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(stats.totalInvested)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Active Investments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{stats.activeInvestments}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Expected Yield</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-accent-red">{formatCurrency(stats.totalYield)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Portfolio Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(stats.portfolioValue)}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {user.role === 'ADMIN' && stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy text-base">Pending Approval</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-accent-red">{stats.pendingApproval}</p>
                  </CardContent>
                </Card>
              </>
            )}
      </div>
        )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
              <CardTitle className="text-dark-navy">Welcome, {user.email}</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-sm text-muted-foreground font-medium">
                Role: <span className="text-dark-navy">{user.role}</span>
            </p>
            {user.stellarAccountId && (
              <p className="text-sm text-muted-foreground mt-2">
                  Stellar: <span className="font-mono text-dark-navy">{user.stellarAccountId.slice(0, 10)}...</span>
              </p>
            )}
          </CardContent>
        </Card>

        {user.role === 'SMB' && (
          <Card>
            <CardHeader>
                <CardTitle className="text-dark-navy">My Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create and manage your invoices
              </p>
              <Button onClick={() => router.push('/invoices/new')}>
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        )}

        {user.role === 'INVESTOR' && (
          <Card>
            <CardHeader>
                <CardTitle className="text-dark-navy">Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Browse available invoice investments
              </p>
              <Button onClick={() => router.push('/marketplace')}>
                Browse Invoices
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
              <CardTitle className="text-dark-navy">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/marketplace')}
            >
              View Marketplace
            </Button>
            {user.role === 'SMB' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/invoices')}
              >
                My Invoices
              </Button>
            )}
            {user.role === 'INVESTOR' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/investments')}
              >
                My Investments
              </Button>
            )}
              {user.role === 'ADMIN' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin')}
                >
                  Admin Panel
                </Button>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}

