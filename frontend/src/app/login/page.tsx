'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-light-blue">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-dark-navy text-2xl">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 border-2 border-accent-red p-3 text-sm text-accent-red">
                {error}
              </div>
            )}
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
                className="w-full rounded-md border-2 border-gray-200 bg-white px-3 py-2 text-sm text-dark-navy focus:border-primary focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-primary hover:text-primary/80 font-medium">
                Register
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

