const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams para acessar :clinicId
const roomController = require('../controllers/roomController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas de salas (acessíveis por clínica e psicólogos vinculados)
router.get('/schedule', authorize('clinic', 'psychologist'), roomController.getAllRoomsSchedule);
router.get('/', authorize('clinic', 'psychologist'), roomController.getRooms);
router.get('/:roomId', authorize('clinic', 'psychologist'), roomController.getRoom);
router.get('/:roomId/schedule', authorize('clinic', 'psychologist'), roomController.getRoomSchedule);

// Rotas de gerenciamento (apenas clínica)
router.post('/', authorize('clinic'), roomController.createRoom);
router.put('/:roomId', authorize('clinic'), roomController.updateRoom);
router.delete('/:roomId', authorize('clinic'), roomController.deleteRoom);

module.exports = router;
