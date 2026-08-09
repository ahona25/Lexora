const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = jwt.sign({ id: userId, role }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

// 1. Register Client
exports.registerClient = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, city } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return next(new AppError('Please provide all required fields: email, password, firstName, lastName', 400));
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: true, // Auto-verified for demo convenience
        clientProfile: {
          create: {
            firstName,
            lastName,
            city: city || null,
          },
        },
      },
      include: {
        clientProfile: true,
      },
    });

    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({
      status: 'success',
      message: 'Client account created successfully!',
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.clientProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Register Lawyer
exports.registerLawyer = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      professionalTitle,
      barNumber,
      yearsOfExperience,
      consultationFee,
      city,
      biography,
      specializationIds,
    } = req.body;

    if (!email || !password || !firstName || !lastName || !barNumber) {
      return next(new AppError('Please provide all required lawyer registration fields including Bar Number.', 400));
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    const existingBar = await prisma.lawyerProfile.findUnique({ where: { barNumber } });
    if (existingBar) {
      return next(new AppError('A lawyer profile with this Bar/License number already exists.', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        role: 'LAWYER',
        status: 'ACTIVE',
        emailVerified: true,
        lawyerProfile: {
          create: {
            firstName,
            lastName,
            professionalTitle: professionalTitle || 'Advocate',
            barNumber,
            yearsOfExperience: parseInt(yearsOfExperience || '0', 10),
            consultationFee: parseFloat(consultationFee || '0'),
            city: city || null,
            biography: biography || null,
            verificationStatus: 'PENDING', // Admin verification required
            isPubliclyVisible: false, // Not bookable until verified
          },
        },
      },
      include: {
        lawyerProfile: true,
      },
    });

    // Attach specializations if provided
    if (specializationIds && Array.isArray(specializationIds)) {
      for (let i = 0; i < specializationIds.length; i++) {
        await prisma.lawyerSpecialization.create({
          data: {
            lawyerProfileId: user.lawyerProfile.id,
            specializationId: specializationIds[i],
            isPrimary: i === 0,
          },
        });
      }
    }

    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({
      status: 'success',
      message: 'Lawyer application submitted successfully! Your profile is pending verification by our legal team.',
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.lawyerProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        clientProfile: true,
        lawyerProfile: true,
        adminProfile: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return next(new AppError('Your account has been suspended or banned.', 403));
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = generateTokens(user.id, user.role);
    const profile = user.clientProfile || user.lawyerProfile || user.adminProfile;

    res.status(200).json({
      status: 'success',
      tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Current User (/me)
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const profile = user.clientProfile || user.lawyerProfile || user.adminProfile;

    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};
