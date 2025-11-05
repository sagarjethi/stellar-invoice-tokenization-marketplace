'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-light-blue">
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        <h1 className="text-5xl font-bold text-center mb-4 text-dark-navy">
          StellarFlow
        </h1>
        <p className="text-center text-xl text-dark-navy mb-2 font-medium">
          Decentralized Invoice Factoring & Liquidity Platform
        </p>
        <p className="text-center text-base text-muted-foreground mb-8">
          Tokenize your invoices and access instant liquidity on Stellar blockchain
        </p>
        
        <div className="flex justify-center gap-4">
          {isAuthenticated ? (
            <Button onClick={() => router.push('/dashboard')} size="lg">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button onClick={() => router.push('/login')} size="lg">
                Login
              </Button>
              <Button
                onClick={() => router.push('/register')}
                variant="outline"
                size="lg"
              >
                Register
              </Button>
            </>
          )}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <CardTitle className="text-dark-navy">For Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload invoices and get instant liquidity from investors
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <CardTitle className="text-dark-navy">For Investors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Invest in invoice tokens and earn competitive yields
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <CardTitle className="text-dark-navy">Secure & Transparent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built on Stellar blockchain with smart contract escrow
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

