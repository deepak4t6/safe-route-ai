const express = require('express');
const router = express.Router();
const { calculateSafeRoutes, getRouteById, getDirections } = require('../controllers/routeController');
const { optionalAuth } = require('../middleware/auth');

router.post('/safe-route', optionalAuth, calculateSafeRoutes);
router.post('/directions', optionalAuth, getDirections);
router.get('/:routeId', getRouteById);

module.exports = router;
