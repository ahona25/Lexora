const express = require('express');
const lawyerController = require('../controllers/lawyerController');

const router = express.Router();

router.get('/', lawyerController.getLawyers);
router.get('/:id', lawyerController.getLawyerById);
router.get('/:id/slots', lawyerController.getLawyerAvailableSlots);

module.exports = router;
