'use client';

interface TransactionLinkProps {
  hash: string;
  network?: 'testnet' | 'mainnet';
  label?: string;
}

export default function TransactionLink({ hash, network = 'testnet', label }: TransactionLinkProps) {
  const explorerUrl = network === 'testnet'
    ? 'https://stellar.expert/explorer/testnet'
    : 'https://stellar.expert/explorer/public';

  const displayHash = hash.length > 20 
    ? `${hash.slice(0, 10)}...${hash.slice(-10)}`
    : hash;

  return (
    <a
      href={`${explorerUrl}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-mono text-blue-600 hover:underline"
    >
      {label || displayHash}
    </a>
  );
}

