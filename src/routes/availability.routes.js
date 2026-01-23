const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas de disponibilidade
router.get(
  '/slots',
  roleCheck(['clinic', 'psychologist', 'patient']),
  availabilityController.getAvailableSlots
);

router.get(
  '/rooms',
  roleCheck(['clinic', 'psychologist']),
  availabilityController.getAvailableRooms
);

module.exports = router;
