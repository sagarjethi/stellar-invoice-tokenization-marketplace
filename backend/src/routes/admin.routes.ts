import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as invoiceController from '../controllers/invoice.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/invoices/pending', async (req, res, next) => {
  try {
    const modifiedReq = {
      ...req,
      query: { ...req.query, status: 'PENDING_APPROVAL' },
    } as any;
    await invoiceController.listInvoices(modifiedReq, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    // TODO: Implement admin dashboard stats
    res.json({
      totalInvoices: 0,
      pendingApproval: 0,
      totalVolume: 0,
      activeInvestments: 0,
      defaultRate: 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;

