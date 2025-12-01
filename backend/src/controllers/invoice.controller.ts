import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as invoiceService from '../services/invoice.service';
import * as tokenizationService from '../services/invoice-tokenization.service';
import { InvoiceStatus } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

export const createInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    
    const { issueDate, dueDate } = req.body;

    if (!issueDate || !dueDate) {
      throw new AppError(400, 'Issue date and due date are required', 'MISSING_FIELDS');
    }

    const parsedIssueDate = new Date(issueDate);
    const parsedDueDate = new Date(dueDate);

    if (isNaN(parsedIssueDate.getTime()) || isNaN(parsedDueDate.getTime())) {
      throw new AppError(400, 'Invalid date format', 'INVALID_DATE');
    }

    const invoice = await invoiceService.createInvoice({
      ...req.body,
      smbId: userId,
      issueDate: parsedIssueDate,
      dueDate: parsedDueDate,
    });

    res.status(201).json({ invoice });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoice(id);
    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};

export const listInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      status,
      smbId,
      minAmount,
      maxAmount,
      page,
      limit,
    } = req.query;

    const result = await invoiceService.listInvoices({
      status: status as any,
      smbId: smbId as string,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const approveInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        smb: true,
      },
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
    }

    if (invoice.status !== InvoiceStatus.PENDING_APPROVAL) {
      throw new AppError(400, 'Invoice is not pending approval', 'INVALID_STATUS');
    }

    await prisma.invoice.update({
      where: { id },
      data: {
        approvedAt: new Date(),
      },
    });

    const invoiceToken = await tokenizationService.tokenizeInvoice({
      invoiceId: id,
      totalAmount: Number(invoice.totalAmount) / 10000000,
      discountRate: Number(invoice.discountRate),
    });

    const updated = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceToken: true,
      },
    });

    res.json({ invoice: updated, token: invoiceToken });
  } catch (error) {
    next(error);
  }
};

export const rejectInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
      },
    });

    res.json({ invoice: updated, reason });
  } catch (error) {
    next(error);
  }
};
