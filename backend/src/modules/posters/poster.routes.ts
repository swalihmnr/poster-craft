import { Router } from 'express';
import { PosterController } from './poster.controller.js';
import { handleValidationErrors } from '../../middleware/validate.js';
import { createPosterValidation } from './poster.validation.js';

const router = Router();

router.post('/', createPosterValidation, handleValidationErrors, PosterController.create);
router.get('/:id', PosterController.getById);

export default router;
