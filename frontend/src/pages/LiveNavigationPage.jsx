import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Share2,
  PhoneCall,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { sosAPI, routeAPI } from '../services/api';
import MapView from '../components/MapView';
import RiskZoneAlert from '../components/RiskZoneAlert';

const LiveNavigationPage = () => {
  const navigate = useNavigate();
  const {
    selectedRoute,
    setSelectedRoute,
    currentLocation,
    destination,
    triggerSOS,
    travelMode
  } = useTrip();

  // Route Coordinates: GeoJSON coordinates are [[lng, lat], ...]
  const roadCoordinates = selectedRoute?.coordinates || [
    [77.2195, 28.6328],
    [77.2215, 28.6300],
    [77.2240, 28.6250],
    [77.2270, 28.6180],
    [77.2295, 28.6129]
  ];

  const steps = selectedRoute?.steps || [
    { instruction: 'Head towards destination along main avenue', distance_meters: 150, safety_tag: 'Well-lit primary road' },
    { instruction: 'Turn right onto Barakhamba Road', distance_meters: 420, safety_tag: 'Continuous CCTV surveillance' },
    { instruction: 'Continue straight passing Metro Station Helpdesk', distance_meters: 500, safety_tag: 'Verified Safe Haven nearby' },
    { instruction: 'Arrive safely at destination', distance_meters: 180, safety_tag: 'Destination entrance' }
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coordIndex, setCoordIndex] = useState(0);
  const [userCoord, setUserCoord] = useState({
    longitude: roadCoordinates[0][0],
    latitude: roadCoordinates[0][1]
  });

  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState(selectedRoute?.duration_seconds || 840);
  const [remainingDistMeters, setRemainingDistMeters] = useState(selectedRoute?.distance_meters || 1200);
  const [distanceToTurn, setDistanceToTurn] = useState(steps[0]?.distance_meters || 150);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  const [useRealGps, setUseRealGps] = useState(false);

  // Real-time navigation: Simulation mode or Live Device GPS mode
  useEffect(() => {
    if (useRealGps && 'geolocation' in navigator) {
      // Live device GPS mode via watchPosition
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoord({ latitude: lat, longitude: lng });

          // Calculate closest step
          let closestStep = 0;
          let minD = 999999;
          steps.forEach((s, i) => {
            if (s.location) {
              const d = Math.hypot(lat - s.location[0], lng - s.location[1]);
              if (d < minD) { minD = d; closestStep = i; }
            }
          });
          setCurrentStepIndex(closestStep);
        },
        (err) => {
          console.warn('Live GPS watch error:', err.message);
          setUseRealGps(false);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      // Desktop / Preview Simulation along real road coordinates
      if (!roadCoordinates || roadCoordinates.length === 0) return;

      const interval = setInterval(() => {
        setCoordIndex(prevIdx => {
          const nextIdx = prevIdx + 1;
          if (nextIdx < roadCoordinates.length) {
            const nextCoord = roadCoordinates[nextIdx];
            setUserCoord({
              longitude: nextCoord[0],
              latitude: nextCoord[1]
            });

            // Update turn progress
            const progressRatio = nextIdx / roadCoordinates.length;
            const nextStepIdx = Math.min(steps.length - 1, Math.floor(progressRatio * steps.length));
            setCurrentStepIndex(nextStepIdx);

            // Update remaining metrics
            setRemainingTimeSeconds(t => Math.max(0, t - 25));
            setRemainingDistMeters(d => Math.max(0, d - 65));
            setDistanceToTurn(dt => Math.max(20, dt - 30));

            // Trigger caution alert if step has an alert
            if (steps[nextStepIdx]?.alert && !activeAlert) {
              setActiveAlert({ warning: steps[nextStepIdx].alert });
            }

            return nextIdx;
          }
          return prevIdx;
        });
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [roadCoordinates, steps, activeAlert, useRealGps]);

  // Handle Share Trip GPS Link
  const handleShareTrip = async () => {
    try {
      const res = await sosAPI.shareTrip({
        sourceName: currentLocation.name || 'Origin',
        destName: destination.name || 'Destination',
        currentLat: userCoord.latitude,
        currentLng: userCoord.longitude,
        routeType: selectedRoute?.type || 'safest'
      });
      navigator.clipboard.writeText(res.data.trip.share_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Automatic / Manual Rerouting
  const handleTriggerReroute = async () => {
    setIsRerouting(true);
    try {
      const payload = {
        sourceLat: userCoord.latitude,
        sourceLng: userCoord.longitude,
        destLat: destination.lat || destination.latitude,
        destLng: destination.lng || destination.longitude,
        sourceName: 'Current Off-Route Position',
        destName: destination.name,
        travelMode: travelMode || 'walking'
      };

      const res = await routeAPI.getSafeRoutes(payload);
      if (res.data?.success && res.data.data.routes?.length > 0) {
        const safestRoute = res.data.data.routes.find(r => r.type === 'safest') || res.data.data.routes[0];
        setSelectedRoute(safestRoute);
        setActiveAlert(null);
        setCoordIndex(0);
      }
    } catch (e) {
      console.warn('Rerouting error:', e.message);
    } finally {
      setIsRerouting(false);
    }
  };

  const handleEndTrip = () => {
    navigate('/dashboard');
  };

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-slate-950 text-white overflow-hidden">

      {/* Floating Risk Zone Alert Banner */}
      <RiskZoneAlert
        alert={activeAlert}
        onDismiss={() => setActiveAlert(null)}
        onReroute={handleTriggerReroute}
      />

      {/* Top Turn-by-Turn Maneuver Card (Google Maps Style) */}
      <div className="z-30 p-4 max-w-2xl mx-auto w-full">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-600/30">
              <Navigation className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                  In {distanceToTurn}m
                </span>
                {isRerouting && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 font-bold animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Rerouting...
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5">
                {currentStep.instruction}
              </h2>
              <span className="inline-block mt-1 text-xs text-slate-400 font-medium">
                🛡️ {currentStep.safety_tag}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseRealGps(!useRealGps)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                useRealGps
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle between Live Device GPS and Waypoint Simulation Preview"
            >
              <Compass className={`w-3.5 h-3.5 ${useRealGps ? 'animate-spin text-white' : ''}`} />
              <span className="text-[11px] font-semibold">{useRealGps ? 'Live GPS' : 'Simulation'}</span>
            </button>

            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              title="Toggle Voice Guidance"
            >
              {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3D Mapbox GL Navigation Canvas */}
      <div className="flex-1 w-full relative px-4">
        <MapView
          center={[userCoord.longitude, userCoord.latitude]}
          zoom={16.5}
          pitch={50}
          followUser={true}
          routes={selectedRoute ? [selectedRoute] : []}
          selectedRouteId={selectedRoute?.id}
          destinationLocation={{
            longitude: destination.lng || destination.longitude || 77.2295,
            latitude: destination.lat || destination.latitude || 28.6129,
            name: destination.name
          }}
          userLocation={userCoord}
          height="55vh"
        />

        {/* Live Safety Score Badge Floating Over Map */}
        <div className="absolute top-4 left-8 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 border border-slate-700/80 backdrop-blur shadow-2xl">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-300">Live Safety Score:</span>
          <span className="text-sm font-black text-emerald-400">
            {selectedRoute?.safety_score || 89}/100
          </span>
        </div>
      </div>

      {/* Bottom Navigation Control Bar */}
      <div className="z-30 p-4 max-w-2xl mx-auto w-full space-y-3">
        <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">

          {/* ETA & Distance Remaining */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-white text-base">
                {Math.max(1, Math.round(remainingTimeSeconds / 60))} mins
              </span>
              <span className="text-slate-400">
                ({(remainingDistMeters / 1000).toFixed(2)} km remaining)
              </span>
            </div>

            <div className="text-xs text-slate-400">
              Towards: <strong className="text-slate-200">{destination.name?.split(',')[0]}</strong>
            </div>
          </div>

          {/* Action Buttons: Share Trip + SOS + End Trip */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={handleShareTrip}
              className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>{copiedLink ? 'Link Copied!' : 'Share Live GPS'}</span>
            </button>

            <button
              onClick={triggerSOS}
              className="py-3 px-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span>ONE-TAP SOS</span>
            </button>

            <button
              onClick={handleEndTrip}
              className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>End Safely</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LiveNavigationPage;
