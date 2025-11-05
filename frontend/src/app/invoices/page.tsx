'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Invoice } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function InvoicesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'SMB') {
      router.push('/login');
      return;
    }

    const fetchInvoices = async () => {
      try {
        const params = statusFilter ? `?status=${statusFilter}` : '';
        const response = await api.get(`/invoices${params}`);
        setInvoices(response.data.invoices || []);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [isAuthenticated, user, router, statusFilter]);

  if (!isAuthenticated || user?.role !== 'SMB') {
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-light-lavender text-dark-navy',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      LISTED: 'bg-light-lavender text-primary',
      FUNDED: 'bg-green-100 text-green-800',
      PAID: 'bg-green-100 text-green-800',
      DEFAULT: 'bg-red-100 text-accent-red',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-light-lavender text-dark-navy';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dark-navy">My Invoices</h1>
          <Button onClick={() => router.push('/invoices/new')}>
            Create Invoice
          </Button>
        </div>

      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium text-dark-navy">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border-2 border-gray-200 bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
        >
          <option value="">All</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="LISTED">Listed</option>
          <option value="FUNDED">Funded</option>
          <option value="PAID">Paid</option>
          <option value="DEFAULT">Default</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
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
            <p className="text-muted-foreground mb-4">
              You haven&apos;t created any invoices yet.
            </p>
            <Button onClick={() => router.push('/invoices/new')}>
              Create Your First Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-dark-navy">{invoice.invoiceNumber}</CardTitle>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status.replace('_', ' ')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Buyer</p>
                <p className="font-semibold text-dark-navy mt-1">{invoice.buyerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Amount</p>
                <p className="font-semibold text-primary text-lg mt-1">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Due Date</p>
                <p className="font-semibold text-dark-navy mt-1">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Funded</p>
                <p className="font-semibold text-primary mt-1">
                  {invoice.fundedPercentage || 0}%
                </p>
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

