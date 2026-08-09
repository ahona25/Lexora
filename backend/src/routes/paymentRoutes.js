const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/initiate', authenticate, paymentController.initiatePayment);
router.post('/verify', paymentController.verifyPayment);
router.get('/receipt/:paymentId', authenticate, paymentController.getReceipt);

module.exports = router;
