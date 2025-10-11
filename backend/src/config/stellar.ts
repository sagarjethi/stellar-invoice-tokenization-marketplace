import { Networks } from '@stellar/stellar-sdk';

export const getStellarNetwork = (): Networks => {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  return network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
};

export const getHorizonUrl = (): string => {
  return process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
};

