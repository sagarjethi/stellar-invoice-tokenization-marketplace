import { 
  Contract, 
  Keypair, 
  SorobanRpc, 
  xdr,
  nativeToScVal,
  scValToNative,
  TransactionBuilder
} from '@stellar/stellar-sdk';
// import { stellarService } from './stellar.service';
import { AppError } from '../utils/errors';

export interface ContractAddresses {
  invoiceToken: string;
  escrow: string;
  marketplace: string;
}

export class ContractService {
  private addresses: ContractAddresses;
  private rpcUrl: string;
  private networkPassphrase: string;
  private server: SorobanRpc.Server;

  constructor() {
    this.addresses = {
      invoiceToken: process.env.INVOICE_TOKEN_CONTRACT_ID || '',
      escrow: process.env.ESCROW_CONTRACT_ID || '',
      marketplace: process.env.MARKETPLACE_CONTRACT_ID || '',
    };

    this.rpcUrl = process.env.STELLAR_RPC_URL || 'https://rpc.ankr.com/stellar_testnet_soroban/f12d040dee298e264912b6eaa724be2d315020944f9ae8d43fd7baf41599ae76';
    this.networkPassphrase = process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
    this.server = new SorobanRpc.Server(this.rpcUrl, { allowHttp: this.rpcUrl.startsWith('http://') });
  }

  getAddresses(): ContractAddresses {
    return this.addresses;
  }

  private convertToScVal(value: any): xdr.ScVal {
    if (typeof value === 'string') {
      // Check if it's a hex string meant to be bytes (starts with 0x or is 64 chars hex)
      // But metadataHash is usually passed as hex string.
      // Let's rely on explicit type checking if possible, or simple heuristic
      // For this project, metadataHash is 64 chars hex.
      if (/^[0-9a-fA-F]{64}$/.test(value)) {
         return nativeToScVal(Buffer.from(value, 'hex'));
      }
      return nativeToScVal(value, { type: 'string' });
    } else if (typeof value === 'number') {
      return nativeToScVal(value, { type: 'i128' });
    } else if (typeof value === 'bigint') {
      return nativeToScVal(value.toString(), { type: 'i128' });
    } else if (typeof value === 'boolean') {
      return nativeToScVal(value, { type: 'bool' });
    } else if (value instanceof xdr.ScVal) {
      return value;
    }
    return nativeToScVal(value);
  }

  async callContract(
    contractId: string,
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const contract = new Contract(contractId);
      const scArgs = args.map(arg => this.convertToScVal(arg));
      
      // For read calls, we simulate the transaction
      const account = await this.server.getAccount('GA7QYNF7KYNXQTO6K2767Y7277636476367367637637637637637637'); // Dummy account for simulation
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(functionName, ...scArgs))
        .setTimeout(30)
        .build();

      const result = await this.server.simulateTransaction(tx);
      
      // Note: Type definition for simulateTransaction might not be fully up to date in SDK
      if (SorobanRpc.Api.isSimulationSuccess(result) && result.result) {
        return scValToNative(result.result.retval);
      }
      return null;
    } catch (error: any) {
      console.error(`Contract call error: ${error.message}`);
      return null;
    }
  }

  async invokeContract(
    contractId: string,
    functionName: string,
    args: any[] = [],
    signerSecretKey: string
  ): Promise<string> {
    try {
      const keypair = Keypair.fromSecret(signerSecretKey);
      const contract = new Contract(contractId);
      const scArgs = args.map(arg => this.convertToScVal(arg));
      
      const sourceAccount = await this.server.getAccount(keypair.publicKey());
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(functionName, ...scArgs))
        .setTimeout(30)
        .build();

      transaction.sign(keypair);

      const response = await this.server.sendTransaction(transaction);
      
      if (response.status !== 'PENDING') {
        throw new Error(`Transaction failed: ${JSON.stringify(response)}`);
      }

      // Wait for confirmation
      let status: string = response.status;
      let hash = response.hash;
      let attempts = 0;
      
      while (status === 'PENDING' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const txResponse = await this.server.getTransaction(hash);
        
        // Cast to any to handle different SDK version enum types safely
        const currentStatus = (txResponse.status as any);
        
        if (currentStatus === 'SUCCESS' || currentStatus === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
             status = 'SUCCESS'; 
        } else if (currentStatus === 'FAILED' || currentStatus === SorobanRpc.Api.GetTransactionStatus.FAILED) {
             status = 'FAILED';
        }
        attempts++;
      }

      if (status === 'SUCCESS') {
        return hash;
      } else {
        throw new Error(`Transaction failed with status: ${status}`);
      }
    } catch (error: any) {
      throw new AppError(
        500,
        `Contract invocation failed: ${error.message}`,
        'CONTRACT_INVOCATION_FAILED',
        error
      );
    }
  }

  async initializeInvoiceToken(
    ownerAddress: string,
    invoiceNumber: string,
    metadataHash: string,
    totalSupply: string,
    signerSecretKey: string
  ): Promise<string> {
    return this.invokeContract(
      this.addresses.invoiceToken,
      'initialize',
      [ownerAddress, invoiceNumber, metadataHash, totalSupply],
      signerSecretKey
    );
  }

  async listTokenOnMarketplace(
    tokenContractId: string,
    price: string,
    discountRate: string,
    signerSecretKey: string
  ): Promise<string> {
    return this.invokeContract(
      this.addresses.marketplace,
      'list_token',
      [tokenContractId, price, discountRate],
      signerSecretKey
    );
  }

  async purchaseInvoiceToken(
    listingId: string,
    amount: string,
    investorAddress: string,
    signerSecretKey: string
  ): Promise<string> {
    return this.invokeContract(
      this.addresses.marketplace,
      'purchase',
      [listingId, amount, investorAddress],
      signerSecretKey
    );
  }

  async depositToEscrow(
    invoiceId: string,
    amount: string,
    investorAddress: string,
    signerSecretKey: string
  ): Promise<string> {
    return this.invokeContract(
      this.addresses.escrow,
      'deposit',
      [invoiceId, amount, investorAddress],
      signerSecretKey
    );
  }

  async releasePayment(
    invoiceId: string,
    signerSecretKey: string
  ): Promise<string> {
    return this.invokeContract(
      this.addresses.escrow,
      'release_payment',
      [invoiceId],
      signerSecretKey
    );
  }

  async getEscrowStatus(invoiceId: string): Promise<any> {
    return this.callContract(
      this.addresses.escrow,
      'get_status',
      [invoiceId]
    );
  }

  async getTokenBalance(tokenContractId: string, address: string): Promise<any> {
    return this.callContract(
      tokenContractId,
      'balance',
      [address]
    );
  }
}

export const contractService = new ContractService();

