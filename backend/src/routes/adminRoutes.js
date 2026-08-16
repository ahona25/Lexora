const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/lawyers', adminController.getAllLawyers);
router.patch('/lawyers/:id/verification', adminController.updateLawyerVerification);
router.get('/appointments', adminController.getAllAppointments);
router.get('/payments', adminController.getAllPayments);
router.get('/reviews', adminController.getAllReviews);
router.patch('/reviews/:id/toggle', adminController.toggleReviewVisibility);
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);

module.exports = router;
