import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as investmentService from '../services/investment.service';

export const createInvestment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const investorId = req.user!.id;
    const { invoiceId, amount, stellarTransactionHash } = req.body;

    const investment = await investmentService.createInvestment({
      invoiceId,
      investorId,
      amount: Number(amount),
      stellarTransactionHash,
    });

    res.status(201).json({ investment });
  } catch (error) {
    next(error);
  }
};

export const getInvestments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const investorId = req.user!.id;
    const investments = await investmentService.getInvestments(investorId);
    res.json({ investments });
  } catch (error) {
    next(error);
  }
};

