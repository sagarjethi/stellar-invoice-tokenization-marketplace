declare global {
  interface Window {
    freighterApi?: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      signTransaction: (transactionXdr: string, network: string) => Promise<string>;
    };
  }
}

export const isFreighterInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.freighterApi;
};

export const connectFreighter = async (): Promise<string> => {
  if (!isFreighterInstalled()) {
    throw new Error('Freighter wallet not installed');
  }

  const isConnected = await window.freighterApi!.isConnected();
  if (!isConnected) {
    throw new Error('Please connect Freighter wallet');
  }

  return await window.freighterApi!.getPublicKey();
};

