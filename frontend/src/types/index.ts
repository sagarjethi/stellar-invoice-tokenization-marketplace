export enum UserRole {
  SMB = 'SMB',
  INVESTOR = 'INVESTOR',
  ADMIN = 'ADMIN',
  VERIFIER = 'VERIFIER',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  LISTED = 'LISTED',
  FUNDED = 'FUNDED',
  PAID = 'PAID',
  DEFAULT = 'DEFAULT',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  stellarAccountId?: string;
  kycStatus: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  totalAmount: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
  discountRate: number;
  tokenId?: string;
  fundedPercentage: number;
  details?: any;
}

export interface Investment {
  id: string;
  invoice: Invoice;
  amount: number;
  tokens: string;
  purchasePrice: number;
  expectedYield: number;
  status: string;
  purchaseDate: string;
}

