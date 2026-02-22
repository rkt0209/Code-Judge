const express = require('express');
const router = express.Router({ mergeParams: true });

router.use('/auth', require('./auth'));
router.use('/profile', require('./profile'));
router.use('/submission', require('./submission'));
router.use('/questions', require('./questions'));

module.exports = router;
