const express = require('express');
const router = express.Router();
const workingHoursController = require('../controllers/workingHoursController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas de horários de funcionamento
router.get(
  '/:entityType/:entityId',
  roleCheck(['clinic', 'psychologist']),
  workingHoursController.getWorkingHours
);

router.get(
  '/:entityType/:entityId/effective',
  roleCheck(['clinic', 'psychologist']),
  workingHoursController.getEffectiveSchedule
);

router.put(
  '/:entityType/:entityId',
  roleCheck(['clinic', 'psychologist']),
  workingHoursController.updateWorkingHours
);

router.post(
  '/:entityType/:entityId/override',
  roleCheck(['clinic', 'psychologist']),
  workingHoursController.addDateOverride
);

router.delete(
  '/:entityType/:entityId/override/:date',
  roleCheck(['clinic', 'psychologist']),
  workingHoursController.removeDateOverride
);

module.exports = router;
