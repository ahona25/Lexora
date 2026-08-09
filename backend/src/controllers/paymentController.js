const prisma = require('../utils/prisma');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

// Helper to generate receipt number
const generateReceiptNumber = () => {
  return `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
};

// 1. Initiate Payment for an Appointment
exports.initiatePayment = async (req, res, next) => {
  try {
    const { appointmentId, paymentMethod = 'BKASH' } = req.body;
    const user = req.user;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        lawyerProfile: true,
        clientProfile: true,
      },
    });

    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    if (appointment.clientProfileId !== user.clientProfile?.id) {
      return next(new AppError('Unauthorized payment attempt.', 403));
    }

    if (appointment.status === 'CONFIRMED') {
      return next(new AppError('This appointment is already paid and confirmed.', 400));
    }

    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create or update Payment record
    const payment = await prisma.payment.upsert({
      where: { appointmentId: appointment.id },
      update: {
        paymentMethod,
        gatewayProvider: 'sslcommerz',
        gatewayReference: transactionId,
        status: 'PROCESSING',
      },
      create: {
        paymentNumber: `PAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        appointmentId: appointment.id,
        clientProfileId: appointment.clientProfileId,
        amount: appointment.totalAmount,
        platformFee: appointment.platformFee,
        lawyerAmount: appointment.consultationFee,
        currency: 'BDT',
        paymentMethod,
        gatewayProvider: 'sslcommerz',
        gatewayReference: transactionId,
        status: 'PROCESSING',
        initiatedAt: new Date(),
      },
    });

    // Simulated Gateway URL for SSLCommerz Sandbox / Direct Payment confirmation endpoint
    const gatewayUrl = `${config.frontendUrl}/payments/checkout?tran_id=${transactionId}&payment_id=${payment.id}`;

    res.status(200).json({
      status: 'success',
      paymentId: payment.id,
      transactionId,
      amount: appointment.totalAmount,
      currency: 'BDT',
      gatewayUrl,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify and Complete Payment (Backend Server Verification)
exports.verifyPayment = async (req, res, next) => {
  try {
    const { transactionId, status = 'SUCCESS' } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { gatewayReference: transactionId },
      include: {
        appointment: {
          include: {
            lawyerProfile: true,
            clientProfile: true,
          },
        },
      },
    });

    if (!payment) {
      return next(new AppError('Payment transaction not found.', 404));
    }

    if (payment.status === 'SUCCESSFUL') {
      return res.status(200).json({
        status: 'success',
        message: 'Payment was already verified and processed.',
        payment,
      });
    }

    if (status === 'SUCCESS') {
      const receiptNum = generateReceiptNumber();

      // Transactionally confirm appointment, complete payment, update lawyer earnings
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update Payment
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESSFUL',
            completedAt: new Date(),
            receiptNumber: receiptNum,
            ipnVerified: true,
          },
        });

        // 2. Update Appointment to CONFIRMED
        const updatedApt = await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: 'CONFIRMED',
          },
        });

        // 3. Create Consultation Room
        await tx.consultation.create({
          data: {
            appointmentId: payment.appointmentId,
            type: updatedApt.consultationType,
            roomId: `ROOM-${updatedApt.appointmentNumber}`,
            status: 'waiting',
          },
        });

        // 4. Update Lawyer Earnings
        await tx.lawyerProfile.update({
          where: { id: payment.appointment.lawyerProfileId },
          data: {
            totalEarnings: { increment: payment.lawyerAmount },
            totalConsultations: { increment: 1 },
          },
        });

        // 5. Create Credit Transaction Log
        await tx.transaction.create({
          data: {
            paymentId: payment.id,
            lawyerProfileId: payment.appointment.lawyerProfileId,
            type: 'credit',
            amount: payment.lawyerAmount,
            description: `Earnings from Appointment ${updatedApt.appointmentNumber}`,
          },
        });

        // 6. Send Notifications
        await tx.notification.create({
          data: {
            userId: payment.appointment.clientProfile.userId || payment.clientProfileId,
            type: 'PAYMENT_SUCCESSFUL',
            title: 'Payment Received & Booking Confirmed',
            message: `Your appointment (${updatedApt.appointmentNumber}) is confirmed. Receipt #${receiptNum}`,
            appointmentId: updatedApt.id,
          },
        });

        return { payment: updatedPayment, appointment: updatedApt };
      });

      return res.status(200).json({
        status: 'success',
        message: 'Payment successfully verified and appointment confirmed!',
        receiptNumber: receiptNum,
        data: result,
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return res.status(400).json({
        status: 'fail',
        message: 'Payment verification failed or was cancelled.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// 3. Download / View Receipt
exports.getReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: {
          include: {
            lawyerProfile: true,
            clientProfile: true,
          },
        },
      },
    });

    if (!payment || payment.status !== 'SUCCESSFUL') {
      return next(new AppError('Valid payment receipt not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        receiptNumber: payment.receiptNumber,
        date: payment.completedAt,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        appointmentNumber: payment.appointment.appointmentNumber,
        consultationType: payment.appointment.consultationType,
        appointmentDate: payment.appointment.appointmentDate,
        startTime: payment.appointment.startTime,
        clientName: `${payment.appointment.clientProfile.firstName} ${payment.appointment.clientProfile.lastName}`,
        lawyerName: `${payment.appointment.lawyerProfile.firstName} ${payment.appointment.lawyerProfile.lastName}`,
        lawyerTitle: payment.appointment.lawyerProfile.professionalTitle,
      },
    });
  } catch (error) {
    next(error);
  }
};
