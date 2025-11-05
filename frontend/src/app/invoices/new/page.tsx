'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, Check, Image as ImageIcon, ZoomIn, FileText, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LineItem {
  id: string;
  description: string;
  rate: string;
  quantity: string;
  lineTotal: string;
}

export default function NewInvoicePage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSecurityBanner, setShowSecurityBanner] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    buyerId: '',
    buyerName: '',
    totalAmount: '',
    currency: 'USD',
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    discountRate: '5',
    note: '',
  });

  // Sync formData.buyerName with clientData.clientName
  const handleClientNameChange = (value: string) => {
    setClientData({ ...clientData, clientName: value });
    setFormData(prev => ({ ...prev, buyerName: value }));
  };

  const [companyData, setCompanyData] = useState({
    companyName: 'Invoicer',
    address1: '626 W Pender St #100, Vancouver,',
    address2: 'BC V6B 1V9, Kanada',
    city: 'Kanada',
    country: 'America',
  });

  useEffect(() => {
    if (user && (user as any).smbProfile) {
      const profile = (user as any).smbProfile;
      setCompanyData({
        companyName: profile.businessName || 'Invoicer',
        address1: profile.address?.line1 || '626 W Pender St #100, Vancouver,',
        address2: profile.address?.line2 || 'BC V6B 1V9, Kanada',
        city: profile.address?.city || 'Kanada',
        country: profile.address?.country || 'America',
      });
    }
  }, [user]);

  const [clientData, setClientData] = useState({
    clientName: 'Invoicer',
    address1: '626 W Pender St #100, Vancouver,',
    address2: 'BC V6B 1V9, Kanada',
    city: 'Kanada',
    country: 'America',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '626 W Pender St #100, Vancouver,', rate: '100.00', quantity: '1', lineTotal: '100.00' },
  ]);

  if (!isAuthenticated || user?.role !== 'SMB') {
    router.push('/login');
    return null;
  }

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'rate' || field === 'quantity') {
            const rate = parseFloat(updated.rate) || 0;
            const qty = parseFloat(updated.quantity) || 0;
            updated.lineTotal = (rate * qty).toFixed(2);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: Date.now().toString(),
      description: '',
      rate: '0.00',
      quantity: '1',
      lineTotal: '0.00',
    }]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (parseFloat(item.lineTotal) || 0), 0);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const metadataHash = 'temp-hash';
      
      // Construct details object for JSON storage
      const details = {
        company: companyData,
        client: clientData,
        lineItems: lineItems,
        note: formData.note,
        logo: logo // storing base64 logo in details (be careful with size)
      };

      const response = await api.post('/invoices', {
        ...formData,
        buyerName: clientData.clientName, // Use client name from the client detail section
        totalAmount: calculateTotal(),
        discountRate: parseFloat(formData.discountRate),
        metadataHash,
        details // Send the structured details
      });

      router.push(`/invoices/${response.data.invoice.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Left Column - Form */}
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-dark-navy">Create Invoices</h1>
              <Link href="/invoices" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Invoice List
              </Link>
            </div>

            {/* Security Banner */}
            {showSecurityBanner && (
              <Card className="bg-primary border-0 text-white relative overflow-hidden">
                <button
                  onClick={() => setShowSecurityBanner(false)}
                  className="absolute top-2 right-2 text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Security Invoices</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>100% Safe</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>Awesome</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
                          <span className="text-3xl">🛡️</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Logo */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-dark-navy">Add Logo</h3>
                  <button className="text-muted-foreground hover:text-dark-navy">
                    <span className="text-xs">i</span>
                  </button>
                </div>
                <label className="block">
                  <div className="border-2 border-dashed border-lavender-gray rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                    {logo ? (
                      <img src={logo} alt="Logo" className="max-h-32 mx-auto" />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-dark-navy font-medium mb-1">
                          Drop your image here, or browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports: JPG, JPEG2000, PNG
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </CardContent>
            </Card>

            {/* Company Detail */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-dark-navy flex items-center gap-2">
                  <Check className="w-5 h-5 text-accent-green" />
                  Company Detail
                </CardTitle>
                <span className="px-2 py-1 bg-accent-green/10 text-accent-green text-xs font-medium rounded-full">
                  Completed
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-dark-navy">
                    Company*
                  </label>
                  <input
                    type="text"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                    className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Address 1
                    </label>
                    <input
                      type="text"
                      value={companyData.address1}
                      onChange={(e) => setCompanyData({ ...companyData, address1: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Address 2
                    </label>
                    <input
                      type="text"
                      value={companyData.address2}
                      onChange={(e) => setCompanyData({ ...companyData, address2: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none pr-8"
                    />
                    <Check className="w-4 h-4 text-accent-green absolute right-3 bottom-2.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      City*
                    </label>
                    <select
                      value={companyData.city}
                      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    >
                      <option>Kanada</option>
                      <option>Vancouver</option>
                      <option>Toronto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Country*
                    </label>
                    <select
                      value={companyData.country}
                      onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    >
                      <option>America</option>
                      <option>Canada</option>
                      <option>United States</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Detail */}
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-navy">Client Detail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-dark-navy">
                    Client Name*
                  </label>
                  <input
                    type="text"
                    value={clientData.clientName}
                    onChange={(e) => handleClientNameChange(e.target.value)}
                    className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Address 1
                    </label>
                    <input
                      type="text"
                      value={clientData.address1}
                      onChange={(e) => setClientData({ ...clientData, address1: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Address 2
                    </label>
                    <input
                      type="text"
                      value={clientData.address2}
                      onChange={(e) => setClientData({ ...clientData, address2: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      City*
                    </label>
                    <select
                      value={clientData.city}
                      onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    >
                      <option>Kanada</option>
                      <option>Vancouver</option>
                      <option>Toronto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Country*
                    </label>
                    <select
                      value={clientData.country}
                      onChange={(e) => setClientData({ ...clientData, country: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    >
                      <option>America</option>
                      <option>Canada</option>
                      <option>United States</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-navy">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Invoice Number *
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      required
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                      placeholder="INV-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      required
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-dark-navy">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-dark-navy">
                    Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                    min="0"
                    max="100"
                    className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                    placeholder="5.0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-navy">Line Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-lavender-gray">
                        <th className="text-left py-2 text-sm font-medium text-dark-navy">Description</th>
                        <th className="text-left py-2 text-sm font-medium text-dark-navy">Rate</th>
                        <th className="text-left py-2 text-sm font-medium text-dark-navy">Qty</th>
                        <th className="text-left py-2 text-sm font-medium text-dark-navy">Line Total</th>
                        <th className="text-left py-2 text-sm font-medium text-dark-navy"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-lavender-gray">
                          <td className="py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                              className="w-full rounded-md border-2 border-lavender-gray bg-white px-2 py-1 text-sm text-dark-navy focus:border-primary focus:outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => handleLineItemChange(item.id, 'rate', e.target.value)}
                              className="w-full rounded-md border-2 border-lavender-gray bg-white px-2 py-1 text-sm text-dark-navy focus:border-primary focus:outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(item.id, 'quantity', e.target.value)}
                              className="w-full rounded-md border-2 border-lavender-gray bg-white px-2 py-1 text-sm text-dark-navy focus:border-primary focus:outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="text"
                              value={formatCurrency(parseFloat(item.lineTotal) || 0)}
                              readOnly
                              className="w-full rounded-md border-2 border-lavender-gray bg-light-lavender px-2 py-1 text-sm text-dark-navy"
                            />
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              className="text-accent-red hover:text-accent-red/80"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button type="button" variant="outline" onClick={addLineItem} className="w-full">
                  + Add Line Item
                </Button>
              </CardContent>
            </Card>

            {/* Note */}
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-navy">Note</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={4}
                  className="w-full rounded-md border-2 border-lavender-gray bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                  placeholder="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout."
                />
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-md bg-red-50 border-2 border-accent-red p-3 text-sm text-accent-red">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="w-[40%] bg-light-lavender rounded-lg p-6 overflow-y-auto">
          <div className="space-y-4">
            {/* Preview Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-dark-navy">Preview</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded">
                  <input type="range" min="50" max="150" defaultValue="100" className="w-16" />
                </div>
                <button className="p-2 hover:bg-white rounded transition-colors">
                  <ZoomIn className="w-4 h-4 text-dark-navy" />
                </button>
                <button className="p-2 hover:bg-white rounded transition-colors">
                  <FileText className="w-4 h-4 text-dark-navy" />
                </button>
                <button className="p-2 hover:bg-white rounded transition-colors">
                  <Printer className="w-4 h-4 text-dark-navy" />
                </button>
                <Button size="sm" className="bg-dark-navy text-white">
                  PDF
                </Button>
              </div>
            </div>

            {/* Invoice Preview Card */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-dark-navy mb-2">
                      {logo ? <img src={logo} alt="Logo" className="h-8" /> : 'StellarFlow'}
                    </h3>
                    <p className="text-sm font-medium text-dark-navy mt-4">
                      Invoice #: {formData.invoiceNumber || 'INV-001'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Date: {formData.issueDate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due Date: {formData.dueDate}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p className="font-medium text-dark-navy">Company {companyData.companyName}</p>
                    <p>Adress {companyData.address1}</p>
                    <p>Adress {companyData.address2}</p>
                    <p>City {companyData.city}</p>
                    <p>Country {companyData.country}</p>
                  </div>
                </div>

                {/* Total Amount Bar */}
                <div className="bg-primary text-white p-4 rounded-md mb-8 flex justify-between items-center">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold">{formatCurrency(calculateTotal())}</span>
                </div>

                {/* Client Details */}
                <div className="mb-8">
                  <div className="text-right text-sm text-muted-foreground">
                    <p className="font-medium text-dark-navy">Client {clientData.clientName}</p>
                    <p>Adress {clientData.address1}</p>
                    <p>Adress1 {clientData.address2}</p>
                    <p>City {clientData.city}</p>
                    <p>Country {clientData.country}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-lavender-gray">
                        <th className="text-left py-2 text-sm font-medium text-muted-foreground">Description</th>
                        <th className="text-right py-2 text-sm font-medium text-muted-foreground">Rate</th>
                        <th className="text-right py-2 text-sm font-medium text-muted-foreground">Qty</th>
                        <th className="text-right py-2 text-sm font-medium text-muted-foreground">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-lavender-gray">
                          <td className="py-2 text-sm text-dark-navy">{item.description || '-'}</td>
                          <td className="py-2 text-sm text-dark-navy text-right">{formatCurrency(parseFloat(item.rate) || 0)}</td>
                          <td className="py-2 text-sm text-dark-navy text-right">{item.quantity}</td>
                          <td className="py-2 text-sm text-dark-navy text-right">{formatCurrency(parseFloat(item.lineTotal) || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Note */}
                {formData.note && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Note</p>
                    <p className="text-sm text-dark-navy">{formData.note}</p>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-2 pt-4 border-t border-lavender-gray">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 bg-light-lavender text-dark-navy hover:bg-lavender-gray"
                    onClick={() => {
                      setFormData({ ...formData, totalAmount: calculateTotal().toString() });
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Saving...' : 'Save and Send'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
