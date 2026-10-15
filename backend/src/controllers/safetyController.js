const { inMemoryStore } = require('../config/db');
const { calculateLocalPointRisk, calculateDistance } = require('../services/aiService');

const getHeatmapData = async (req, res) => {
  try {
    const { category, timeframe } = req.query;

    // Filter reports if category is specified
    let reports = inMemoryStore.safety_reports;
    if (category && category !== 'all') {
      reports = reports.filter(r => r.category === category);
    }

    // Build heatmap points with weight/intensity
    // Red/Orange: High risk reports & risk zones
    // Yellow: Moderate reports
    // Green: Safe places & police posts
    const heatPoints = [
      ...inMemoryStore.risk_zones.map(z => ({
        lat: z.latitude,
        lng: z.longitude,
        intensity: z.risk_score / 100, // 0.65 to 0.85
        type: 'risk_zone',
        name: z.name,
        radius: z.radius_meters,
        reason: z.reason
      })),
      ...reports.map(r => ({
        lat: r.latitude,
        lng: r.longitude,
        intensity: Math.min(1.0, r.severity * 0.2),
        type: 'incident',
        category: r.category,
        severity: r.severity,
        status: r.status,
        description: r.description
      }))
    ];

    res.json({
      success: true,
      data: {
        points: heatPoints,
        safe_places: inMemoryStore.safe_places,
        stats: {
          total_reports: reports.length,
          verified_reports: reports.filter(r => r.status === 'verified').length,
          active_risk_zones: inMemoryStore.risk_zones.length,
          verified_safe_havens: inMemoryStore.safe_places.length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch heatmap data', error: err.message });
  }
};

const getZoneSafety = async (req, res) => {
  try {
    const { lat, lng, time } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude required' });
    }

    const hour = time ? parseInt(time, 10) : new Date().getHours();
    const result = calculateLocalPointRisk(parseFloat(lat), parseFloat(lng), hour);

    res.json({
      success: true,
      zone_safety: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to evaluate zone', error: err.message });
  }
};

const getNearbySafePlaces = async (req, res) => {
  try {
    const { lat, lng, category, radius = 5000 } = req.query;

    let places = inMemoryStore.safe_places;
    if (category && category !== 'all') {
      places = places.filter(p => p.category === category);
    }

    if (lat && lng) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      places = places.map(p => ({
        ...p,
        distance_meters: Math.round(calculateDistance(uLat, uLng, p.latitude, p.longitude))
      })).filter(p => p.distance_meters <= parseInt(radius, 10))
        .sort((a, b) => a.distance_meters - b.distance_meters);
    }

    res.json({
      success: true,
      count: places.length,
      safe_places: places
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch safe places', error: err.message });
  }
};

const submitSafetyReport = async (req, res) => {
  try {
    const {
      category,
      description,
      latitude,
      longitude,
      severity = 3,
      is_anonymous = false,
      photo_url = null
    } = req.body;

    if (!category || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Category, description, latitude, and longitude are required'
      });
    }

    // Abuse prevention: Check if duplicate report submitted within 50 meters in last 10 minutes
    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    const isDuplicate = inMemoryStore.safety_reports.some(r => {
      const dist = calculateDistance(latitude, longitude, r.latitude, r.longitude);
      const isRecent = new Date(r.created_at).getTime() > tenMinsAgo;
      return dist < 60 && r.category === category && isRecent;
    });

    if (isDuplicate) {
      return res.status(429).json({
        success: false,
        message: 'A similar incident was recently reported at this exact location. Upvoting existing report instead.'
      });
    }

    const newReport = {
      id: 'rep-' + Date.now(),
      user_id: is_anonymous || !req.user ? null : req.user.id,
      category,
      description: description.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      severity: parseInt(severity, 10),
      status: req.user && req.user.role === 'admin' ? 'verified' : 'pending',
      is_anonymous: Boolean(is_anonymous),
      photo_url,
      upvotes: 1,
      downvotes: 0,
      created_at: new Date().toISOString()
    };

    inMemoryStore.safety_reports.unshift(newReport);

    res.status(201).json({
      success: true,
      message: 'Safety report submitted successfully! Moderation team will review.',
      report: newReport
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit report', error: err.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { status, category } = req.query;
    let list = inMemoryStore.safety_reports;

    if (status) {
      list = list.filter(r => r.status === status);
    }
    if (category) {
      list = list.filter(r => r.category === category);
    }

    res.json({
      success: true,
      count: list.length,
      reports: list
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get reports', error: err.message });
  }
};

const verifyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, vote } = req.body; // status: 'verified' | 'rejected' or vote: 'up' | 'down'

    const report = inMemoryStore.safety_reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (status && req.user && ['moderator', 'admin'].includes(req.user.role)) {
      report.status = status;
      report.verified_by = req.user.id;
    }

    if (vote === 'up') report.upvotes += 1;
    if (vote === 'down') report.downvotes += 1;

    res.json({
      success: true,
      message: 'Report updated',
      report
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed', error: err.message });
  }
};

module.exports = {
  getHeatmapData,
  getZoneSafety,
  getNearbySafePlaces,
  submitSafetyReport,
  getReports,
  verifyReport
};
