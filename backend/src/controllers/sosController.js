const { triggerSOS, getSOSStatus, resolveSOS } = require('../services/sosService');
const { inMemoryStore } = require('../config/db');

const handleTriggerSOS = async (req, res) => {
  try {
    const { latitude, longitude, batteryPercentage = 80, tripId = null } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Current latitude and longitude required to trigger SOS'
      });
    }

    const userId = req.user ? req.user.id : null;
    const sosResult = await triggerSOS({
      userId,
      tripId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      batteryPercentage: parseInt(batteryPercentage, 10)
    });

    res.status(201).json({
      success: true,
      message: '🚨 EMERGENCY SOS ACTIVATED: Emergency contacts notified and nearest authorities located.',
      sos: sosResult
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger SOS',
      error: err.message
    });
  }
};

const handleGetSOSStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const sosLog = await getSOSStatus(tripId);

    if (!sosLog) {
      return res.status(404).json({ success: false, message: 'SOS session or trip not found' });
    }

    res.json({
      success: true,
      sos: sosLog
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error checking SOS status', error: err.message });
  }
};

const handleShareTrip = async (req, res) => {
  try {
    const { sourceName, destName, currentLat, currentLng, routeType = 'safest' } = req.body;

    const token = 'track-' + Math.random().toString(36).substring(2, 10);
    const trip = {
      id: 'trip-' + Date.now(),
      user_id: req.user ? req.user.id : null,
      source_name: sourceName || 'Current Location',
      dest_name: destName || 'Destination',
      current_lat: currentLat,
      current_lng: currentLng,
      route_type: routeType,
      share_token: token,
      share_url: `https://saferoute.ai/track/${token}`,
      status: 'active',
      started_at: new Date().toISOString()
    };

    inMemoryStore.trips.push(trip);

    res.json({
      success: true,
      message: 'Live trip share link generated',
      trip
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not share trip', error: err.message });
  }
};

const handleEndTrip = async (req, res) => {
  try {
    const { tripId, sosId } = req.body;
    if (sosId) {
      await resolveSOS(sosId, 'user_resolved');
    }

    const trip = inMemoryStore.trips.find(t => t.id === tripId || t.share_token === tripId);
    if (trip) {
      trip.status = 'completed';
      trip.ended_at = new Date().toISOString();
    }

    res.json({
      success: true,
      message: 'Trip completed safely. Thank you for using Safe Route AI.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to end trip', error: err.message });
  }
};

module.exports = {
  handleTriggerSOS,
  handleGetSOSStatus,
  handleShareTrip,
  handleEndTrip
};
