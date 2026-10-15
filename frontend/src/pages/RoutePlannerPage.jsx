import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRightLeft,
  Clock,
  Shield,
  Zap,
  Sliders,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Navigation,
  Loader2
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { routeAPI, mapsAPI, safetyAPI } from '../services/api';
import MapView from '../components/MapView';
import LocationSearchInput from '../components/LocationSearchInput';
import SafetyScoreCard from '../components/SafetyScoreCard';
import RouteComparisonCard from '../components/RouteComparisonCard';

const POPULAR_PRESETS = [
  {
    name: 'Connaught Place to India Gate',
    from: { name: 'Connaught Place Central, New Delhi', latitude: 28.6328, longitude: 77.2195 },
    to: { name: 'India Gate, Rajpath, New Delhi', latitude: 28.6129, longitude: 77.2295 }
  },
  {
    name: 'Rajiv Chowk to Mandi House',
    from: { name: 'Rajiv Chowk Metro Gate 2', latitude: 28.6360, longitude: 77.2155 },
    to: { name: 'Mandi House Cultural Center', latitude: 28.6255, longitude: 77.2345 }
  },
  {
    name: 'Cyber Hub to Ambience Mall, Gurgaon',
    from: { name: 'Cyber Hub, DLF Phase 2, Gurgaon', latitude: 28.4950, longitude: 77.0895 },
    to: { name: 'Ambience Mall, NH 8, Gurgaon', latitude: 28.5045, longitude: 77.0970 }
  }
];

const RoutePlannerPage = () => {
  const navigate = useNavigate();
  const {
    currentLocation,
    setCurrentLocation,
    destination,
    setDestination,
    travelMode,
    setTravelMode,
    selectedRoute,
    setSelectedRoute,
    allRoutes,
    setAllRoutes
  } = useTrip();

  const [fromState, setFromState] = useState({
    name: currentLocation.name || 'Connaught Place Central, New Delhi',
    latitude: currentLocation.lat || currentLocation.latitude || 28.6328,
    longitude: currentLocation.lng || currentLocation.longitude || 77.2195
  });

  const [toState, setToState] = useState({
    name: destination.name || 'India Gate, Rajpath, New Delhi',
    latitude: destination.lat || destination.latitude || 28.6129,
    longitude: destination.lng || destination.longitude || 77.2295
  });

  const [departureTime, setDepartureTime] = useState('now');
  const [departureHour, setDepartureHour] = useState(21); // 9 PM default
  const [safetyPriority, setSafetyPriority] = useState(80); // 0 to 100
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch Safe Routes using real road geometries
  const fetchSafeRoutes = async (source = fromState, dest = toState) => {
    setErrorMessage(null);

    // Validate inputs
    if (!source.latitude || !source.longitude || !dest.latitude || !dest.longitude) {
      setErrorMessage('Please select valid origin and destination locations from the search autocomplete.');
      return;
    }

    // Check same origin and destination
    const dist = Math.abs(source.latitude - dest.latitude) + Math.abs(source.longitude - dest.longitude);
    if (dist < 0.0001) {
      setErrorMessage('Origin and destination cannot be the same place. Please choose distinct locations.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        sourceLat: source.latitude,
        sourceLng: source.longitude,
        destLat: dest.latitude,
        destLng: dest.longitude,
        sourceName: source.name,
        destName: dest.name,
        travelMode,
        departureHour: departureTime === 'now' ? new Date().getHours() : parseInt(departureHour, 10),
        safetyPriority
      };

      const res = await routeAPI.getSafeRoutes(payload);
      if (res.data?.success && res.data.data.routes?.length > 0) {
        const fetchedRoutes = res.data.data.routes;
        setAllRoutes(fetchedRoutes);

        // Auto-select safest or keep current type
        const safest = fetchedRoutes.find(r => r.type === 'safest') || fetchedRoutes[0];
        setSelectedRoute(safest);

        // Sync TripContext
        setCurrentLocation({
          lat: source.latitude,
          lng: source.longitude,
          latitude: source.latitude,
          longitude: source.longitude,
          name: source.name
        });
        setDestination({
          lat: dest.latitude,
          lng: dest.longitude,
          latitude: dest.latitude,
          longitude: dest.longitude,
          name: dest.name
        });
      } else {
        setErrorMessage('No valid road route found between these locations. Try adjusting search points.');
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to compute routes. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount or when travel mode changes
  useEffect(() => {
    fetchSafeRoutes();
  }, [travelMode]);

  // "Use My Current Location" GPS Handler
  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          // Reverse geocode to get real street name
          const res = await mapsAPI.geocode({ lat, lng });
          const placeName = res.data?.place?.place_name || `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          const newOrigin = {
            name: placeName,
            latitude: lat,
            longitude: lng
          };

          setFromState(newOrigin);
          setCurrentLocation({ ...newOrigin, lat, lng });
          fetchSafeRoutes(newOrigin, toState);
        } catch (e) {
          const fallback = {
            name: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            latitude: lat,
            longitude: lng
          };
          setFromState(fallback);
          fetchSafeRoutes(fallback, toState);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMessage('Location permission denied. Please allow location access in your browser settings or type your location manually.');
        } else {
          setErrorMessage('Could not retrieve your GPS location. Please type your location manually.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Swap Origin and Destination
  const handleSwap = () => {
    const tempFrom = { ...fromState };
    const tempTo = { ...toState };

    setFromState(tempTo);
    setToState(tempFrom);
    fetchSafeRoutes(tempTo, tempFrom);
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset) => {
    setFromState(preset.from);
    setToState(preset.to);
    fetchSafeRoutes(preset.from, preset.to);
  };

  const handleStartNavigation = (routeToNav) => {
    setSelectedRoute(routeToNav || selectedRoute);
    navigate('/navigate');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-emerald-500" />
            Safe Route Navigation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real road navigation with Mapbox routing, municipal lighting analysis, and risk scoring
          </p>
        </div>

        {/* Priority Slider */}
        <div className="p-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <Sliders className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Priority: </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {safetyPriority >= 70 ? 'Maximum Safety' : (safetyPriority >= 40 ? 'Balanced' : 'Maximum Speed')}
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={safetyPriority}
            onChange={(e) => setSafetyPriority(parseInt(e.target.value, 10))}
            className="w-20 accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Search & Planner Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">

          {/* Origin Search */}
          <div className="lg:col-span-5">
            <LocationSearchInput
              label="Starting Location (Origin)"
              placeholder="Type origin (e.g. Connaught Place, Delhi)..."
              value={fromState.name}
              iconColor="text-blue-500"
              showCurrentLocationBtn={true}
              onUseCurrentLocation={handleUseCurrentLocation}
              onSelectPlace={(place) => {
                const updated = {
                  name: place.place_name,
                  latitude: place.latitude,
                  longitude: place.longitude
                };
                setFromState(updated);
              }}
            />
          </div>

          {/* Swap Button */}
          <div className="lg:col-span-1 flex justify-center pb-1">
            <button
              onClick={handleSwap}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shadow-sm"
              title="Swap origin and destination"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Search */}
          <div className="lg:col-span-4">
            <LocationSearchInput
              label="Destination"
              placeholder="Type destination (e.g. India Gate, Delhi)..."
              value={toState.name}
              iconColor="text-emerald-500"
              onSelectPlace={(place) => {
                const updated = {
                  name: place.place_name,
                  latitude: place.latitude,
                  longitude: place.longitude
                };
                setToState(updated);
              }}
            />
          </div>

          {/* Find Safe Route CTA */}
          <div className="lg:col-span-2 pb-1">
            <button
              onClick={() => fetchSafeRoutes()}
              disabled={isLoading || isLocating}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Routing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Find Routes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error / Alert Notice */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Filters Row: Travel Mode Tabs + Presets */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">

          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {[
              { id: 'walking', label: '🚶 Walk', desc: 'mapbox/walking' },
              { id: 'cycling', label: '🚲 Cycle', desc: 'mapbox/cycling' },
              { id: 'driving', label: '🚗 Drive', desc: 'mapbox/driving' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setTravelMode(m.id)}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                  travelMode === m.id
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Departure Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Departure:</span>
            <select
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
            >
              <option value="now">Depart Now ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</option>
              <option value="later">Late Night (10:30 PM - High Risk Assessment)</option>
              <option value="day">Daytime (02:00 PM)</option>
            </select>
          </div>

          {/* Quick Popular Indian Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            <span className="text-slate-400 text-[11px]">Popular:</span>
            {POPULAR_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition text-[11px]"
              >
                {preset.name.split(' to ')[0]} → {preset.name.split(' to ')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Real Navigation Display: Mapbox Map (Left) + Route Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Mapbox Map Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Safest
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-amber-500">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Balanced
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-red-500">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Fastest
              </span>
            </div>
            <span>🗺️ Real Road Routing (Mapbox GL)</span>
          </div>

          <MapView
            center={[fromState.longitude, fromState.latitude]}
            zoom={14}
            routes={allRoutes}
            selectedRouteId={selectedRoute?.id}
            onSelectRoute={(r) => setSelectedRoute(r)}
            sourceLocation={fromState}
            destinationLocation={toState}
            height="520px"
          />

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Actual road trajectories loaded from Directions API. Tap any alternate route line on the map to inspect its safety score.</span>
          </div>
        </div>

        {/* Route Results & Inspection Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Comparison Cards for the 3 routes */}
          <RouteComparisonCard
            routes={allRoutes}
            selectedRouteId={selectedRoute?.id}
            onSelectRoute={(r) => setSelectedRoute(r)}
            onStartNavigation={handleStartNavigation}
          />

          {/* Safety Score Breakdown for active selection */}
          {selectedRoute && (
            <SafetyScoreCard
              score={selectedRoute.safety_score}
              riskLevel={selectedRoute.risk_level}
              confidence={0.92}
              confidenceLabel="High data density (Delhi NCR Corridor)"
              explanations={selectedRoute.explanation?.highlights}
              routeType={selectedRoute.type}
            />
          )}
        </div>

      </div>

    </div>
  );
};

export default RoutePlannerPage;
