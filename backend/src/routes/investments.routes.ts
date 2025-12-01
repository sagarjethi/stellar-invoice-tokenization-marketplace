import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as investmentController from '../controllers/investment.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('INVESTOR'), investmentController.getInvestments);
router.post('/', authorize('INVESTOR'), investmentController.createInvestment);

export default router;

