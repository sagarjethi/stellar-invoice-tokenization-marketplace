'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Invoice } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import WalletConnect from '@/components/WalletConnect';
import TransactionLink from '@/components/TransactionLink';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletKey, setWalletKey] = useState('');

  const [invoiceToken, setInvoiceToken] = useState<any>(null);
  const [contractAddresses, setContractAddresses] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/invoices/${params.id}`);
        setInvoice(response.data.invoice);
        if (response.data.invoice.invoiceToken) {
          setInvoiceToken(response.data.invoice.invoiceToken);
        }
        
        // Fetch contract addresses
        try {
          const contractResponse = await api.get('/contracts/addresses');
          setContractAddresses(contractResponse.data);
        } catch (e) {
          // Contract addresses not available
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id, isAuthenticated, router]);

  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investing, setInvesting] = useState(false);

  const handleInvest = async () => {
    if (!walletKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    const amount = parseFloat(investmentAmount);
    const available = invoice.totalAmount * (1 - (invoice.fundedPercentage || 0) / 100);

    if (amount > available) {
      setError(`Maximum investment amount is ${formatCurrency(available)}`);
      return;
    }

    setInvesting(true);
    setError('');

    try {
      const response = await api.post('/investments', {
        invoiceId: invoice.id,
        amount: amount,
        walletAddress: walletKey, // Send wallet address for verification
      });

      const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
      const explorerUrl = network === 'testnet' 
        ? 'https://stellar.expert/explorer/testnet'
        : 'https://stellar.expert/explorer/public';

      const escrowHash = response.data.transactionHashes?.escrow;
      const purchaseHash = response.data.transactionHashes?.purchase;

      const message = `Investment successful!\n\n` +
        (escrowHash ? `Escrow: ${explorerUrl}/tx/${escrowHash}\n` : '') +
        (purchaseHash ? `Purchase: ${explorerUrl}/tx/${purchaseHash}` : '');

      alert(message);
      router.push('/investments');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to make investment');
    } finally {
      setInvesting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="text-dark-navy">Loading invoice...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="rounded-md bg-red-50 border-2 border-accent-red p-3 text-sm text-accent-red">
        {error || 'Invoice not found'}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout>
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dark-navy">Invoice Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
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
                  <p className="text-sm text-muted-foreground font-medium">Status</p>
                  <p className="font-semibold text-dark-navy mt-1 capitalize">{invoice.status.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Amount</p>
                  <p className="font-semibold text-primary text-lg mt-1">{formatCurrency(invoice.totalAmount)}</p>
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
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Funded</p>
                  <p className="font-semibold text-primary mt-1">{invoice.fundedPercentage}%</p>
                </div>
              </div>
              {invoiceToken && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold mb-2 text-dark-navy">Token Information</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Token ID</p>
                      <p className="text-sm font-mono text-dark-navy mt-1">{invoiceToken.tokenId}</p>
                    </div>
                    {invoiceToken.tokenContractId && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Contract Address</p>
                        <a
                          href={`https://stellar.expert/explorer/testnet/contract/${invoiceToken.tokenContractId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-primary hover:text-primary/80 hover:underline mt-1"
                        >
                          {invoiceToken.tokenContractId.slice(0, 10)}...{invoiceToken.tokenContractId.slice(-10)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {user?.role === 'INVESTOR' && invoice.status === 'LISTED' && (
            <>
              <WalletConnect onConnect={setWalletKey} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-dark-navy">Invest</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Expected Yield: <span className="font-semibold text-accent-red">{invoice.discountRate}%</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Available: <span className="font-semibold text-dark-navy">{formatCurrency(invoice.totalAmount * (1 - (invoice.fundedPercentage || 0) / 100))}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-dark-navy">
                      Investment Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={invoice.totalAmount * (1 - (invoice.fundedPercentage || 0) / 100)}
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full rounded-md border-2 border-gray-200 bg-white px-3 py-2 text-sm mb-2 text-dark-navy focus:border-primary focus:outline-none"
                    />
                    {investmentAmount && (
                      <p className="text-xs text-muted-foreground">
                        Expected return: <span className="font-semibold text-primary">{formatCurrency(parseFloat(investmentAmount || '0') * (1 + invoice.discountRate / 100))}</span>
                      </p>
                    )}
                  </div>
                  {error && (
                    <div className="rounded-md bg-red-50 border-2 border-accent-red p-2 text-sm text-accent-red">
                      {error}
                    </div>
                  )}
                  <Button
                    onClick={handleInvest}
                    disabled={!walletKey || investing || !investmentAmount}
                    className="w-full"
                  >
                    {investing ? 'Processing...' : 'Invest Now'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}

