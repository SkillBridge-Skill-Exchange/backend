/**
 * Utility Helpers
 * ================
 * Reusable utility functions for the backend.
 */

/**
 * Async handler wrapper — eliminates the need for try/catch in each controller.
 * Wraps an async route handler and passes errors to Express's error handler.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
