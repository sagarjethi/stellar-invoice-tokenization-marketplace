import prisma from '../config/database';
import { InvoiceStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

export interface CreateInvoiceData {
  invoiceNumber: string;
  smbId: string;
  buyerId: string;
  buyerName: string;
  totalAmount: number;
  currency?: string;
  dueDate: Date;
  issueDate: Date;
  discountRate: number;
  invoiceDocumentUrl?: string;
  metadataHash: string;
  details?: any;
}

export const createInvoice = async (data: CreateInvoiceData) => {
  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: data.invoiceNumber },
  });

  if (existingInvoice) {
    throw new AppError(409, 'Invoice number already exists', 'INVOICE_EXISTS');
  }

  const invoice = await prisma.invoice.create({
    data: {
      ...data,
      status: InvoiceStatus.DRAFT,
      currency: data.currency || 'USD',
    },
    include: {
      smb: {
        select: {
          id: true,
          email: true,
          smbProfile: true,
        },
      },
    },
  });

  return invoice;
};

export const getInvoice = async (id: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      smb: {
        select: {
          id: true,
          email: true,
          smbProfile: true,
        },
      },
      invoiceToken: true,
    },
  });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  }

  return invoice;
};

export const listInvoices = async (filters: {
  status?: InvoiceStatus;
  smbId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.smbId) {
    where.smbId = filters.smbId;
  }

  if (filters.minAmount || filters.maxAmount) {
    where.totalAmount = {};
    if (filters.minAmount) {
      where.totalAmount.gte = filters.minAmount;
    }
    if (filters.maxAmount) {
      where.totalAmount.lte = filters.maxAmount;
    }
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        invoiceToken: true,
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

