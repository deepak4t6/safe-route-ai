const { inMemoryStore, query, usePostgres } = require('../config/db');
const { calculateDistance } = require('./aiService');

const triggerSOS = async ({
  userId,
  tripId = null,
  latitude,
  longitude,
  batteryPercentage = 85
}) => {
  // 1. Fetch nearest police station & hospital
  const allSafePlaces = inMemoryStore.safe_places;
  const policeStations = allSafePlaces
    .filter(p => p.category === 'police_station')
    .map(p => ({
      ...p,
      distance_meters: Math.round(calculateDistance(latitude, longitude, p.latitude, p.longitude))
    }))
    .sort((a, b) => a.distance_meters - b.distance_meters);

  const hospitals = allSafePlaces
    .filter(p => p.category === 'hospital')
    .map(p => ({
      ...p,
      distance_meters: Math.round(calculateDistance(latitude, longitude, p.latitude, p.longitude))
    }))
    .sort((a, b) => a.distance_meters - b.distance_meters);

  const nearestPolice = policeStations[0] || null;
  const nearestHospital = hospitals[0] || null;

  // 2. Fetch emergency contacts
  let contacts = [];
  if (userId) {
    contacts = inMemoryStore.emergency_contacts.filter(c => c.user_id === userId);
  } else {
    contacts = inMemoryStore.emergency_contacts.slice(0, 2);
  }

  // 3. Generate live tracking token
  const shareToken = 'sos-' + Math.random().toString(36).substring(2, 12);
  const liveTrackingUrl = `https://saferoute.ai/track/${shareToken}`;

  const sosEntry = {
    id: 'sos-' + Date.now(),
    trip_id: tripId,
    user_id: userId,
    latitude,
    longitude,
    battery_percentage: batteryPercentage,
    status: 'triggered',
    share_token: shareToken,
    live_tracking_url: liveTrackingUrl,
    nearest_police: nearestPolice,
    nearest_hospital: nearestHospital,
    notified_contacts: contacts.map(c => ({
      name: c.name,
      phone: c.phone,
      relationship: c.relationship,
      status: 'Emergency alert generated: "EMERGENCY: User triggered SOS at Safe Route AI. Live location: ' + liveTrackingUrl + '" [Logged to audit trail. Live cellular SMS transmission simulated in Demo Mode]'
    })),
    created_at: new Date().toISOString()
  };

  inMemoryStore.sos_logs.push(sosEntry);

  return sosEntry;
};

const getSOSStatus = async (sosId) => {
  const log = inMemoryStore.sos_logs.find(s => s.id === sosId || s.share_token === sosId);
  return log || null;
};

const resolveSOS = async (sosId, reason = 'user_resolved') => {
  const log = inMemoryStore.sos_logs.find(s => s.id === sosId || s.share_token === sosId);
  if (log) {
    log.status = 'resolved';
    log.resolved_at = new Date().toISOString();
    log.resolution_reason = reason;
  }
  return log;
};

module.exports = {
  triggerSOS,
  getSOSStatus,
  resolveSOS
};
