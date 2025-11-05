'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Invoice } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AdminPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchPendingInvoices();
  }, [isAuthenticated, user, router]);

  const fetchPendingInvoices = async () => {
    try {
      const response = await api.get('/admin/invoices/pending');
      setPendingInvoices(response.data.invoices || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load pending invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invoiceId: string) => {
    try {
      await api.patch(`/invoices/${invoiceId}/approve`);
      fetchPendingInvoices();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to approve invoice');
    }
  };

  const handleReject = async (invoiceId: string, reason: string) => {
    try {
      await api.patch(`/invoices/${invoiceId}/reject`, { reason });
      fetchPendingInvoices();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reject invoice');
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
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
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dark-navy">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-dark-navy">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent-red">{pendingInvoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {loading && <p className="text-dark-navy">Loading...</p>}
      {error && (
        <div className="rounded-md bg-red-50 border-2 border-accent-red p-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-dark-navy">Pending Invoices</h2>
        {pendingInvoices.length === 0 && !loading && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No pending invoices</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {pendingInvoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader>
                <CardTitle className="text-dark-navy">{invoice.invoiceNumber}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Buyer</p>
                    <p className="font-semibold text-dark-navy mt-1">{invoice.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Amount</p>
                    <p className="font-semibold text-primary mt-1">{formatCurrency(invoice.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Discount Rate</p>
                    <p className="font-semibold text-dark-navy mt-1">{invoice.discountRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Due Date</p>
                    <p className="font-semibold text-dark-navy mt-1">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(invoice.id)}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) handleReject(invoice.id, reason);
                    }}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}

