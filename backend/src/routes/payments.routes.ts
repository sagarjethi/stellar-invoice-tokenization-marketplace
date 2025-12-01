import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('VERIFIER', 'ADMIN'), paymentController.confirmPayment);

export default router;

