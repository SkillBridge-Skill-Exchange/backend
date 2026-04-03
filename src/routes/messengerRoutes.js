const express = require('express');
const router = express.Router();
const messengerController = require('../controllers/messengerController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.use(protect);

router.get('/conversations', messengerController.getConversations);
router.get('/unread-count', messengerController.getUnreadCount);
router.get('/presence/:userId', messengerController.getPresence);
router.post('/group', messengerController.createGroup);
router.get('/:id', messengerController.getMessages);
router.post('/', messengerController.sendMessage);
router.post('/upload', upload.single('file'), messengerController.uploadFile);

module.exports = router;
