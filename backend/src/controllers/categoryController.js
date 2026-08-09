const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.specialization.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { lawyers: true },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
