const express = require('express');
const router = express.Router();
const messengerController = require('../controllers/messengerController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/conversations', messengerController.getConversations);
router.get('/:id', messengerController.getMessages);
router.post('/', messengerController.sendMessage);

module.exports = router;
