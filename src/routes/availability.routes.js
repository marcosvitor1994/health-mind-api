const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas de disponibilidade
router.get(
  '/slots',
  authorize('clinic', 'psychologist', 'patient'),
  availabilityController.getAvailableSlots
);

router.get(
  '/rooms',
  authorize('clinic', 'psychologist'),
  availabilityController.getAvailableRooms
);

module.exports = router;
