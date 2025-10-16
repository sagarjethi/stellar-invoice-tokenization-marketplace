import { z } from 'zod';
import { AppError } from './errors';

export const validate = (schema: z.ZodSchema) => {
  return (req: any, _res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(
            400,
            'Validation error',
            'VALIDATION_ERROR',
            error.errors
          )
        );
      }
      next(error);
    }
  };
};

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SMB', 'INVESTOR', 'ADMIN', 'VERIFIER']),
  stellarAccountId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  buyerId: z.string().min(1, 'Buyer ID is required'),
  buyerName: z.string().min(1, 'Buyer name is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().default('USD'),
  dueDate: z.string().transform((str) => new Date(str)),
  issueDate: z.string().transform((str) => new Date(str)),
  discountRate: z.number().min(0).max(100, 'Discount rate must be between 0 and 100'),
  invoiceDocumentUrl: z.string().url().optional(),
  metadataHash: z.string().min(1, 'Metadata hash is required'),
});

