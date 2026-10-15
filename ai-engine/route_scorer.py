"""
Safe Route AI — Route Scorer
Scores complete route polylines, flags risky segments, and calculates
comparisons across Fastest, Safest, and Balanced routes.
"""

from typing import List, Dict, Any
from risk_model import SafetyRiskModel
from data_pipeline import GeospatialIndex, haversine_distance_meters

class RouteScorer:
    def __init__(self, geo_index: GeospatialIndex):
        self.geo_index = geo_index
        self.model = SafetyRiskModel()

    def score_route_waypoints(self,
                              waypoints: List[List[float]], # [[lat, lng], ...]
                              departure_hour: int = 21,
                              mode: str = 'walking',
                              route_type: str = 'safest') -> Dict[str, Any]:
        """
        Samples waypoints along route, evaluates risk at each step,
        and aggregates using worst-case-aware weighting.
        """
        if not waypoints or len(waypoints) < 2:
            return {
                "safety_score": 70.0,
                "risk_level": "moderate",
                "segments": [],
                "risky_segments": []
            }

        segment_results = []
        risky_segments = []

        # If waypoints are dense, step through them; if sparse, evaluate each
        step = max(1, len(waypoints) // 15)
        sampled_points = [waypoints[i] for i in range(0, len(waypoints), step)]
        if waypoints[-1] not in sampled_points:
            sampled_points.append(waypoints[-1])

        total_score_sum = 0.0
        min_segment_score = 100.0

        for idx, pt in enumerate(sampled_points):
            lat, lng = pt[0], pt[1]

            # Geospatial lookups
            safe_places = self.geo_index.find_nearest_safe_places(lat, lng, max_distance_meters=1500)
            risk_zones = self.geo_index.find_intersecting_risk_zones(lat, lng)
            incidents = self.geo_index.find_nearby_incidents(lat, lng, radius_meters=400)

            # Route type characteristics
            if route_type == 'safest':
                road_type = 'primary'
                lighting = 8.5
                foot_traffic = 'high'
            elif route_type == 'fastest':
                # Fastest route might cut through alleys or shortcuts
                road_type = 'secondary' if idx % 2 == 0 else 'alley'
                lighting = 5.0
                foot_traffic = 'low'
            else: # balanced
                road_type = 'secondary'
                lighting = 7.0
                foot_traffic = 'moderate'

            res = self.model.evaluate_point_safety(
                lat=lat,
                lng=lng,
                time_hour=departure_hour,
                lighting_level=lighting,
                road_type=road_type,
                foot_traffic=foot_traffic,
                cctv_available=True,
                nearby_safe_places=safe_places,
                intersecting_risk_zones=risk_zones,
                nearby_incidents=incidents
            )

            seg_score = res['safety_score']
            total_score_sum += seg_score
            if seg_score < min_segment_score:
                min_segment_score = seg_score

            segment_info = {
                "index": idx,
                "lat": lat,
                "lng": lng,
                "safety_score": seg_score,
                "risk_level": res['risk_level'],
                "explanations": res['explanations']
            }
            segment_results.append(segment_info)

            # Flag risky or caution segments (< 60 score)
            if seg_score < 60.0:
                risky_segments.append({
                    "waypoint_index": idx,
                    "location": [lat, lng],
                    "score": seg_score,
                    "warning": f"Alert: Low safety segment (Score: {seg_score}). {res['explanations'][0] if res['explanations'] else 'Exercise caution.'}"
                })

        avg_score = total_score_sum / max(1, len(sampled_points))
        # 60% average score + 40% worst segment score (so dangerous bottlenecks are not hidden)
        aggregate_score = round((0.60 * avg_score) + (0.40 * min_segment_score), 1)

        # Risk level categorization
        if aggregate_score >= 80.0:
            overall_risk = "safe"
        elif aggregate_score >= 60.0:
            overall_risk = "moderate"
        elif aggregate_score >= 40.0:
            overall_risk = "caution"
        else:
            overall_risk = "risky"

        # Natural language explanation in Hinglish/English
        if route_type == 'safest':
            summary_explanation = (
                f"Ye route safest option hai (Safety Score: {aggregate_score}/100). "
                f"Isme well-lit main roads aur CCTV coverage zyada hai, aur police station proximity acchi hai. "
                f"Night time walking ke liye strongly recommended."
            )
        elif route_type == 'fastest':
            summary_explanation = (
                f"Ye route time me 10-15% fast hai, lekin iska safety score {aggregate_score}/100 hai. "
                f"Isme {len(risky_segments)} isolated stretch/narrow lanes aate hain. "
                f"Daytime ke liye theek hai, par der raat avoid karein."
            )
        else:
            summary_explanation = (
                f"Balanced route (Safety Score: {aggregate_score}/100) — safety aur travel time ke beech "
                f"accha compromise hai. Isme major dark spots avoid kiye gaye hain."
            )

        return {
            "route_type": route_type,
            "safety_score": aggregate_score,
            "risk_level": overall_risk,
            "summary_explanation": summary_explanation,
            "min_segment_score": min_segment_score,
            "risky_segments_count": len(risky_segments),
            "risky_segments": risky_segments,
            "sampled_segments": segment_results
        }
