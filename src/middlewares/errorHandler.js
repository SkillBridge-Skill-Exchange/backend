const errorHandler = (err, req, res, next) => {
  // console.error('Error:', err.message);
  // console.error('Stack:', err.stack);

  // Mongoose / Sequelize validation errors
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    const messages = err.errors ? Object.values(err.errors).map(e => e.message) : [err.message];
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // MongoDB / Sequelize duplicate key/unique constraint errors
  if (err.code === 11000 || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate Entry',
      errors: ['This information already exists in our system.'],
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};


module.exports = errorHandler;
