const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams para acessar :clinicId
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas de salas (acessíveis por clínica e psicólogos vinculados)
router.get('/schedule', roleCheck(['clinic', 'psychologist']), roomController.getAllRoomsSchedule);
router.get('/', roleCheck(['clinic', 'psychologist']), roomController.getRooms);
router.get('/:roomId', roleCheck(['clinic', 'psychologist']), roomController.getRoom);
router.get('/:roomId/schedule', roleCheck(['clinic', 'psychologist']), roomController.getRoomSchedule);

// Rotas de gerenciamento (apenas clínica)
router.post('/', roleCheck(['clinic']), roomController.createRoom);
router.put('/:roomId', roleCheck(['clinic']), roomController.updateRoom);
router.delete('/:roomId', roleCheck(['clinic']), roomController.deleteRoom);

module.exports = router;
