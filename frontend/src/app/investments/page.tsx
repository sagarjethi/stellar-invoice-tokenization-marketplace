'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Investment } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function InvestmentsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'INVESTOR') {
      router.push('/login');
      return;
    }

    fetchInvestments();
  }, [isAuthenticated, user, router]);

  const fetchInvestments = async () => {
    try {
      const response = await api.get('/investments');
      setInvestments(response.data.investments || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'INVESTOR') {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalYield = investments.reduce((sum, inv) => sum + inv.expectedYield, 0);

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dark-navy">My Investments</h1>
        <Button onClick={() => router.push('/marketplace')}>
          Browse Marketplace
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-dark-navy">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-dark-navy">Active Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{investments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-dark-navy">Expected Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent-red">{formatCurrency(totalYield)}</p>
          </CardContent>
        </Card>
      </div>

      {loading && <p className="text-dark-navy">Loading investments...</p>}
      {error && (
        <div className="rounded-md bg-red-50 border-2 border-accent-red p-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      {!loading && !error && investments.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t made any investments yet.
            </p>
            <Button onClick={() => router.push('/marketplace')}>
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {investments.map((investment) => (
          <Card key={investment.id} className="hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <CardTitle className="text-dark-navy">{investment.invoice.invoiceNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Buyer</p>
                <p className="font-semibold text-dark-navy mt-1">{investment.invoice.buyerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Invested Amount</p>
                <p className="font-semibold text-primary text-lg mt-1">{formatCurrency(investment.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Expected Yield</p>
                <p className="font-semibold text-accent-red mt-1">
                  {formatCurrency(investment.expectedYield)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Due Date</p>
                <p className="font-semibold text-dark-navy mt-1">{formatDate(investment.invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Status</p>
                <p className="font-semibold text-dark-navy mt-1 capitalize">{investment.status.toLowerCase()}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/invoices/${investment.invoice.id}`)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}

