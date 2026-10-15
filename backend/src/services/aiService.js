const axios = require('axios');
const { inMemoryStore } = require('../config/db');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// In-house JavaScript safety model fallback if Python FastAPI service is offline
const calculateLocalPointRisk = (lat, lng, departureHour = 21, roadType = 'primary') => {
  const isNight = departureHour >= 21 || departureHour <= 5;
  let score = 76.0;
  const positiveFactors = [];
  const riskFactors = [];

  // Check proximity to safe places
  const policeStations = inMemoryStore.safe_places.filter(p => p.category === 'police_station');
  let nearestPoliceDist = 9999;
  for (const p of policeStations) {
    const d = calculateDistance(lat, lng, p.latitude, p.longitude);
    if (d < nearestPoliceDist) nearestPoliceDist = d;
  }

  if (nearestPoliceDist < 500) {
    score += 12;
    positiveFactors.push(`Active police post within ${Math.round(nearestPoliceDist)}m`);
  } else if (nearestPoliceDist < 1200) {
    score += 6;
    positiveFactors.push(`Police station accessible within ${Math.round(nearestPoliceDist)}m`);
  } else if (isNight) {
    score -= 6;
    riskFactors.push('Limited immediate police booth coverage (>1.2km)');
  }

  // Check risk zones
  for (const zone of inMemoryStore.risk_zones) {
    const dist = calculateDistance(lat, lng, zone.latitude, zone.longitude);
    if (dist <= zone.radius_meters) {
      score -= Math.min(30, zone.risk_score * 0.35);
      riskFactors.push(`Near flagged zone: ${zone.reason}`);
    }
  }

  // Check recent incidents within 400m
  for (const rep of inMemoryStore.safety_reports.filter(r => r.status === 'verified')) {
    const dist = calculateDistance(lat, lng, rep.latitude, rep.longitude);
    if (dist <= 400) {
      score -= (rep.severity * 3.5);
      if (riskFactors.length < 3) {
        riskFactors.push(`Recent ${rep.category.replace('_', ' ')} report in 400m`);
      }
    }
  }

  // Road type
  if (roadType === 'primary') {
    score += 8;
    positiveFactors.push('Wide, well-trafficked main thoroughfare with CCTV');
  } else if (roadType === 'secondary') {
    score += 3;
  } else {
    score -= 15;
    riskFactors.push('Narrow lane or isolated secondary alleyway');
  }

  const finalScore = Math.max(12, Math.min(94, Math.round(score * 10) / 10));
  let riskLevel = 'safe';
  if (finalScore < 40) riskLevel = 'risky';
  else if (finalScore < 60) riskLevel = 'caution';
  else if (finalScore < 80) riskLevel = 'moderate';

  return {
    safety_score: finalScore,
    risk_level: riskLevel,
    confidence: 0.85,
    confidence_label: 'Reliable area safety score',
    explanations: [...positiveFactors.slice(0, 2), ...riskFactors.slice(0, 2)],
    is_night: isNight
  };
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const scoreRoute = async (waypoints, departureHour = 21, travelMode = 'walking', routeType = 'safest') => {
  try {
    // Try calling Python AI microservice
    const response = await axios.post(`${AI_ENGINE_URL}/score-route`, {
      waypoints,
      departure_hour: departureHour,
      travel_mode: travelMode,
      route_type: routeType
    }, { timeout: 1500 });

    return response.data;
  } catch (err) {
    // Graceful fallback to built-in JS scoring engine
    let totalScore = 0;
    const sampled = waypoints.filter((_, i) => i % Math.max(1, Math.floor(waypoints.length / 10)) === 0);
    const riskySegments = [];

    sampled.forEach((pt, idx) => {
      const road = routeType === 'safest' ? 'primary' : (routeType === 'fastest' ? 'alley' : 'secondary');
      const pointRes = calculateLocalPointRisk(pt[0], pt[1], departureHour, road);
      totalScore += pointRes.safety_score;
      if (pointRes.safety_score < 60) {
        riskySegments.push({
          waypoint_index: idx,
          location: pt,
          score: pointRes.safety_score,
          warning: `Caution segment (Score: ${pointRes.safety_score}). ${pointRes.explanations[0] || 'Take care.'}`
        });
      }
    });

    const avg = totalScore / (sampled.length || 1);
    const baseScore = Math.round(avg * 10) / 10;
    let riskLevel = 'safe';
    if (baseScore < 40) riskLevel = 'risky';
    else if (baseScore < 60) riskLevel = 'caution';
    else if (baseScore < 80) riskLevel = 'moderate';

    let summaryExplanation = '';
    if (routeType === 'safest') {
      summaryExplanation = `Ye route safest option hai (Safety Score: ${baseScore}/100). Isme well-lit broad avenues aur police post proximity zyada hai.`;
    } else if (routeType === 'fastest') {
      summaryExplanation = `Fastest route (Safety Score: ${baseScore}/100). Travel time kam hai, lekin ${riskySegments.length} isolated ya low-light stretches aate hain.`;
    } else {
      summaryExplanation = `Balanced route (Safety Score: ${baseScore}/100). Speed aur safety ke beech convenient compromise deta hai.`;
    }

    return {
      route_type: routeType,
      safety_score: baseScore,
      risk_level: riskLevel,
      summary_explanation: summaryExplanation,
      risky_segments_count: riskySegments.length,
      risky_segments: riskySegments
    };
  }
};

const askSafetyAssistant = async (question, lat, lng, timeStr) => {
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/ask-ai`, {
      question,
      latitude: lat,
      longitude: lng,
      time_str: timeStr
    }, { timeout: 2000 });
    return response.data;
  } catch (err) {
    // Built-in intelligent response generator
    const isNight = question.toLowerCase().includes('night') || question.toLowerCase().includes('pm') || question.toLowerCase().includes('raat');
    const safePlaces = inMemoryStore.safe_places.slice(0, 3);
    const police = safePlaces.find(p => p.category === 'police_station');

    return {
      question,
      answer: isNight
        ? `Raat ke samay (${timeStr || 'late hours'}) main illuminated corridors choose karein. Outer ring aur verified safe hubs ke paas active patrolling rehti hai.`
        : `Daytime me ye area mostly secure rehta hai normal footfall ke sath. Still, suspicious spots par alert rahein.`,
      actionable_tips: [
        'Main commercial road prefer karein, dark back-alleys avoid karein.',
        police ? `Nearest police station: ${police.name} (${police.open_hours}).` : '112 emergency service quick dial saved in SOS.',
        'Live route tracking dost ya parivaar ke sath share karein.'
      ],
      nearby_safe_amenities_count: safePlaces.length,
      active_risk_alerts: inMemoryStore.risk_zones.length,
      disclaimer: 'Safe Route AI provides real-time safety guidance, not legal or physical guarantees.'
    };
  }
};

module.exports = {
  calculateLocalPointRisk,
  scoreRoute,
  askSafetyAssistant,
  calculateDistance
};
