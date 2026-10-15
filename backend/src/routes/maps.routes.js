const express = require('express');
const router = express.Router();
const { searchPlaces, reverseGeocode, getRealDirections, getMapboxToken } = require('../services/mapProxyService');

/**
 * Autocomplete place search with debouncing & India-specific priority
 * GET /api/maps/autocomplete?q=Connaught+Place&lng=77.2195&lat=28.6328
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, lng, lat } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const suggestions = await searchPlaces(
      q,
      lng ? parseFloat(lng) : undefined,
      lat ? parseFloat(lat) : undefined
    );

    res.json({
      success: true,
      query: q,
      count: suggestions.length,
      suggestions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Autocomplete failed', error: err.message });
  }
});

/**
 * Reverse or forward geocode
 * GET /api/maps/geocode?lat=28.6328&lng=77.2195
 * OR GET /api/maps/geocode?q=India+Gate+Delhi
 */
router.get('/geocode', async (req, res) => {
  try {
    const { lat, lng, q } = req.query;

    if (lat && lng) {
      const place = await reverseGeocode(parseFloat(lng), parseFloat(lat));
      return res.json({ success: true, place });
    }

    if (q) {
      const places = await searchPlaces(q);
      return res.json({ success: true, place: places[0] || null });
    }

    return res.status(400).json({ success: false, message: 'Provide either lat & lng OR q parameter' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Geocode failed', error: err.message });
  }
});

/**
 * Public Mapbox client config
 * GET /api/maps/config
 * Returns Mapbox access token if configured on backend so Mapbox GL JS can initialize vector tiles
 */
router.get('/config', (req, res) => {
  const token = getMapboxToken();
  res.json({
    success: true,
    has_mapbox_token: Boolean(token && token.startsWith('pk.')),
    mapbox_token: token || '',
    default_style: 'mapbox://styles/mapbox/dark-v11',
    light_style: 'mapbox://styles/mapbox/streets-v12'
  });
});

/**
 * Raw directions endpoint
 * POST /api/maps/directions
 */
router.post('/directions', async (req, res) => {
  try {
    const { sourceLng, sourceLat, destLng, destLat, travelMode = 'walking' } = req.body;

    if (!sourceLng || !sourceLat || !destLng || !destLat) {
      return res.status(400).json({ success: false, message: 'Source and destination coordinates required' });
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
      count: routes.length,
      routes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Directions lookup failed', error: err.message });
  }
});

module.exports = router;
