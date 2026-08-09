const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', notificationController.getNotifications);
router.patch('/read', notificationController.markAsRead);

module.exports = router;
