const express = require('express');
const router = express.Router();
const {
  handleTriggerSOS,
  handleGetSOSStatus,
  handleShareTrip,
  handleEndTrip
} = require('../controllers/sosController');
const { optionalAuth } = require('../middleware/auth');

router.post('/trigger', optionalAuth, handleTriggerSOS);
router.get('/status/:tripId', handleGetSOSStatus);
router.post('/trips/share', optionalAuth, handleShareTrip);
router.post('/trips/end', optionalAuth, handleEndTrip);

module.exports = router;
