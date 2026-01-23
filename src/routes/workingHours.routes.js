const express = require('express');
const router = express.Router();
const workingHoursController = require('../controllers/workingHoursController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas de horários de funcionamento
router.get(
  '/:entityType/:entityId',
  authorize('clinic', 'psychologist'),
  workingHoursController.getWorkingHours
);

router.get(
  '/:entityType/:entityId/effective',
  authorize('clinic', 'psychologist'),
  workingHoursController.getEffectiveSchedule
);

router.put(
  '/:entityType/:entityId',
  authorize('clinic', 'psychologist'),
  workingHoursController.updateWorkingHours
);

router.post(
  '/:entityType/:entityId/override',
  authorize('clinic', 'psychologist'),
  workingHoursController.addDateOverride
);

router.delete(
  '/:entityType/:entityId/override/:date',
  authorize('clinic', 'psychologist'),
  workingHoursController.removeDateOverride
);

module.exports = router;
