import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { contractService } from '../services/contract.service';

const router = Router();

router.use(authenticate);

router.get('/addresses', (_req, res) => {
  try {
    const addresses = contractService.getAddresses();
    res.json(addresses);
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'CONTRACT_ERROR',
        message: 'Failed to get contract addresses',
        details: error.message,
      },
    });
  }
});

export default router;

