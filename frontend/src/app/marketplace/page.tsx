'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Invoice } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function MarketplacePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchInvoices();
  }, [isAuthenticated, router]);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices?status=LISTED');
      setInvoices(response.data.invoices || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
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

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dark-navy">Invoice Marketplace</h1>
      </div>

      {loading && <p className="text-dark-navy">Loading invoices...</p>}
      {error && (
        <div className="rounded-md bg-red-50 border-2 border-accent-red p-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No invoices available at the moment.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <CardTitle className="text-dark-navy">{invoice.invoiceNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Buyer</p>
                <p className="font-semibold text-dark-navy mt-1">{invoice.buyerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Amount</p>
                <p className="font-semibold text-primary text-lg mt-1">{formatCurrency(invoice.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Due Date</p>
                <p className="font-semibold text-dark-navy mt-1">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Discount Rate</p>
                <p className="font-semibold text-accent-red mt-1">{invoice.discountRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Funded</p>
                <p className="font-semibold text-primary mt-1">{invoice.fundedPercentage}%</p>
              </div>
              <Button
                className="w-full"
                onClick={() => router.push(`/invoices/${invoice.id}`)}
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

