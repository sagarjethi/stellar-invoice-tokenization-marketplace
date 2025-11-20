import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { contractService } from '../services/contract.service';
import { AppError } from '../utils/errors';
import { InvoiceStatus, EscrowStatus, PayoutStatus } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post('/', authorize('VERIFIER', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { invoiceId, paymentAmount, paymentDate } = req.body;

    if (!invoiceId) {
      throw new AppError(400, 'Invoice ID is required', 'MISSING_FIELDS');
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        invoiceToken: {
          include: {
            ownerships: {
              include: {
                owner: true,
              },
            },
          },
        },
        escrowTransactions: true,
      },
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
    }

    if (invoice.status !== 'FUNDED') {
      throw new AppError(400, 'Invoice must be funded before payment confirmation', 'INVALID_STATUS');
    }

    const stellarSecretKey = process.env.STELLAR_SECRET_KEY;
    if (!stellarSecretKey) {
      throw new AppError(500, 'Stellar secret key not configured', 'CONFIG_ERROR');
    }

    const releaseTxHash = await contractService.releasePayment(
      invoice.id,
      stellarSecretKey
    );

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: paymentAmount ? BigInt(Math.floor(paymentAmount * 10000000)) : invoice.totalAmount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        confirmedBy: req.user!.id,
        transactionHash: releaseTxHash,
      },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    for (const escrowTx of invoice.escrowTransactions) {
      await prisma.escrowTransaction.update({
        where: { id: escrowTx.id },
        data: {
          status: EscrowStatus.RELEASED,
        },
      });

      const investorAmount = Number(escrowTx.amount) * (1 + invoice.discountRate / 100);
      const smbAmount = Number(escrowTx.amount) * (1 - invoice.discountRate / 100);

      await prisma.payout.create({
        data: {
          invoiceId: invoice.id,
          userId: escrowTx.investorId,
          amount: BigInt(Math.floor(investorAmount * 10000000)),
          status: PayoutStatus.PENDING,
        },
      });

      await prisma.payout.create({
        data: {
          invoiceId: invoice.id,
          userId: invoice.smbId,
          amount: BigInt(Math.floor(smbAmount * 10000000)),
          status: PayoutStatus.PENDING,
        },
      });
    }

    res.status(201).json({
      payment,
      transactionHash: releaseTxHash,
      message: 'Payment confirmed and escrow released',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

