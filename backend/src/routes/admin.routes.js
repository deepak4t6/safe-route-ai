const express = require('express');
const router = express.Router();
const {
  getAdminReports,
  updateReportStatus,
  getAdminAnalytics
} = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/reports', authenticate, requireRole('moderator', 'admin'), getAdminReports);
router.patch('/reports/:id', authenticate, requireRole('moderator', 'admin'), updateReportStatus);
router.get('/analytics', authenticate, requireRole('moderator', 'admin'), getAdminAnalytics);

module.exports = router;
