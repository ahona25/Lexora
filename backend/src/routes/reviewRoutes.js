const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, reviewController.createReview);

module.exports = router;
