const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../utils/prisma');
const { AppError } = require('./errorHandler');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        clientProfile: true,
        lawyerProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return next(new AppError('Your account has been suspended or banned. Please contact support.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(`User role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this route`, 403)
      );
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
