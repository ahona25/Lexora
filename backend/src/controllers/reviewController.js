const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

exports.createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, reviewText } = req.body;
    const user = req.user;

    if (!user.clientProfile) {
      return next(new AppError('Only clients can submit lawyer reviews.', 403));
    }

    if (!appointmentId || !rating) {
      return next(new AppError('Please provide appointmentId and rating (1-5).', 400));
    }

    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return next(new AppError('Rating must be between 1 and 5 stars.', 400));
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    if (appointment.clientProfileId !== user.clientProfile.id) {
      return next(new AppError('You can only review appointments you booked.', 403));
    }

    if (appointment.status !== 'COMPLETED') {
      return next(new AppError('You can only submit a review after the consultation is completed.', 400));
    }

    // Check if review already exists for this appointment
    const existingReview = await prisma.review.findUnique({
      where: { appointmentId },
    });

    if (existingReview) {
      return next(new AppError('You have already submitted a review for this consultation.', 409));
    }

    // Create review and update lawyer average rating in transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          appointmentId,
          clientProfileId: user.clientProfile.id,
          lawyerProfileId: appointment.lawyerProfileId,
          rating: ratingNum,
          reviewText: reviewText || null,
        },
      });

      // Recalculate lawyer rating average
      const agg = await tx.review.aggregate({
        where: {
          lawyerProfileId: appointment.lawyerProfileId,
          isVisible: true,
        },
        _avg: { rating: true },
        _count: { id: true },
      });

      await tx.lawyerProfile.update({
        where: { id: appointment.lawyerProfileId },
        data: {
          averageRating: agg._avg.rating || 0,
          totalReviews: agg._count.id || 0,
        },
      });

      return newReview;
    });

    res.status(201).json({
      status: 'success',
      message: 'Thank you for your feedback! Your review has been published.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
