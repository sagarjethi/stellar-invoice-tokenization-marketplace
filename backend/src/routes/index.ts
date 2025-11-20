import { Router } from 'express';
import authRoutes from './auth.routes';
import invoiceRoutes from './invoices.routes';
import investmentRoutes from './investments.routes';
import paymentRoutes from './payments.routes';
import adminRoutes from './admin.routes';
import contractRoutes from './contracts.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'stellar-flow-api' });
});

router.use('/auth', authRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/investments', investmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/contracts', contractRoutes);

export default router;

