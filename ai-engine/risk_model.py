"""
Safe Route AI — Explainable Risk Engine
Calculates transparent 0–100 safety score with factor breakdowns,
confidence levels, and human-readable explanations.
"""

from typing import Dict, Any, List
import datetime

class SafetyRiskModel:
    """
    Transparent Multi-Factor Risk & Safety Scorer.
    Never guarantees 100% safety.
    """

    ROAD_TYPE_WEIGHTS = {
        'highway': 8.0,
        'primary': 10.0,
        'secondary': 7.0,
        'residential': 3.0,
        'service': -12.0,
        'alley': -22.0,
        'unpaved': -18.0
    }

    SEVERITY_PENALTY = {
        1: 3.0,
        2: 6.0,
        3: 10.0,
        4: 16.0,
        5: 24.0
    }

    def __init__(self):
        pass

    def evaluate_point_safety(self,
                              lat: float,
                              lng: float,
                              time_hour: int = None,
                              lighting_level: float = 7.0,       # 0 to 10 scale
                              road_type: str = 'primary',        # highway, primary, secondary, residential, alley
                              foot_traffic: str = 'moderate',    # high, moderate, low, deserted
                              weather: str = 'clear',            # clear, rain, fog, storm
                              cctv_available: bool = True,
                              nearby_safe_places: List[Dict[str, Any]] = None,
                              intersecting_risk_zones: List[Dict[str, Any]] = None,
                              nearby_incidents: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculates safety score and breakdown for a given coordinate/segment.
        """
        nearby_safe_places = nearby_safe_places or []
        intersecting_risk_zones = intersecting_risk_zones or []
        nearby_incidents = nearby_incidents or []

        if time_hour is None:
            time_hour = datetime.datetime.now().hour

        is_night = (time_hour >= 21 or time_hour <= 5)
        is_evening = (18 <= time_hour < 21)

        # Baseline starting score
        score = 75.0
        explanations = []
        positive_factors = []
        risk_factors = []

        # 1. Lighting factor (-25 to +10)
        if lighting_level >= 8.0:
            score += 8.0
            positive_factors.append("Well-lit streetlights throughout this segment")
        elif lighting_level <= 3.0:
            penalty = 22.0 if is_night else 12.0
            score -= penalty
            risk_factors.append(f"Poor/broken lighting detected (-{penalty:.0f} pts penalty at night)")
        elif lighting_level < 6.0:
            score -= 5.0
            risk_factors.append("Moderate/patchy street lighting")

        # 2. Road type factor (-22 to +10)
        road_weight = self.ROAD_TYPE_WEIGHTS.get(road_type.lower(), 0.0)
        score += road_weight
        if road_weight > 5.0:
            positive_factors.append(f"Major {road_type} road with broad visibility")
        elif road_weight < -10.0:
            risk_factors.append(f"Narrow {road_type} or isolated lane with limited escape paths")

        # 3. Foot traffic / crowd factor (-15 to +10)
        if foot_traffic == 'high':
            score += 8.0
            positive_factors.append("Active pedestrian presence & open storefronts")
        elif foot_traffic == 'deserted':
            deserted_penalty = 18.0 if is_night else 10.0
            score -= deserted_penalty
            risk_factors.append(f"Deserted stretch with very low foot traffic")
        elif foot_traffic == 'low' and is_night:
            score -= 8.0
            risk_factors.append("Low late-night pedestrian activity")

        # 4. Proximity to Police & Hospitals
        police_stations = [p for p in nearby_safe_places if p.get('category') == 'police_station']
        hospitals = [p for p in nearby_safe_places if p.get('category') == 'hospital']

        if police_stations:
            nearest_p = police_stations[0]['distance_meters']
            if nearest_p < 400:
                score += 12.0
                positive_factors.append(f"Police post within {int(nearest_p)}m")
            elif nearest_p < 1000:
                score += 6.0
                positive_factors.append(f"Police station within {int(nearest_p)}m")
        else:
            if is_night:
                score -= 6.0
                risk_factors.append("More than 1.5km away from the nearest active police booth")

        if hospitals:
            nearest_h = hospitals[0]['distance_meters']
            if nearest_h < 600:
                score += 6.0
                positive_factors.append(f"Emergency hospital/clinic within {int(nearest_h)}m")

        # 5. Intersecting Known Risk Zones
        if intersecting_risk_zones:
            for zone in intersecting_risk_zones:
                zone_penalty = min(30.0, float(zone.get('risk_score', 25.0)) * 0.35)
                score -= zone_penalty
                risk_factors.append(f"Crosses flagged risk zone: '{zone.get('reason', 'Incident hotspot')}'")

        # 6. Community Incident Reports (within 500m)
        verified_incidents = [inc for inc in nearby_incidents if inc.get('status') == 'verified']
        total_inc_penalty = 0.0
        for inc in verified_incidents:
            sev = int(inc.get('severity', 3))
            cat = inc.get('category', 'incident').replace('_', ' ')
            pen = self.SEVERITY_PENALTY.get(sev, 8.0)
            total_inc_penalty += pen
            if len(risk_factors) < 4:
                risk_factors.append(f"Recent {cat} report nearby (Severity {sev}/5)")

        score -= min(35.0, total_inc_penalty)

        # 7. CCTV Surveillance
        if cctv_available:
            score += 5.0
            positive_factors.append("Public / municipal CCTV surveillance coverage")
        else:
            score -= 3.0

        # 8. Weather impact
        if weather in ['fog', 'storm', 'heavy_rain']:
            score -= 7.0
            risk_factors.append(f"Adverse weather condition ({weather}) reducing visibility")

        # Clamp score strictly between 5 and 96 (never claim 100% safe)
        final_score = max(8.0, min(95.0, score))

        # Risk level categorization
        if final_score >= 80.0:
            risk_level = "safe"
        elif final_score >= 60.0:
            risk_level = "moderate"
        elif final_score >= 40.0:
            risk_level = "caution"
        else:
            risk_level = "risky"

        # Data availability and confidence score
        data_points_count = len(nearby_safe_places) + len(nearby_incidents) + len(intersecting_risk_zones)
        if data_points_count >= 5:
            confidence = 0.92
            confidence_label = "High confidence (Rich area data)"
        elif data_points_count >= 2:
            confidence = 0.78
            confidence_label = "Moderate confidence"
        else:
            confidence = 0.55
            confidence_label = "Limited safety data available"

        # Compile concise bullet explanations
        combined_bullets = []
        if positive_factors:
            combined_bullets.extend(positive_factors[:3])
        if risk_factors:
            combined_bullets.extend(risk_factors[:3])
        if not combined_bullets:
            combined_bullets.append("Standard urban road conditions; no acute hazards registered.")

        return {
            "safety_score": round(final_score, 1),
            "risk_level": risk_level,
            "confidence": confidence,
            "confidence_label": confidence_label,
            "breakdown": {
                "lighting": lighting_level,
                "road_type": road_type,
                "foot_traffic": foot_traffic,
                "police_nearby": len(police_stations) > 0,
                "hospital_nearby": len(hospitals) > 0,
                "risk_zones_intersected": len(intersecting_risk_zones),
                "incident_reports_count": len(nearby_incidents)
            },
            "explanations": combined_bullets,
            "is_night": is_night,
            "disclaimer": "Safe Route AI provides navigational guidance based on historical & community reports. It is not an absolute safety guarantee."
        }
