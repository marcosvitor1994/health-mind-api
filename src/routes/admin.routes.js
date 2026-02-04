const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Todas as rotas requerem autenticação e role admin
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Perfil do admin
router.get('/profile', adminController.getProfile);
router.put('/profile', adminController.updateProfile);

// Clínicas
router.get('/clinics', adminController.listClinics);
router.get('/clinics/:id', adminController.getClinic);
router.put('/clinics/:id', adminController.updateClinic);
router.delete('/clinics/:id', adminController.deleteClinic);
router.post('/clinics/:id/restore', adminController.restoreClinic);

// Psicólogos
router.get('/psychologists', adminController.listAllPsychologists);
router.delete('/psychologists/:id', adminController.deletePsychologist);
router.post('/psychologists/:id/restore', adminController.restorePsychologist);

// Pacientes
router.get('/patients', adminController.listAllPatients);
router.delete('/patients/:id', adminController.deletePatient);
router.post('/patients/:id/restore', adminController.restorePatient);

// Administradores (requer permissão promoteAdmin)
router.get('/admins', adminController.listAdmins);
router.post('/admins', adminController.createAdmin);
router.delete('/admins/:id', adminController.revokeAdmin);

module.exports = router;
