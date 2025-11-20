import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { contractService } from '../services/contract.service';
import { AppError } from '../utils/errors';

const router = Router();

router.use(authenticate);

router.get('/', authorize('INVESTOR'), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    
    const investments = await prisma.tokenOwnership.findMany({
      where: { ownerId: userId },
      include: {
        invoiceToken: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ investments });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('INVESTOR'), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { invoiceId, amount, walletAddress } = req.body;

    if (!invoiceId || !amount) {
      throw new AppError(400, 'Invoice ID and amount are required', 'MISSING_FIELDS');
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        invoiceToken: true,
        smb: true,
      },
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
    }

    if (invoice.status !== 'LISTED') {
      throw new AppError(400, 'Invoice is not available for investment', 'INVALID_STATUS');
    }

    if (!invoice.invoiceToken) {
      throw new AppError(400, 'Invoice has not been tokenized', 'NOT_TOKENIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Use wallet address from request if provided, otherwise use linked account
    const investorAddress = walletAddress || user?.stellarAccountId;
    
    if (!investorAddress) {
      throw new AppError(400, 'Stellar account not linked. Please connect your wallet or link a Stellar account.', 'NO_STELLAR_ACCOUNT');
    }

    // Update user's stellar account if wallet address provided and different
    if (walletAddress && walletAddress !== user?.stellarAccountId) {
      await prisma.user.update({
        where: { id: userId },
        data: { stellarAccountId: walletAddress },
      });
    }

    const stellarSecretKey = process.env.STELLAR_SECRET_KEY;
    if (!stellarSecretKey) {
      throw new AppError(500, 'Stellar secret key not configured', 'CONFIG_ERROR');
    }

    const amountInStroops = BigInt(Math.floor(amount * 10000000)).toString();

    const escrowTxHash = await contractService.depositToEscrow(
      invoice.id,
      amountInStroops,
      investorAddress,
      stellarSecretKey
    );

    const purchaseTxHash = await contractService.purchaseInvoiceToken(
      invoice.invoiceToken.tokenId,
      amountInStroops,
      investorAddress,
      stellarSecretKey
    );

    const ownership = await prisma.tokenOwnership.create({
      data: {
        tokenId: invoice.invoiceToken.id,
        ownerId: userId,
        amount: BigInt(amountInStroops),
      },
    });

    await prisma.escrowTransaction.create({
      data: {
        invoiceId: invoice.id,
        investorId: userId,
        amount: BigInt(amountInStroops),
        transactionHash: escrowTxHash,
        status: 'FUNDED',
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        invoiceId: invoice.id,
        type: 'TOKEN_PURCHASE',
        amount: BigInt(amountInStroops),
        transactionHash: purchaseTxHash,
        status: 'SUCCESS',
      },
    });

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        fundedAmount: (invoice.fundedAmount || BigInt(0)) + BigInt(amountInStroops),
      },
    });

    res.status(201).json({
      investment: ownership,
      invoice: updatedInvoice,
      transactionHashes: {
        escrow: escrowTxHash,
        purchase: purchaseTxHash,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

