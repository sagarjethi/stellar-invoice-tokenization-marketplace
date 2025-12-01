import prisma from '../config/database';
// import { contractService } from './contract.service';
import { AppError } from '../utils/errors';

export interface CreateInvestmentData {
  invoiceId: string;
  investorId: string;
  amount: number;
  stellarTransactionHash?: string; // If client signed directly
}

export const createInvestment = async (data: CreateInvestmentData) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { 
      invoiceToken: true,
      smb: true 
    },
  });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  }

  if (invoice.status !== 'LISTED' && invoice.status !== 'FUNDED') {
    throw new AppError(400, 'Invoice is not available for investment', 'INVALID_STATUS');
  }

  if (!invoice.invoiceToken) {
    throw new AppError(400, 'Invoice has not been tokenized', 'NOT_TOKENIZED');
  }

  const investor = await prisma.user.findUnique({
    where: { id: data.investorId },
  });

  if (!investor || !investor.stellarAccountId) {
    throw new AppError(400, 'Investor wallet not connected', 'NO_WALLET');
  }

  // In a real app, we would verify the Stellar transaction here if provided
  // Or we would initiate the transaction via the contract service if we hold keys (custodial)
  // For non-custodial (Freighter), the frontend executes the transaction and we verify it

  // Assuming non-custodial flow where frontend sends tx hash
  if (!data.stellarTransactionHash) {
    // For MVP without frontend wallet integration fully done, we simulate
    // or assuming we are using the contractService to invoke on behalf (if we have keys - which we don't for users)
    // So we will just record it for now, or try to invoke if we had user keys.
    
    // Correction: The Escrow contract 'deposit' function requires 'investor' auth.
    // So the transaction MUST be signed by the investor.
    // The backend cannot invoke 'deposit' on behalf of the investor without their secret key.
    throw new AppError(400, 'Transaction hash required', 'MISSING_TX_HASH');
  }

  // Verify transaction on-chain (omitted for brevity, but critical in prod)
  // await stellarService.verifyTransaction(data.stellarTransactionHash);

  // Calculate tokens to mint/transfer
  const tokensAmount = BigInt(Math.floor(data.amount * 10000000));

  const investment = await prisma.tokenOwnership.create({
    data: {
      tokenId: invoice.invoiceToken.id,
      investorId: data.investorId,
      amount: tokensAmount,
      purchasePrice: invoice.discountRate, // Storing discount rate as price for now
      stellarTransactionHash: data.stellarTransactionHash,
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      invoiceId: invoice.id,
      escrowContractId: process.env.ESCROW_CONTRACT_ID!,
      investorId: data.investorId,
      amountEscrowed: data.amount,
      status: 'PENDING', // Confirmed on chain
      stellarTransactionHash: data.stellarTransactionHash,
    },
  });

  // Update invoice status if fully funded
  // This logic ideally checks the contract state
  const totalInvested = await prisma.escrowTransaction.groupBy({
    by: ['invoiceId'],
    where: { invoiceId: invoice.id },
    _sum: { amountEscrowed: true },
  });
  
  const investedAmount = Number(totalInvested[0]?._sum?.amountEscrowed || 0);
  const totalAmount = Number(invoice.totalAmount);

  // Simple check
  if (investedAmount >= totalAmount * (1 - Number(invoice.discountRate)/100)) {
     await prisma.invoice.update({
       where: { id: invoice.id },
       data: { status: 'FUNDED', fundedAt: new Date() },
     });
  }

  return investment;
};

export const getInvestments = async (investorId: string) => {
  const investments = await prisma.tokenOwnership.findMany({
    where: { investorId },
    include: {
      token: {
        include: {
          invoice: true,
        },
      },
    },
    orderBy: { purchaseDate: 'desc' },
  });

  return investments.map(inv => ({
    id: inv.id,
    invoice: inv.token.invoice,
    amount: Number(inv.amount) / 10000000, // Convert back from stroops/units
    tokens: inv.amount.toString(),
    purchasePrice: Number(inv.purchasePrice),
    expectedYield: Number(inv.token.invoice.discountRate),
    status: inv.token.invoice.status,
    purchaseDate: inv.purchaseDate,
  }));
};

