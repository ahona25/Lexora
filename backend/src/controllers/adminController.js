const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// 1. Admin Dashboard Stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalClients,
      totalLawyers,
      verifiedLawyers,
      pendingVerification,
      totalAppointments,
      completedConsultations,
      cancelledAppointments,
      revenueData,
      pendingPayments,
      openComplaints,
    ] = await Promise.all([
      prisma.clientProfile.count(),
      prisma.lawyerProfile.count(),
      prisma.lawyerProfile.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.lawyerProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESSFUL' },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalClients,
        totalLawyers,
        verifiedLawyers,
        pendingVerification,
        totalAppointments,
        completedConsultations,
        cancelledAppointments,
        revenue: revenueData._sum.amount || 0,
        pendingPayments,
        openComplaints,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Lawyers (for admin panel)
exports.getAllLawyers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where = {};
    if (status) where.verificationStatus = status;

    const [total, lawyers] = await Promise.all([
      prisma.lawyerProfile.count({ where }),
      prisma.lawyerProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { email: true, status: true, createdAt: true } },
          specializations: { include: { specialization: true } },
        },
      }),
    ]);

    res.status(200).json({ status: 'success', total, data: lawyers });
  } catch (error) {
    next(error);
  }
};

// 3. Verify / Reject / Suspend Lawyer
exports.updateLawyerVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationStatus, verificationNotes } = req.body;

    const validStatuses = ['APPROVED', 'REJECTED', 'SUSPENDED', 'UNDER_REVIEW'];
    if (!validStatuses.includes(verificationStatus)) {
      return next(new AppError(`Invalid verification status: ${verificationStatus}`, 400));
    }

    const isPubliclyVisible = verificationStatus === 'APPROVED';

    const updated = await prisma.lawyerProfile.update({
      where: { id },
      data: {
        verificationStatus,
        verificationNotes: verificationNotes || null,
        isPubliclyVisible,
        verifiedAt: verificationStatus === 'APPROVED' ? new Date() : undefined,
        verifiedByAdminId: req.user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: `LAWYER_${verificationStatus}`,
        targetType: 'LawyerProfile',
        targetId: id,
        metadata: { verificationNotes },
      },
    });

    res.status(200).json({
      status: 'success',
      message: `Lawyer profile has been ${verificationStatus.toLowerCase()}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get All Users (clients + lawyers)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.email = { contains: search };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          clientProfile: { select: { firstName: true, lastName: true, city: true } },
          lawyerProfile: { select: { firstName: true, lastName: true, verificationStatus: true } },
        },
      }),
    ]);

    res.status(200).json({ status: 'success', total, data: users });
  } catch (error) {
    next(error);
  }
};

// 5. Suspend / Activate User
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'INACTIVE'];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid user status: ${status}`, 400));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: `USER_STATUS_CHANGED_TO_${status}`,
        targetType: 'User',
        targetId: id,
      },
    });

    res.status(200).json({ status: 'success', message: `User status updated to ${status}.`, data: updated });
  } catch (error) {
    next(error);
  }
};

// 6. Get All Appointments (admin overview)
exports.getAllAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where = {};
    if (status) where.status = status;

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          clientProfile: { select: { firstName: true, lastName: true } },
          lawyerProfile: { select: { firstName: true, lastName: true } },
          payment: { select: { status: true, amount: true, paymentMethod: true } },
        },
      }),
    ]);

    res.status(200).json({ status: 'success', total, data: appointments });
  } catch (error) {
    next(error);
  }
};

// 7. Get All Payments (admin overview)
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where = {};
    if (status) where.status = status;

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          appointment: {
            include: {
              clientProfile: { select: { firstName: true, lastName: true } },
              lawyerProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    res.status(200).json({ status: 'success', total, data: payments });
  } catch (error) {
    next(error);
  }
};

// 8. Get all reviews (for moderation)
exports.getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const [total, reviews] = await Promise.all([
      prisma.review.count(),
      prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          clientProfile: { select: { firstName: true, lastName: true } },
          lawyerProfile: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    res.status(200).json({ status: 'success', total, data: reviews });
  } catch (error) {
    next(error);
  }
};

// 9. Toggle Review Visibility
exports.toggleReviewVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return next(new AppError('Review not found.', 404));

    const updated = await prisma.review.update({
      where: { id },
      data: { isVisible: !review.isVisible, moderatedAt: new Date(), moderatedBy: req.user.id },
    });

    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};

// 10. Admin Audit Logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          actor: { select: { email: true, role: true } },
        },
      }),
    ]);

    res.status(200).json({ status: 'success', total, data: logs });
  } catch (error) {
    next(error);
  }
};

// 11. Category Management
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, displayOrder } = req.body;
    const category = await prisma.specialization.create({
      data: { name, description, icon, displayOrder: displayOrder || 0 },
    });
    res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive, displayOrder } = req.body;
    const updated = await prisma.specialization.update({
      where: { id },
      data: { name, description, icon, isActive, displayOrder },
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};
