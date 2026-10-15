const { generateRouteAlternatives } = require('../services/routingService');
const { inMemoryStore } = require('../config/db');

// Cache generated routes in memory for quick retrieval
const routeCache = new Map();

const calculateSafeRoutes = async (req, res) => {
  try {
    const {
      sourceLat,
      sourceLng,
      destLat,
      destLng,
      sourceName = 'Connaught Place Outer',
      destName = 'Barakhamba Road',
      travelMode = 'walking',
      departureHour = 21,
      safetyPriority = 75
    } = req.body;

    if (!sourceLat || !sourceLng || !destLat || !destLng) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination coordinates (latitude & longitude) are required'
      });
    }

    const sLat = parseFloat(sourceLat);
    const sLng = parseFloat(sourceLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    // Reject same location (within ~15 meters)
    const delta = Math.abs(sLat - dLat) + Math.abs(sLng - dLng);
    if (delta < 0.0001) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination cannot be the same location. Please choose distinct locations.'
      });
    }

    const routeData = await generateRouteAlternatives({
      sourceLat: parseFloat(sourceLat),
      sourceLng: parseFloat(sourceLng),
      destLat: parseFloat(destLat),
      destLng: parseFloat(destLng),
      sourceName,
      destName,
      travelMode,
      departureHour: parseInt(departureHour, 10),
      safetyPriority: parseInt(safetyPriority, 10)
    });

    // Cache the routes
    routeData.routes.forEach(r => {
      routeCache.set(r.id, r);
    });

    res.json({
      success: true,
      message: 'Generated 3 route alternatives with AI safety scoring',
      data: routeData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate safe routes',
      error: err.message
    });
  }
};

const getRouteById = async (req, res) => {
  try {
    const { routeId } = req.params;
    const route = routeCache.get(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found or expired'
      });
    }

    res.json({
      success: true,
      route
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: err.message
    });
  }
};

const getDirections = async (req, res) => {
  try {
    const { getRealDirections } = require('../services/mapProxyService');
    const { sourceLng, sourceLat, destLng, destLat, travelMode = 'walking' } = req.body;

    if (!sourceLng || !sourceLat || !destLng || !destLat) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination coordinates required'
      });
    }

    const routes = await getRealDirections({
      sourceLng: parseFloat(sourceLng),
      sourceLat: parseFloat(sourceLat),
      destLng: parseFloat(destLng),
      destLat: parseFloat(destLat),
      travelMode
    });

    res.json({
      success: true,
      routes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch directions',
      error: err.message
    });
  }
};

module.exports = {
  calculateSafeRoutes,
  getRouteById,
  getDirections
};
