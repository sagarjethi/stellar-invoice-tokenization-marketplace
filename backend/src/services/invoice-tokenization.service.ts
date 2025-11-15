import prisma from '../config/database';
import { contractService } from './contract.service';
import { stellarService } from './stellar.service';
import { AppError } from '../utils/errors';
import crypto from 'crypto';

export interface TokenizeInvoiceData {
  invoiceId: string;
  totalAmount: number;
  discountRate: number;
}

export const tokenizeInvoice = async (data: TokenizeInvoiceData) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { smb: true },
  });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  }

  if (invoice.status !== 'PENDING_APPROVAL') {
    throw new AppError(400, 'Invoice must be approved before tokenization', 'INVALID_STATUS');
  }

  const invoiceMetadata = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    smbId: invoice.smbId,
    buyerId: invoice.buyerId,
    buyerName: invoice.buyerName,
    totalAmount: invoice.totalAmount.toString(),
    currency: invoice.currency,
    dueDate: invoice.dueDate.toISOString(),
    issueDate: invoice.issueDate.toISOString(),
    discountRate: invoice.discountRate.toString(),
  };

  const metadataString = JSON.stringify(invoiceMetadata);
  const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');

  const totalSupply = BigInt(Math.floor(data.totalAmount * 10000000));
  const tokenId = `INV-${invoice.invoiceNumber}-${Date.now()}`;

  try {
    const tokenContractId = process.env.INVOICE_TOKEN_CONTRACT_ID;
    if (!tokenContractId) {
      throw new AppError(500, 'Invoice token contract not configured', 'CONTRACT_NOT_CONFIGURED');
    }

    if (!invoice.smb.stellarAccountId) {
      throw new AppError(400, 'SMB must have a Stellar account linked', 'NO_STELLAR_ACCOUNT');
    }

    const stellarSecretKey = process.env.STELLAR_SECRET_KEY;
    if (!stellarSecretKey) {
      throw new AppError(500, 'Stellar secret key not configured', 'CONFIG_ERROR');
    }

    const txHash = await contractService.initializeInvoiceToken(
      invoice.smb.stellarAccountId,
        invoice.invoiceNumber,
        metadataHash,
        totalSupply.toString(),
      stellarSecretKey
    );

    const invoiceToken = await prisma.invoiceToken.create({
      data: {
        invoiceId: invoice.id,
        tokenContractId,
        tokenId,
        totalSupply,
      },
    });

    const marketplaceContractId = process.env.MARKETPLACE_CONTRACT_ID;
    if (marketplaceContractId) {
      const price = totalSupply.toString();
      const discountRate = invoice.discountRate.toString();
      
      await contractService.listTokenOnMarketplace(
        tokenContractId,
        price,
        discountRate,
        stellarSecretKey
      );
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'LISTED',
        metadataHash,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: invoice.smbId,
        invoiceId: invoice.id,
        type: 'TOKEN_MINT',
        amount: totalSupply,
        transactionHash: txHash,
        status: 'SUCCESS',
      },
    });

    return invoiceToken;
  } catch (error: any) {
    throw new AppError(
      500,
      `Tokenization failed: ${error.message}`,
      'TOKENIZATION_FAILED',
      error
    );
  }
};

export const getInvoiceToken = async (invoiceId: string) => {
  const invoiceToken = await prisma.invoiceToken.findUnique({
    where: { invoiceId },
    include: {
      invoice: {
        include: {
          smb: {
            select: {
              id: true,
              email: true,
              smbProfile: true,
            },
          },
        },
      },
    },
  });

  if (!invoiceToken) {
    throw new AppError(404, 'Invoice token not found', 'NOT_FOUND');
  }

  return invoiceToken;
};

