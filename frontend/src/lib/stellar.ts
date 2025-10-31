import { Server, Networks } from '@stellar/stellar-sdk';

export const getStellarServer = () => {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
  const horizonUrl = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 
    'https://horizon-testnet.stellar.org';
  
  return new Server(horizonUrl);
};

export const getStellarNetwork = () => {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
  return network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
};

export const formatStellarAmount = (amount: string | number): string => {
  return (Number(amount) / 10000000).toFixed(7);
};

export const parseStellarAmount = (amount: string | number): string => {
  return String(Math.floor(Number(amount) * 10000000));
};

