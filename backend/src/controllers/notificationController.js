const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// 1. Get Notifications for Current User
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const [total, notifications, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    res.status(200).json({
      status: 'success',
      total,
      unreadCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Mark notification(s) as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { ids, markAll } = req.body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (ids && Array.isArray(ids)) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: req.user.id },
        data: { isRead: true, readAt: new Date() },
      });
    }

    res.status(200).json({ status: 'success', message: 'Notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
