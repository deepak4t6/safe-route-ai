"""
Safe Route AI — Data Pipeline & Geospatial Utility
Handles distance calculations, spatial proximity lookups, and incident aggregation.
"""

import math
from typing import List, Dict, Any, Tuple

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in meters.
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class GeospatialIndex:
    """
    Lightweight, fast in-memory spatial index for points of interest,
    risk zones, and incident reports.
    """
    def __init__(self, safe_places: List[Dict[str, Any]] = None,
                 risk_zones: List[Dict[str, Any]] = None,
                 incidents: List[Dict[str, Any]] = None):
        self.safe_places = safe_places or []
        self.risk_zones = risk_zones or []
        self.incidents = incidents or []

    def find_nearest_safe_places(self, lat: float, lng: float, max_distance_meters: float = 3000) -> List[Dict[str, Any]]:
        results = []
        for place in self.safe_places:
            dist = haversine_distance_meters(lat, lng, place['latitude'], place['longitude'])
            if dist <= max_distance_meters:
                item = place.copy()
                item['distance_meters'] = round(dist, 1)
                results.append(item)
        results.sort(key=lambda x: x['distance_meters'])
        return results

    def find_intersecting_risk_zones(self, lat: float, lng: float) -> List[Dict[str, Any]]:
        intersected = []
        for zone in self.risk_zones:
            dist = haversine_distance_meters(lat, lng, zone['latitude'], zone['longitude'])
            radius = zone.get('radius_meters', 200)
            if dist <= radius:
                item = zone.copy()
                item['distance_to_center'] = round(dist, 1)
                intersected.append(item)
        return intersected

    def find_nearby_incidents(self, lat: float, lng: float, radius_meters: float = 500) -> List[Dict[str, Any]]:
        nearby = []
        for inc in self.incidents:
            dist = haversine_distance_meters(lat, lng, inc['latitude'], inc['longitude'])
            if dist <= radius_meters:
                item = inc.copy()
                item['distance_meters'] = round(dist, 1)
                nearby.append(item)
        return nearby
