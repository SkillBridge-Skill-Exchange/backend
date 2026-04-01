/**
 * Match Routes
 * ------------
 * GET /api/matches - Get skill matches for authenticated user (protected)
 */

const { Router } = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getMatches } = require('../controllers/matchController');

const router = Router();

router.get('/', protect, getMatches);

module.exports = router;
