/**
 * Match Controller
 * -----------------
 * Handles skill-match retrieval using the AI placeholder service.
 */

const { asyncHandler } = require('../utils/helpers');
const { findMatchesForUser } = require('../services/matchService');
const models = require('../models');

/**
 * @desc    Get skill matches for the authenticated user
 * @route   GET /api/matches
 * @access  Private
 */
const getMatches = asyncHandler(async (req, res) => {
  const matches = await findMatchesForUser(req.user.id, models);

  res.status(200).json({
    success: true,
    count: matches.length,
    data: matches,
  });
});

module.exports = { getMatches };
