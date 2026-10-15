import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapsAPI } from '../services/api';
import { Layers, Moon, Sun, Globe, Loader2 } from 'lucide-react';

// Built-in High-Performance Styles (100% Free, Zero API Key required, CORS-enabled)
export const MAP_STYLES = {
  streets: {
    id: 'streets',
    label: 'Streets',
    icon: Sun,
    style: {
      version: 8,
      name: 'SafeRouteStreets',
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#e2e8f0' }
        },
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
          paint: { 'raster-opacity': 1.0 }
        }
      ]
    }
  },
  dark: {
    id: 'dark',
    label: 'Night Safe',
    icon: Moon,
    style: {
      version: 8,
      name: 'SafeRouteDark',
      sources: {
        'esri-dark-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap'
        },
        'esri-dark-ref': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#0f172a' }
        },
        {
          id: 'esri-dark-base-layer',
          type: 'raster',
          source: 'esri-dark-tiles',
          minzoom: 0,
          maxzoom: 19,
          paint: { 'raster-opacity': 0.95 }
        },
        {
          id: 'esri-dark-ref-layer',
          type: 'raster',
          source: 'esri-dark-ref',
          minzoom: 0,
          maxzoom: 19,
          paint: { 'raster-opacity': 0.85 }
        }
      ]
    }
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    icon: Globe,
    style: {
      version: 8,
      name: 'SafeRouteSatellite',
      sources: {
        'esri-sat-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '&copy; Esri, DigitalGlobe, GeoEye, Earthstar Geographics'
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#020617' }
        },
        {
          id: 'esri-sat-layer',
          type: 'raster',
          source: 'esri-sat-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  }
};

const MapView = ({
  center = [77.2195, 28.6328], // [lng, lat] (Delhi default)
  zoom = 14,
  routes = [],
  selectedRouteId = null,
  onSelectRoute = null,
  sourceLocation = null,      // { longitude, latitude, name }
  destinationLocation = null, // { longitude, latitude, name }
  userLocation = null,        // { longitude, latitude }
  followUser = false,
  pitch = 0,
  height = '520px',
  defaultTheme = 'streets'
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ source: null, dest: null, user: null });
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // 1. Initialize MapLibre GL Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    let isMounted = true;

    const setupMap = async () => {
      let initialStyle = MAP_STYLES[currentTheme]?.style || MAP_STYLES.streets.style;

      try {
        const configRes = await mapsAPI.getConfig();
        if (configRes.data?.has_mapbox_token && configRes.data.mapbox_token) {
          // If user configured a Mapbox access token, load native Mapbox vector dark style!
          const token = configRes.data.mapbox_token;
          initialStyle = `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${token}`;
        }
      } catch (err) {
        // Backend offline or config failed; seamlessly proceed with high-speed built-in raster style
        console.warn('[MapView] Using free built-in offline-safe style');
      }

      if (!isMounted || !mapContainerRef.current) return;

      try {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: initialStyle,
          center: center,
          zoom: zoom,
          pitch: pitch,
          attributionControl: { compact: true }
        });

        // Navigation controls (Zoom + Compass)
        map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
        map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

        map.on('load', () => {
          if (!isMounted) return;
          setStyleLoaded(true);
          setIsInitializing(false);
          map.resize();
        });

        map.on('style.load', () => {
          if (!isMounted) return;
          setStyleLoaded(true);
          setIsInitializing(false);
        });

        map.on('error', (e) => {
          console.warn('[MapLibre Event]', e.error?.message || e);
        });

        mapRef.current = map;
      } catch (err) {
        console.error('[MapLibre Init Error]', err);
        if (isMounted) {
          setMapError(err.message || 'Map failed to initialize');
          setIsInitializing(false);
        }
      }
    };

    setupMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Change Map Style dynamically
  const switchTheme = (themeKey) => {
    if (!mapRef.current || !MAP_STYLES[themeKey]) return;
    setCurrentTheme(themeKey);
    setStyleLoaded(false);
    mapRef.current.setStyle(MAP_STYLES[themeKey].style);
  };

  // 3. Render Route Polylines (Real Roads GeoJSON)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const renderLayers = () => {
      if (!map.isStyleLoaded()) {
        map.once('style.load', renderLayers);
        return;
      }

      if (!routes || routes.length === 0) return;

      const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
      const alternateRoutes = routes.filter(r => r.id !== activeRoute.id);

      // Feature Collection for Active and Alternate Routes
      const geojsonData = {
        type: 'FeatureCollection',
        features: [
          // Alternate routes (dashed gray lines)
          ...alternateRoutes.map(r => ({
            type: 'Feature',
            properties: {
              id: r.id,
              is_active: false,
              color: '#64748B',
              name: r.name
            },
            geometry: r.geojson?.geometry || {
              type: 'LineString',
              coordinates: r.coordinates || []
            }
          })),
          // Active Route (prominently colored)
          {
            type: 'Feature',
            properties: {
              id: activeRoute.id,
              is_active: true,
              color: activeRoute.color || (activeRoute.type === 'safest' ? '#10B981' : (activeRoute.type === 'fastest' ? '#EF4444' : '#F59E0B')),
              name: activeRoute.name
            },
            geometry: activeRoute.geojson?.geometry || {
              type: 'LineString',
              coordinates: activeRoute.coordinates || []
            }
          }
        ]
      };

      // Add or update source
      const existingSource = map.getSource('safe-routes-source');
      if (existingSource) {
        existingSource.setData(geojsonData);
      } else {
        map.addSource('safe-routes-source', {
          type: 'geojson',
          data: geojsonData
        });

        // Layer: Alternate Routes (clickable)
        map.addLayer({
          id: 'routes-alternate-line',
          type: 'line',
          source: 'safe-routes-source',
          filter: ['==', 'is_active', false],
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#64748B',
            'line-width': 5,
            'line-opacity': 0.65,
            'line-dasharray': [2, 2]
          }
        });

        // Layer: Active Route Dark Outline Casing
        map.addLayer({
          id: 'route-active-casing',
          type: 'line',
          source: 'safe-routes-source',
          filter: ['==', 'is_active', true],
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#090d16',
            'line-width': 9.5,
            'line-opacity': 0.85
          }
        });

        // Layer: Active Route Core Line
        map.addLayer({
          id: 'route-active-line',
          type: 'line',
          source: 'safe-routes-source',
          filter: ['==', 'is_active', true],
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 6.5,
            'line-opacity': 1.0
          }
        });

        // Interaction: click alternate route to switch
        map.on('click', 'routes-alternate-line', (e) => {
          const feature = e.features?.[0];
          const routeId = feature?.properties?.id;
          if (routeId && onSelectRoute) {
            const match = routes.find(r => r.id === routeId);
            if (match) onSelectRoute(match);
          }
        });

        map.on('mouseenter', 'routes-alternate-line', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'routes-alternate-line', () => {
          map.getCanvas().style.cursor = '';
        });
      }

      // Smooth camera fit bounds
      if (!followUser && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        activeRoute.coordinates.forEach(pt => {
          if (Array.isArray(pt) && pt.length >= 2) {
            bounds.extend(pt);
          }
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: { top: 70, bottom: 70, left: 70, right: 70 },
            duration: 900,
            maxZoom: 16
          });
        }
      }
    };

    renderLayers();
  }, [routes, selectedRouteId, styleLoaded, followUser]);

  // 4. Source, Destination & Live User Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    // Origin Marker (Blue / Green with pulsing ring)
    if (sourceLocation && sourceLocation.longitude && sourceLocation.latitude) {
      if (markersRef.current.source) markersRef.current.source.remove();

      const el = createMarkerEl('#2563EB', '🟢', 'Origin');
      markersRef.current.source = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([sourceLocation.longitude, sourceLocation.latitude])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(`<b>Origin:</b><br/>${sourceLocation.name || 'Start'}`))
        .addTo(map);
    }

    // Destination Marker (Chequered / Red Flag)
    if (destinationLocation && destinationLocation.longitude && destinationLocation.latitude) {
      if (markersRef.current.dest) markersRef.current.dest.remove();

      const el = createMarkerEl('#10B981', '🏁', 'Destination');
      markersRef.current.dest = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([destinationLocation.longitude, destinationLocation.latitude])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(`<b>Destination:</b><br/>${destinationLocation.name || 'End'}`))
        .addTo(map);
    }

    // Live User GPS Dot
    if (userLocation && userLocation.longitude && userLocation.latitude) {
      if (!markersRef.current.user) {
        const el = document.createElement('div');
        el.className = 'live-user-dot';
        el.innerHTML = `
          <div style="position: relative; width: 28px; height: 28px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: #0284c7; opacity: 0.45; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 18px; height: 18px; margin: 5px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(2, 132, 199, 0.9);"></div>
          </div>
        `;
        markersRef.current.user = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(map);
      } else {
        markersRef.current.user.setLngLat([userLocation.longitude, userLocation.latitude]);
      }

      if (followUser) {
        map.easeTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 17,
          pitch: 50,
          duration: 900
        });
      }
    }
  }, [sourceLocation, destinationLocation, userLocation, styleLoaded, followUser]);

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900"
      style={{ height }}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 pointer-events-none">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
            Loading Safe Route Map...
          </p>
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center z-20">
          <p className="text-rose-400 font-semibold mb-2">Map Engine Error</p>
          <p className="text-xs text-slate-400 mb-4">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
          >
            Reload Map
          </button>
        </div>
      )}

      {/* Style Switcher Floating Pill */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 flex items-center gap-1 shadow-lg">
        {Object.values(MAP_STYLES).map(s => {
          const Icon = s.icon;
          const isActive = currentTheme === s.id;
          return (
            <button
              key={s.id}
              onClick={() => switchTheme(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={`Switch to ${s.label}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function createMarkerEl(bgColor, emoji, title) {
  const el = document.createElement('div');
  el.title = title;
  el.style.backgroundColor = bgColor;
  el.style.color = '#ffffff';
  el.style.width = '34px';
  el.style.height = '34px';
  el.style.borderRadius = '50%';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.fontSize = '15px';
  el.style.boxShadow = '0 6px 14px rgba(0,0,0,0.4)';
  el.style.border = '2.5px solid #ffffff';
  el.style.cursor = 'pointer';
  el.innerHTML = emoji;
  return el;
}

export default MapView;
