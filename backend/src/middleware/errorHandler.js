class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error Log:', err);
  }

  // Duplicate key error (Prisma / SQL)
  if (err.code === 'P2002') {
    const field = err.meta?.target || 'field';
    return res.status(409).json({
      status: 'fail',
      message: `A record with this ${field} already exists.`,
    });
  }

  // Record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      status: 'fail',
      message: 'The requested resource was not found.',
    });
  }

  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'An unexpected error occurred on the server.',
    details: err.details || null,
  });
};

module.exports = {
  AppError,
  errorHandler,
};
