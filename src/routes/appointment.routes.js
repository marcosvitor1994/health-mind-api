const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  getPsychologistAppointments,
  getPatientAppointments,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

/**
 * @route   POST /api/appointments
 * @desc    Criar novo agendamento
 * @access  Private (Psychologist, Patient)
 */
router.post('/', protect, authorize('psychologist', 'patient'), createAppointment);

/**
 * @route   GET /api/appointments/:id
 * @desc    Obter agendamento específico
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.get('/:id', protect, authorize('patient', 'psychologist', 'clinic'), getAppointment);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Atualizar agendamento
 * @access  Private (Psychologist, Patient, Clinic)
 */
router.put('/:id', protect, authorize('psychologist', 'patient', 'clinic'), updateAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancelar agendamento
 * @access  Private (Psychologist, Patient, Clinic)
 */
router.delete('/:id', protect, authorize('psychologist', 'patient', 'clinic'), cancelAppointment);

/**
 * @route   GET /api/appointments/psychologist/:psychologistId
 * @desc    Listar agendamentos de um psicólogo
 * @access  Private (Psychologist, Clinic)
 */
router.get('/psychologist/:psychologistId', protect, authorize('psychologist', 'clinic'), getPsychologistAppointments);

/**
 * @route   GET /api/appointments/patient/:patientId
 * @desc    Listar agendamentos de um paciente
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.get('/patient/:patientId', protect, authorize('patient', 'psychologist', 'clinic'), getPatientAppointments);

module.exports = router;
