'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import WalletConnect from '@/components/WalletConnect';
import { User, Mail, Briefcase, Shield, CreditCard } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark-navy">My Profile</h1>

        <div className="flex gap-6">
          {/* Sidebar Navigation for Profile */}
          <Card className="w-64 h-fit">
            <CardContent className="p-0">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
                  activeTab === 'general'
                    ? 'border-primary text-primary bg-light-lavender'
                    : 'border-transparent text-dark-navy hover:bg-light-lavender'
                }`}
              >
                <User className="w-4 h-4" />
                General
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
                  activeTab === 'security'
                    ? 'border-primary text-primary bg-light-lavender'
                    : 'border-transparent text-dark-navy hover:bg-light-lavender'
                }`}
              >
                <Shield className="w-4 h-4" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
                  activeTab === 'wallet'
                    ? 'border-primary text-primary bg-light-lavender'
                    : 'border-transparent text-dark-navy hover:bg-light-lavender'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Wallet & Payments
              </button>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {activeTab === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-dark-navy">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <div className="flex items-center gap-2 p-3 border border-lavender-gray rounded-md bg-light-blue/30">
                        <Mail className="w-4 h-4 text-primary" />
                        <span className="text-dark-navy">{user.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <div className="flex items-center gap-2 p-3 border border-lavender-gray rounded-md bg-light-blue/30">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span className="text-dark-navy capitalize">{user.role.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>

                  {user.role === 'SMB' && (user as any).smbProfile && (
                    <div className="pt-6 border-t border-lavender-gray space-y-4">
                      <h3 className="font-semibold text-dark-navy">Business Details</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                          <p className="p-3 border border-lavender-gray rounded-md">
                            {(user as any).smbProfile.businessName}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                          <p className="p-3 border border-lavender-gray rounded-md">
                            {(user as any).smbProfile.businessRegistrationNumber}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                          <p className="p-3 border border-lavender-gray rounded-md">
                            {(user as any).smbProfile.taxId}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-dark-navy">Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-dark-navy mb-2">Password</h3>
                    <Button variant="outline">Change Password</Button>
                  </div>
                  <div className="pt-4 border-t border-lavender-gray">
                    <h3 className="font-medium text-dark-navy mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add an extra layer of security to your account.
                    </p>
                    <Button disabled variant="outline">Enable 2FA (Coming Soon)</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-dark-navy">Stellar Wallet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-6">
                      Connect your Freighter wallet to interact with the Stellar blockchain.
                    </p>
                    <WalletConnect />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

