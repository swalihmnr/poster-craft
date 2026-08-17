import { Router } from 'express';
import { PosterController } from './poster.controller.js';
import { validate } from '../../middleware/validate.js';
import { createPosterSchema } from './poster.validation.js';

const router = Router();

router.post('/', validate(createPosterSchema), PosterController.create);
router.get('/:id', PosterController.getById);

export default router;
