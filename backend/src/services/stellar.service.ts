import { Horizon, Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';

export class StellarService {
  private server: Horizon.Server;
  private network: Networks;

  constructor() {
    const network = process.env.STELLAR_NETWORK || 'testnet';
    const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    
    this.server = new Horizon.Server(horizonUrl);
    this.network = network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
  }

  getServer(): Horizon.Server {
    return this.server;
  }

  getNetwork(): Networks {
    return this.network;
  }

  async getAccount(publicKey: string) {
    return await this.server.loadAccount(publicKey);
  }

  async buildTransaction(sourceKeypair: Keypair, operations: any[]) {
    const sourceAccount = await this.getAccount(sourceKeypair.publicKey());
    
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.network,
    });

    operations.forEach(op => transaction.addOperation(op));

    transaction.setTimeout(30);
    return transaction.build();
  }

  formatAmount(amount: string | number): string {
    return (Number(amount) / 10000000).toFixed(7);
  }

  parseAmount(amount: string | number): string {
    return String(Math.floor(Number(amount) * 10000000));
  }
}

export const stellarService = new StellarService();

