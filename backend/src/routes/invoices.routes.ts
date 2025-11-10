import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as invoiceController from '../controllers/invoice.controller';

const router = Router();

router.get('/', invoiceController.listInvoices);
router.get('/:id', invoiceController.getInvoice);

router.use(authenticate);

router.post('/', authorize('SMB'), invoiceController.createInvoice);
router.patch('/:id/approve', authorize('ADMIN'), invoiceController.approveInvoice);
router.patch('/:id/reject', authorize('ADMIN'), invoiceController.rejectInvoice);

export default router;

