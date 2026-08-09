const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register/client', authController.registerClient);
router.post('/register/lawyer', authController.registerLawyer);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
