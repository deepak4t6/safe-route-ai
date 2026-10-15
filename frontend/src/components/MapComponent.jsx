import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix standard Leaflet default marker asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons
const createCustomIcon = (color, label, emoji) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: bold;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        border: 2px solid white;
        cursor: pointer;
      ">
        ${emoji || '📍'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const MapComponent = ({
  center = [28.6328, 77.2195],
  zoom = 15,
  routes = [],
  selectedRouteType = 'safest',
  onSelectRoute = null,
  safePlaces = [],
  riskZones = [],
  reports = [],
  userLocation = null,
  showHeatmap = false,
  showSafePlaces = true,
  height = '500px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false
      });

      // OpenStreetMap Free Tile Layer (100% Free, No API Key Required, No Watermarks)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map stays preserved
    };
  }, []);

  // Update Layers & Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // 1. Draw Risk Zones (Circles)
    if (riskZones && riskZones.length > 0) {
      riskZones.forEach(zone => {
        const circle = L.circle([zone.latitude, zone.longitude], {
          color: '#EF4444',
          fillColor: '#EF4444',
          fillOpacity: 0.22,
          radius: zone.radius_meters || 180,
          weight: 1.5,
          dashArray: '4, 6'
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
            <div style="color: #EF4444; font-weight: bold; margin-bottom: 3px;">⚠️ Flagged Risk Zone</div>
            <div style="font-weight: 600; color: #fff;">${zone.name}</div>
            <div style="color: #94a3b8; margin-top: 4px;">${zone.reason}</div>
            <div style="color: #f87171; font-size: 11px; margin-top: 4px;">Risk Penalty: ${zone.risk_score} pts</div>
          </div>
        `);
        layers.addLayer(circle);
      });
    }

    // 2. Draw Safe Places Markers
    if (showSafePlaces && safePlaces && safePlaces.length > 0) {
      safePlaces.forEach(place => {
        let iconEmoji = '🛡️';
        let bgColor = '#10B981';
        if (place.category === 'police_station') {
          iconEmoji = '👮';
          bgColor = '#3B82F6';
        } else if (place.category === 'hospital') {
          iconEmoji = '🏥';
          bgColor = '#EF4444';
        } else if (place.category === 'pharmacy_24x7') {
          iconEmoji = '💊';
          bgColor = '#14B8A6';
        } else if (place.category === 'metro_station') {
          iconEmoji = '🚇';
          bgColor = '#6366F1';
        }

        const marker = L.marker([place.latitude, place.longitude], {
          icon: createCustomIcon(bgColor, place.name, iconEmoji)
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
            <div style="color: #10B981; font-weight: bold;">Verified Safe Haven</div>
            <div style="font-weight: 700; color: #fff; margin-top: 2px;">${place.name}</div>
            <div style="color: #94a3b8; font-size: 12px;">${place.address || 'Central District'}</div>
            <div style="color: #38bdf8; font-size: 11px; margin-top: 4px;">⏰ Open: ${place.open_hours || '24/7'}</div>
            ${place.phone ? `<div style="color: #4ade80; font-size: 11px;">📞 ${place.phone}</div>` : ''}
          </div>
        `);
        layers.addLayer(marker);
      });
    }

    // 3. Draw Community Reports Markers
    if (reports && reports.length > 0) {
      reports.forEach(rep => {
        const marker = L.circleMarker([rep.latitude, rep.longitude], {
          radius: 7,
          fillColor: rep.category === 'police_presence' || rep.category === 'safe_haven' ? '#10B981' : '#F59E0B',
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong style="color: #F59E0B;">Incident Report</strong><br/>
            <strong>Category:</strong> ${rep.category.replace('_', ' ')}<br/>
            <strong>Details:</strong> ${rep.description}<br/>
            <span style="color: #94a3b8; font-size: 10px;">Severity: ${rep.severity || 3}/5 • Verified</span>
          </div>
        `);
        layers.addLayer(marker);
      });
    }

    // 4. Draw Routes
    if (routes && routes.length > 0) {
      const bounds = L.latLngBounds();

      routes.forEach(route => {
        const isSelected = route.type === selectedRouteType;
        let color = '#10B981'; // Safest
        if (route.type === 'fastest') color = '#EF4444';
        if (route.type === 'balanced') color = '#F59E0B';

        const polyline = L.polyline(route.geometry, {
          color,
          weight: isSelected ? 7 : 4,
          opacity: isSelected ? 0.95 : 0.45,
          dashArray: route.type === 'fastest' ? '6, 8' : null
        });

        polyline.on('click', () => {
          if (onSelectRoute) onSelectRoute(route);
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px;">
            <strong style="color: ${color};">${route.name}</strong><br/>
            Safety Score: <b>${route.safety_score}/100</b> (${route.risk_level.toUpperCase()})<br/>
            ETA: ${route.duration_formatted} • Distance: ${route.distance_formatted}
          </div>
        `);

        layers.addLayer(polyline);

        route.geometry.forEach(pt => bounds.extend(pt));
      });

      // Fit map bounds to show full routes
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      // Add Start & End Markers
      const startPt = routes[0].geometry[0];
      const endPt = routes[0].geometry[routes[0].geometry.length - 1];

      const startMarker = L.marker(startPt, {
        icon: createCustomIcon('#3B82F6', 'Start', '🟢')
      }).bindPopup('<b>Start Location</b>');

      const endMarker = L.marker(endPt, {
        icon: createCustomIcon('#10B981', 'End', '🏁')
      }).bindPopup('<b>Destination</b>');

      layers.addLayer(startMarker);
      layers.addLayer(endMarker);
    }

    // 5. Draw User Live Location Marker (if navigating or detected)
    if (userLocation && userLocation.lat && userLocation.lng) {
      const liveUserMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 9,
        fillColor: '#38BDF8',
        color: '#FFFFFF',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).bindPopup('<b>Your Current Location</b>');
      layers.addLayer(liveUserMarker);
    }

  }, [routes, selectedRouteType, safePlaces, riskZones, reports, userLocation, showSafePlaces]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapComponent;
