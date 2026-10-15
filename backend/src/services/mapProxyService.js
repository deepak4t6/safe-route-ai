const axios = require('axios');

// In-memory cache for geocoding and routing to avoid redundant API calls & respect rate limits
const cache = {
  autocomplete: new Map(),
  geocode: new Map(),
  directions: new Map()
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached(cacheMap, key) {
  const item = cacheMap.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cacheMap.delete(key);
    return null;
  }
  return item.data;
}

function setCache(cacheMap, key, data) {
  // Limit map size to prevent memory bloat
  if (cacheMap.size > 200) {
    const firstKey = cacheMap.keys().next().value;
    cacheMap.delete(firstKey);
  }
  cacheMap.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

const getMapboxToken = () => {
  return process.env.MAPBOX_ACCESS_TOKEN || '';
};

/**
 * Autocomplete search for places (streets, landmarks, pincodes, cities)
 * Supports India-specific bias and debouncing cache.
 */
const searchPlaces = async (queryText, userLng, userLat) => {
  const q = (queryText || '').trim();
  if (!q || q.length < 2) return [];

  const cacheKey = `${q.toLowerCase()}_${userLng || ''}_${userLat || ''}`;
  const cached = getCached(cache.autocomplete, cacheKey);
  if (cached) return cached;

  const token = getMapboxToken();

  // Try Mapbox Geocoding API if token is configured
  if (token && token.startsWith('pk.')) {
    try {
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&country=IN&autocomplete=true&limit=6&types=poi,address,place,locality,neighborhood,postcode`;
      if (userLng && userLat) {
        url += `&proximity=${userLng},${userLat}`;
      }

      const res = await axios.get(url, { timeout: 4000 });
      if (res.data && res.data.features) {
        const suggestions = res.data.features.map(f => ({
          id: f.id,
          place_name: f.place_name,
          text: f.text,
          coordinates: f.center, // [lng, lat]
          longitude: f.center[0],
          latitude: f.center[1],
          address: f.properties?.address || f.text,
          context: f.context?.map(c => c.text).join(', ') || ''
        }));

        setCache(cache.autocomplete, cacheKey, suggestions);
        return suggestions;
      }
    } catch (err) {
      console.warn('[Mapbox Geocoding Warning]', err.message, '- falling back to open geocoder');
    }
  }

  // Resilient OpenStreetMap Nominatim Fallback (No API key needed, India biased)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=6&addressdetails=1`;
    const res = await axios.get(nominatimUrl, {
      headers: { 'User-Agent': 'SafeRouteAI-Navigation/1.0' },
      timeout: 4000
    });

    const suggestions = (res.data || []).map(item => ({
      id: `osm-${item.place_id}`,
      place_name: item.display_name,
      text: item.name || item.display_name.split(',')[0],
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
      longitude: parseFloat(item.lon),
      latitude: parseFloat(item.lat),
      address: item.display_name,
      context: item.type || ''
    }));

    setCache(cache.autocomplete, cacheKey, suggestions);
    return suggestions;
  } catch (err) {
    console.error('[Geocoding Fallback Error]', err.message);
    return [];
  }
};

/**
 * Reverse geocode coordinates to human-readable address
 */
const reverseGeocode = async (lng, lat) => {
  const cacheKey = `${lng.toFixed(5)},${lat.toFixed(5)}`;
  const cached = getCached(cache.geocode, cacheKey);
  if (cached) return cached;

  const token = getMapboxToken();

  if (token && token.startsWith('pk.')) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`;
      const res = await axios.get(url, { timeout: 4000 });
      if (res.data?.features?.length > 0) {
        const feat = res.data.features[0];
        const result = {
          place_name: feat.place_name,
          text: feat.text,
          coordinates: feat.center,
          latitude: feat.center[1],
          longitude: feat.center[0]
        };
        setCache(cache.geocode, cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('[Mapbox Reverse Geocode Warning]', err.message);
    }
  }

  // Nominatim Reverse fallback
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { 'User-Agent': 'SafeRouteAI-Navigation/1.0' },
      timeout: 4000
    });
    if (res.data) {
      const result = {
        place_name: res.data.display_name,
        text: res.data.name || res.data.display_name.split(',')[0],
        coordinates: [parseFloat(res.data.lon), parseFloat(res.data.lat)],
        latitude: parseFloat(res.data.lat),
        longitude: parseFloat(res.data.lon)
      };
      setCache(cache.geocode, cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error('[Reverse Geocode Error]', err.message);
  }

  return {
    place_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    text: 'Current Location',
    coordinates: [lng, lat],
    latitude: lat,
    longitude: lng
  };
};

/**
 * Fetch real road directions from Mapbox Directions API
 * (with OSRM fallback for 100% resilience)
 */
const getRealDirections = async ({
  sourceLng,
  sourceLat,
  destLng,
  destLat,
  travelMode = 'walking'
}) => {
  // Profiles mapping
  const mapboxProfile = travelMode === 'cycling'
    ? 'mapbox/cycling'
    : (travelMode === 'driving' ? 'mapbox/driving' : 'mapbox/walking');

  const osrmProfile = travelMode === 'cycling'
    ? 'bicycle'
    : (travelMode === 'driving' ? 'car' : 'foot');

  const cacheKey = `${mapboxProfile}_${sourceLng.toFixed(5)},${sourceLat.toFixed(5)};${destLng.toFixed(5)},${destLat.toFixed(5)}`;
  const cached = getCached(cache.directions, cacheKey);
  if (cached) return cached;

  const token = getMapboxToken();

  // 1. Try Mapbox Directions API
  if (token && token.startsWith('pk.')) {
    try {
      const url = `https://api.mapbox.com/directions/v5/${mapboxProfile}/${sourceLng},${sourceLat};${destLng},${destLat}?steps=true&geometries=geojson&overview=full&alternatives=true&voice_instructions=true&banner_instructions=true&access_token=${token}`;
      const res = await axios.get(url, { timeout: 6000 });

      if (res.data && res.data.routes && res.data.routes.length > 0) {
        const parsedRoutes = res.data.routes.map((r, idx) => parseMapboxRoute(r, idx, travelMode));
        setCache(cache.directions, cacheKey, parsedRoutes);
        return parsedRoutes;
      }
    } catch (err) {
      console.warn('[Mapbox Directions Error]', err.response?.data?.message || err.message, '- falling back to OSRM');
    }
  }

  // 2. Open Source Routing Machine (OSRM) Fallback - Real road routing
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${sourceLng},${sourceLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    const res = await axios.get(osrmUrl, { timeout: 6000 });

    if (res.data && res.data.routes && res.data.routes.length > 0) {
      const parsedRoutes = res.data.routes.map((r, idx) => parseOSRMRoute(r, idx, travelMode));
      setCache(cache.directions, cacheKey, parsedRoutes);
      return parsedRoutes;
    }
  } catch (err) {
    console.error('[OSRM Directions Error]', err.message);
  }

  return [];
};

function parseMapboxRoute(route, index, mode) {
  const coords = route.geometry.coordinates; // [[lng, lat], ...]
  // Convert [lng, lat] to [lat, lng] for Leaflet / safety scorer compatibility, and keep geojson
  const latLngCoords = coords.map(c => [c[1], c[0]]);

  const steps = [];
  if (route.legs && route.legs.length > 0) {
    route.legs.forEach(leg => {
      leg.steps?.forEach((step, sIdx) => {
        steps.push({
          index: sIdx,
          instruction: step.maneuver?.instruction || cleanManeuverText(step.maneuver?.type, step.name),
          distance_meters: Math.round(step.distance),
          duration_seconds: Math.round(step.duration),
          name: step.name || 'Unnamed Road',
          location: [step.maneuver.location[1], step.maneuver.location[0]], // [lat, lng]
          type: step.maneuver?.type || 'turn',
          modifier: step.maneuver?.modifier || ''
        });
      });
    });
  }

  return {
    raw_index: index,
    distance_meters: Math.round(route.distance),
    duration_seconds: Math.round(route.duration),
    geojson_geometry: route.geometry, // standard GeoJSON LineString: { type: 'LineString', coordinates: [[lng, lat], ...] }
    lat_lng_geometry: latLngCoords,   // [[lat, lng], ...]
    steps: steps.length > 0 ? steps : createDefaultSteps(latLngCoords, route.distance)
  };
}

function parseOSRMRoute(route, index, mode) {
  const coords = route.geometry.coordinates; // [[lng, lat], ...]
  const latLngCoords = coords.map(c => [c[1], c[0]]);

  const steps = [];
  if (route.legs && route.legs.length > 0) {
    route.legs.forEach(leg => {
      leg.steps?.forEach((step, sIdx) => {
        steps.push({
          index: sIdx,
          instruction: cleanManeuverText(step.maneuver?.type, step.name, step.maneuver?.modifier),
          distance_meters: Math.round(step.distance),
          duration_seconds: Math.round(step.duration),
          name: step.name || 'Street',
          location: [step.maneuver.location[1], step.maneuver.location[0]],
          type: step.maneuver?.type || 'turn',
          modifier: step.maneuver?.modifier || ''
        });
      });
    });
  }

  const dist = Math.round(route.distance);
  let realisticDuration = Math.round(route.duration);

  // OSRM demo router only runs car profile; compute realistic travel speeds per mode
  if (mode === 'walking') {
    // Pedestrian pace: ~1.35 m/s (4.8 km/h)
    realisticDuration = Math.max(60, Math.round(dist / 1.35));
  } else if (mode === 'cycling') {
    // Urban cycling pace: ~4.0 m/s (14.4 km/h)
    realisticDuration = Math.max(60, Math.round(dist / 4.0));
  } else if (mode === 'driving') {
    // Urban driving with signals: ~7.8 m/s (28 km/h)
    realisticDuration = Math.max(60, Math.round(dist / 7.8));
  }

  // Scale step durations proportionally
  const timeScale = route.duration > 0 ? (realisticDuration / route.duration) : 1;
  const scaledSteps = steps.map(s => ({
    ...s,
    duration_seconds: Math.round(s.duration_seconds * timeScale)
  }));

  return {
    raw_index: index,
    distance_meters: dist,
    duration_seconds: realisticDuration,
    geojson_geometry: route.geometry,
    lat_lng_geometry: latLngCoords,
    steps: scaledSteps.length > 0 ? scaledSteps : createDefaultSteps(latLngCoords, dist)
  };
}

function cleanManeuverText(type, streetName, modifier) {
  const street = streetName ? `onto ${streetName}` : '';
  switch (type) {
    case 'depart':
      return `Head towards your destination ${street}`.trim();
    case 'arrive':
      return 'You have arrived safely at your destination';
    case 'turn':
      return `Turn ${modifier || 'safely'} ${street}`.trim();
    case 'roundabout':
      return `Take roundabout exit ${street}`.trim();
    case 'continue':
    case 'new name':
      return `Continue straight ${street}`.trim();
    default:
      return `${type ? capitalize(type) : 'Proceed'} ${modifier || ''} ${street}`.trim();
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function createDefaultSteps(waypoints, dist) {
  return [
    { instruction: 'Start on well-lit road heading towards destination', distance_meters: Math.round(dist * 0.2) },
    { instruction: 'Continue along main pedestrian corridor', distance_meters: Math.round(dist * 0.5) },
    { instruction: 'Arrive at destination', distance_meters: Math.round(dist * 0.3) }
  ];
}

module.exports = {
  searchPlaces,
  reverseGeocode,
  getRealDirections,
  getMapboxToken
};
