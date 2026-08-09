const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// 1. Search & Filter Lawyers
exports.getLawyers = async (req, res, next) => {
  try {
    const {
      search,
      specializationId,
      city,
      minFee,
      maxFee,
      minExperience,
      rating,
      consultationType,
      sortBy = 'rating',
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query filter
    const where = {
      verificationStatus: 'APPROVED',
      isPubliclyVisible: true,
      user: {
        status: 'ACTIVE',
      },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { professionalTitle: { contains: search } },
        { biography: { contains: search } },
      ];
    }

    if (city) {
      where.city = { contains: city };
    }

    if (minFee || maxFee) {
      where.consultationFee = {};
      if (minFee) where.consultationFee.gte = parseFloat(minFee);
      if (maxFee) where.consultationFee.lte = parseFloat(maxFee);
    }

    if (minExperience) {
      where.yearsOfExperience = { gte: parseInt(minExperience, 10) };
    }

    if (rating) {
      where.averageRating = { gte: parseFloat(rating) };
    }

    if (consultationType === 'IN_PERSON') {
      where.isAvailableForInPerson = true;
    } else if (consultationType === 'ONLINE') {
      where.isAvailableForOnline = true;
    }

    if (specializationId) {
      where.specializations = {
        some: {
          specializationId,
        },
      };
    }

    // Build sorting
    let orderBy = {};
    if (sortBy === 'lowest_fee') {
      orderBy = { consultationFee: 'asc' };
    } else if (sortBy === 'highest_fee') {
      orderBy = { consultationFee: 'desc' };
    } else if (sortBy === 'experience') {
      orderBy = { yearsOfExperience: 'desc' };
    } else if (sortBy === 'most_reviewed') {
      orderBy = { totalReviews: 'desc' };
    } else {
      orderBy = { averageRating: 'desc' }; // default
    }

    const [total, lawyers] = await Promise.all([
      prisma.lawyerProfile.count({ where }),
      prisma.lawyerProfile.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          specializations: {
            include: {
              specialization: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: lawyers,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Lawyer Profile by ID
exports.getLawyerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { id },
      include: {
        specializations: {
          include: {
            specialization: true,
          },
        },
        availabilitySchedule: true,
        blockedSchedules: {
          where: {
            blockedDate: { gte: new Date() },
          },
        },
        reviews: {
          where: { isVisible: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            clientProfile: {
              select: {
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!lawyer || lawyer.verificationStatus !== 'APPROVED') {
      return next(new AppError('Lawyer profile not found or not bookable.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: lawyer,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Lawyer Available Time Slots for a Specific Date
exports.getLawyerAvailableSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD format

    if (!date) {
      return next(new AppError('Please specify a date parameter (YYYY-MM-DD).', 400));
    }

    const targetDate = new Date(date);
    const daysOfWeekMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = daysOfWeekMap[targetDate.getDay()];

    // 1. Get weekly schedule for that day
    const schedule = await prisma.availabilitySchedule.findFirst({
      where: {
        lawyerProfileId: id,
        dayOfWeek: dayName,
        isActive: true,
      },
    });

    if (!schedule) {
      return res.status(200).json({
        status: 'success',
        available: false,
        message: 'Lawyer is not available on this day.',
        slots: [],
      });
    }

    // 2. Check if whole date is blocked
    const blocked = await prisma.blockedSchedule.findFirst({
      where: {
        lawyerProfileId: id,
        blockedDate: targetDate,
      },
    });

    if (blocked && !blocked.blockedTimeStart) {
      return res.status(200).json({
        status: 'success',
        available: false,
        message: 'Lawyer has blocked appointments for this date.',
        slots: [],
      });
    }

    // 3. Get existing booked appointments on this date
    const existingBookings = await prisma.appointment.findMany({
      where: {
        lawyerProfileId: id,
        appointmentDate: targetDate,
        status: {
          in: ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const bookedSlotsSet = new Set(existingBookings.map((b) => b.startTime));

    // 4. Generate slots from start time to end time
    const slots = [];
    let currentHour = parseInt(schedule.startTime.split(':')[0], 10);
    const endHour = parseInt(schedule.endTime.split(':')[0], 10);

    while (currentHour < endHour) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:00`;
      const nextHourString = `${(currentHour + 1).toString().padStart(2, '0')}:00`;

      // Check break time
      let isBreak = false;
      if (schedule.breakStart && schedule.breakEnd) {
        const breakStartHour = parseInt(schedule.breakStart.split(':')[0], 10);
        const breakEndHour = parseInt(schedule.breakEnd.split(':')[0], 10);
        if (currentHour >= breakStartHour && currentHour < breakEndHour) {
          isBreak = true;
        }
      }

      if (!isBreak) {
        slots.push({
          time: timeString,
          endTime: nextHourString,
          isBooked: bookedSlotsSet.has(timeString),
        });
      }

      currentHour++;
    }

    res.status(200).json({
      status: 'success',
      available: true,
      day: dayName,
      slots,
    });
  } catch (error) {
    next(error);
  }
};
