const router = require('express').Router();

router.use('/users', require('./users'));
router.use('/artists', require('./artists'));
router.use('/songs', require('./songs'));
router.use('/playlists', require('./playlists'));

module.exports = router;