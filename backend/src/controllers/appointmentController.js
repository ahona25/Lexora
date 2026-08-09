const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// Helper to generate unique appointment number
const generateAppointmentNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `APT-${new Date().getFullYear()}-${timestamp}${random}`;
};

// 1. Create Appointment / Initiate Booking (Transactional Double Booking Protection)
exports.createAppointment = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role !== 'CLIENT' || !user.clientProfile) {
      return next(new AppError('Only clients can book legal appointments.', 403));
    }

    const {
      lawyerProfileId,
      consultationType, // VIDEO, AUDIO, CHAT, IN_PERSON
      appointmentDate,  // YYYY-MM-DD
      startTime,         // "10:00"
      caseTitle,
      caseCategory,
      caseDescription,
      urgency,
      additionalNotes,
    } = req.body;

    if (!lawyerProfileId || !consultationType || !appointmentDate || !startTime) {
      return next(new AppError('Please provide lawyerProfileId, consultationType, appointmentDate, and startTime.', 400));
    }

    const bookingDate = new Date(appointmentDate);

    // Run in Prisma transaction to guarantee atomic slot reservation
    const newAppointment = await prisma.$transaction(async (tx) => {
      // 1. Check lawyer exists and is verified
      const lawyer = await tx.lawyerProfile.findUnique({
        where: { id: lawyerProfileId },
      });

      if (!lawyer || lawyer.verificationStatus !== 'APPROVED') {
        throw new AppError('The selected lawyer is currently not verified or available for bookings.', 400);
      }

      // 2. Check for conflicting active bookings for this lawyer at the exact same date & time
      const existing = await tx.appointment.findFirst({
        where: {
          lawyerProfileId,
          appointmentDate: bookingDate,
          startTime,
          status: {
            in: ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      });

      if (existing) {
        throw new AppError('This time slot has already been reserved by another client. Please select a different slot.', 409);
      }

      // Calculate endTime (1 hour slot by default)
      const startHour = parseInt(startTime.split(':')[0], 10);
      const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;

      const fee = Number(lawyer.consultationFee);
      const platformFee = Math.round(fee * 0.10); // 10% platform fee
      const totalAmount = fee + platformFee;

      // 3. Create appointment with status AWAITING_PAYMENT
      const appointment = await tx.appointment.create({
        data: {
          appointmentNumber: generateAppointmentNumber(),
          clientProfileId: user.clientProfile.id,
          lawyerProfileId,
          consultationType,
          appointmentDate: bookingDate,
          startTime,
          endTime,
          status: 'AWAITING_PAYMENT',
          caseTitle: caseTitle || 'Legal Consultation',
          caseCategory: caseCategory || 'General Legal Advice',
          caseDescription: caseDescription || null,
          urgency: urgency || 'medium',
          additionalNotes: additionalNotes || null,
          consultationFee: fee,
          platformFee,
          totalAmount,
        },
        include: {
          lawyerProfile: {
            select: {
              firstName: true,
              lastName: true,
              professionalTitle: true,
              profileImage: true,
            },
          },
          clientProfile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // 4. Create initial notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'BOOKING_REQUEST',
          title: 'Appointment Booking Initiated',
          message: `Your consultation request (${appointment.appointmentNumber}) with ${lawyer.firstName} ${lawyer.lastName} is pending payment.`,
          appointmentId: appointment.id,
        },
      });

      return appointment;
    });

    res.status(201).json({
      status: 'success',
      message: 'Appointment reserved successfully! Please complete payment to confirm your booking.',
      data: newAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User Appointments (Role-filtered)
exports.getAppointments = async (req, res, next) => {
  try {
    const user = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (user.role === 'CLIENT' && user.clientProfile) {
      where.clientProfileId = user.clientProfile.id;
    } else if (user.role === 'LAWYER' && user.lawyerProfile) {
      where.lawyerProfileId = user.lawyerProfile.id;
    } else if (user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized access to appointments.', 403));
    }

    if (status) {
      where.status = status;
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        orderBy: { appointmentDate: 'desc' },
        skip,
        take: limitNum,
        include: {
          lawyerProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              professionalTitle: true,
              profileImage: true,
              officeAddress: true,
            },
          },
          clientProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          payment: true,
          review: true,
        },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Appointment Detail
exports.getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        lawyerProfile: true,
        clientProfile: true,
        payment: true,
        review: true,
        documents: true,
        consultation: true,
      },
    });

    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    // Access check
    const isOwnerClient = user.clientProfile && appointment.clientProfileId === user.clientProfile.id;
    const isOwnerLawyer = user.lawyerProfile && appointment.lawyerProfileId === user.lawyerProfile.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwnerClient && !isOwnerLawyer && !isAdmin) {
      return next(new AppError('You do not have permission to view this appointment.', 403));
    }

    res.status(200).json({
      status: 'success',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Cancel Appointment
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const user = req.user;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    if (['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(appointment.status)) {
      return next(new AppError(`Appointment cannot be cancelled because it is already ${appointment.status}.`, 400));
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: cancellationReason || 'Cancelled by user',
        cancelledAt: new Date(),
        cancelledBy: user.role,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Appointment has been cancelled successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
