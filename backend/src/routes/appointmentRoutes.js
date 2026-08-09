const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.patch('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;
