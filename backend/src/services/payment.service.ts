import prisma from '../config/database';
import { contractService } from './contract.service';
import { AppError } from '../utils/errors';

export interface ConfirmPaymentData {
  invoiceId: string;
  verifierId: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentDate: string;
  confirmationProof: string;
}

export const confirmPayment = async (data: ConfirmPaymentData) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: {
      escrowTransactions: true,
      smb: true,
    },
  });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  }

  if (invoice.status !== 'FUNDED') {
    throw new AppError(400, 'Invoice is not funded yet', 'INVALID_STATUS');
  }

  const verifier = await prisma.user.findUnique({
    where: { id: data.verifierId },
  });

  if (!verifier || (verifier.role !== 'VERIFIER' && verifier.role !== 'ADMIN')) {
    throw new AppError(403, 'Unauthorized to confirm payment', 'FORBIDDEN');
  }

  // Verify off-chain payment
  // In a real system, this would involve checking bank APIs or oracle data
  
  // Release funds from Escrow contract
  const stellarSecretKey = process.env.STELLAR_SECRET_KEY;
  if (!stellarSecretKey) {
    throw new AppError(500, 'Stellar secret key not configured', 'CONFIG_ERROR');
  }

      // Call contract to release funds
  // Note: In our Escrow contract, release_payment transfers to investors + SMB
  const txHash = await contractService.releasePayment(
    invoice.id,
    stellarSecretKey
  );

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      verifierId: data.verifierId,
      paymentAmount: data.paymentAmount,
      paymentMethod: data.paymentMethod,
      paymentDate: new Date(data.paymentDate),
      confirmationProof: data.confirmationProof,
    },
  });

  // Create payout records for investors
  const payoutPromises = invoice.escrowTransactions.map(async (escrowTx) => {
    if (escrowTx.status === 'FUNDED') {
      // Calculate return including yield
      // Simplified: return principal + yield (based on discount rate)
      const principal = Number(escrowTx.amountEscrowed);
      const yieldAmount = principal * (Number(invoice.discountRate) / 100);
      const totalReturn = principal + yieldAmount;

      await prisma.payout.create({
        data: {
          invoiceId: invoice.id,
          recipientId: escrowTx.investorId,
          recipientType: 'INVESTOR',
          amount: totalReturn,
          status: 'COMPLETED', // Assuming contract released immediately
          stellarTransactionHash: txHash,
          completedAt: new Date(),
        },
      });

      // Update escrow transaction status
      await prisma.escrowTransaction.update({
        where: { id: escrowTx.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
    }
  });

  await Promise.all(payoutPromises);

  // Update invoice status
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: data.verifierId,
      action: 'PAYMENT_CONFIRMED',
      entityType: 'INVOICE',
      entityId: invoice.id,
      changes: {
        previousStatus: 'FUNDED',
        newStatus: 'PAID',
        paymentAmount: data.paymentAmount,
        transactionHash: txHash,
      },
    },
  });

  return {
    payment,
    invoice: updatedInvoice,
    transactionHash: txHash,
  };
};

