import React, { createContext, useContext, useState, useEffect } from 'react';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  // Default coordinates: Connaught Place metro area, Central Hub
  const [currentLocation, setCurrentLocation] = useState({
    lat: 28.6328,
    lng: 77.2195,
    latitude: 28.6328,
    longitude: 77.2195,
    name: 'Connaught Place Central, New Delhi'
  });

  const [destination, setDestination] = useState({
    lat: 28.6385,
    lng: 77.2240,
    latitude: 28.6385,
    longitude: 77.2240,
    name: 'Barakhamba Road Commercial Hub'
  });

  const [travelMode, setTravelMode] = useState('walking');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStepIndex, setNavStepIndex] = useState(0);

  // Modals
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);

  // Auto-detect browser geolocation if available
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // If valid coordinates, update
          if (pos.coords.latitude && pos.coords.longitude) {
            // Check if user is in sensible range, or keep Delhi demo center for demo coherence
            console.log('Detected device coordinates:', pos.coords.latitude, pos.coords.longitude);
          }
        },
        (err) => {
          // Fall back to default demo coordinates
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const triggerSOS = () => {
    setIsSosOpen(true);
  };

  const closeSOS = () => {
    setIsSosOpen(false);
  };

  return (
    <TripContext.Provider value={{
      currentLocation,
      setCurrentLocation,
      destination,
      setDestination,
      travelMode,
      setTravelMode,
      selectedRoute,
      setSelectedRoute,
      allRoutes,
      setAllRoutes,
      isNavigating,
      setIsNavigating,
      navStepIndex,
      setNavStepIndex,
      isSosOpen,
      setIsSosOpen,
      isReportOpen,
      setIsReportOpen,
      isAiOpen,
      setIsAiOpen,
      activeAlert,
      setActiveAlert,
      triggerSOS,
      closeSOS
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
