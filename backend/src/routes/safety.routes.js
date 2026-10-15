const express = require('express');
const router = express.Router();
const {
  getHeatmapData,
  getZoneSafety,
  getNearbySafePlaces,
  submitSafetyReport,
  getReports,
  verifyReport
} = require('../controllers/safetyController');
const { optionalAuth, authenticate, requireRole } = require('../middleware/auth');

router.get('/heatmap', getHeatmapData);
router.get('/zone', getZoneSafety);
router.get('/nearby-safe-places', getNearbySafePlaces);
router.post('/report', optionalAuth, submitSafetyReport);
router.get('/reports', getReports);
router.post('/verify-report/:id', optionalAuth, verifyReport);

module.exports = router;
