'use client';

import { useState, useEffect } from 'react';
import { connectFreighter, isFreighterInstalled } from '@/lib/wallet';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';

interface WalletConnectProps {
  onConnect?: (publicKey: string) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (!isFreighterInstalled()) {
        return;
      }

      try {
        const isConnected = await window.freighterApi?.isConnected();
        if (isConnected) {
          const key = await window.freighterApi?.getPublicKey();
          if (key) {
            setPublicKey(key);
            onConnect?.(key);
          }
        }
      } catch (err) {
        // Not connected
      }
    };

    checkConnection();
  }, [onConnect]);

  const handleConnect = async () => {
    if (!isFreighterInstalled()) {
      setError('Freighter wallet not installed. Please install it from https://freighter.app');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const key = await connectFreighter();
      setPublicKey(key);
      onConnect?.(key);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    onConnect?.('');
  };

  if (!isFreighterInstalled()) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Freighter wallet is required to interact with Stellar contracts.
          </p>
          <Button
            variant="outline"
            onClick={() => window.open('https://freighter.app', '_blank')}
          >
            Install Freighter
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (publicKey) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Connected</p>
              <p className="text-sm font-mono text-dark-navy mt-1">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        {error && (
          <p className="text-sm text-accent-red mb-2 font-medium">{error}</p>
        )}
        <Button onClick={handleConnect} disabled={loading} className="w-full">
          {loading ? 'Connecting...' : 'Connect Freighter Wallet'}
        </Button>
      </CardContent>
    </Card>
  );
}

