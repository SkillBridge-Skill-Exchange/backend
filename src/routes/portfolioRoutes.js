const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', portfolioController.getMyPortfolio);
router.post('/', portfolioController.addProject);
router.put('/:id', portfolioController.updateProject);
router.delete('/:id', portfolioController.deleteProject);

module.exports = router;
