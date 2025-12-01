import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as paymentService from '../services/payment.service';

export const confirmPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const verifierId = req.user!.id;
    const {
      invoiceId,
      paymentAmount,
      paymentMethod,
      paymentDate,
      confirmationProof,
    } = req.body;

    const result = await paymentService.confirmPayment({
      invoiceId,
      verifierId,
      paymentAmount: Number(paymentAmount),
      paymentMethod,
      paymentDate,
      confirmationProof,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

