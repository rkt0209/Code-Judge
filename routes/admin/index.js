const express = require('express');
const router = express.Router({ mergeParams: true });

router.use('/auth', require('./auth'));
router.use('/profile', require('./profile'));
router.use('/question', require('./question'));
router.use('/contest', require('./contest'));

module.exports = router;
