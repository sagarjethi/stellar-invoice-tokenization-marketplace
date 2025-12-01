'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/toast/Toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'SMB' | 'INVESTOR'>('SMB');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      addToast('Please fill in all fields.', 'error');
      return;
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, role);
      addToast('Registration successful!', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      addToast(err.response?.data?.error?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-light-blue">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-dark-navy text-2xl">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-dark-navy">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border-2 border-gray-200 bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-dark-navy">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-md border-2 border-gray-200 bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1 text-dark-navy">
                I am a
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'SMB' | 'INVESTOR')}
                className="w-full rounded-md border-2 border-gray-200 bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
              >
                <option value="SMB">Business Owner (SMB)</option>
                <option value="INVESTOR">Investor</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:text-primary/80 font-medium">
                Login
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

