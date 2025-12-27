const express = require('express');
const router = express.Router();

// Import Routes
const userAuthRoutes = require('./user/auth');
const adminAuthRoutes = require('./admin/auth');
const adminQuestionRoutes = require('./admin/question');
const userQuestionRoutes = require('./user/question'); // New!

// Mount Routes
router.use('/user/auth', userAuthRoutes);
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/question', adminQuestionRoutes);
router.use('/user/question', userQuestionRoutes); // New!

module.exports = router;