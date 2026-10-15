"""
Safe Route AI — FastAPI AI & Risk Microservice
Exposes REST APIs for safety calculations, route risk scoring,
explainable AI breakdowns, and Conversational Safety Assistant.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import datetime

from data_pipeline import GeospatialIndex
from risk_model import SafetyRiskModel
from route_scorer import RouteScorer

app = FastAPI(
    title="Safe Route AI Risk Engine",
    description="Explainable Multi-factor Safety Scoring & Route Evaluation API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Demo seed data loaded into Geospatial Index
DEMO_SAFE_PLACES = [
    {'name': 'Central District Police Station', 'category': 'police_station', 'latitude': 28.6328, 'longitude': 77.2195},
    {'name': 'Metro Police Post & Helpdesk', 'category': 'police_station', 'latitude': 28.6360, 'longitude': 77.2155},
    {'name': 'City Care Hospital', 'category': 'hospital', 'latitude': 28.6385, 'longitude': 77.2240},
    {'name': 'Apollo 24x7 Pharmacy', 'category': 'pharmacy_24x7', 'latitude': 28.6315, 'longitude': 77.2160},
    {'name': 'Rajiv Chowk Metro Station', 'category': 'metro_station', 'latitude': 28.6329, 'longitude': 77.2195},
    {'name': '24 Seven Convenience Hub', 'category': 'convenience_store_24x7', 'latitude': 28.6342, 'longitude': 77.2210}
]

DEMO_RISK_ZONES = [
    {'name': 'Old Service Alley', 'latitude': 28.6355, 'longitude': 77.2130, 'radius_meters': 180, 'risk_score': 78.5, 'reason': 'Broken streetlights, blind corners, isolated after 8 PM'},
    {'name': 'Underpass Construction Sector 4', 'latitude': 28.6290, 'longitude': 77.2250, 'radius_meters': 200, 'risk_score': 65.0, 'reason': 'Pedestrian pathway blocked, low foot traffic'},
    {'name': 'Railway Boundary Backroad', 'latitude': 28.6410, 'longitude': 77.2120, 'radius_meters': 250, 'risk_score': 85.0, 'reason': 'No CCTV, sparse lighting'}
]

DEMO_INCIDENTS = [
    {'category': 'poor_lighting', 'severity': 4, 'latitude': 28.6348, 'longitude': 77.2142, 'status': 'verified'},
    {'category': 'stray_dogs', 'severity': 3, 'latitude': 28.6370, 'longitude': 77.2165, 'status': 'verified'},
    {'category': 'harassment', 'severity': 5, 'latitude': 28.6350, 'longitude': 77.2135, 'status': 'verified'},
    {'category': 'police_presence', 'severity': 1, 'latitude': 28.6335, 'longitude': 77.2185, 'status': 'verified'}
]

geo_index = GeospatialIndex(
    safe_places=DEMO_SAFE_PLACES,
    risk_zones=DEMO_RISK_ZONES,
    incidents=DEMO_INCIDENTS
)

risk_model = SafetyRiskModel()
route_scorer = RouteScorer(geo_index)

# ----------------------------------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------------------------------
class SegmentRequest(BaseModel):
    latitude: float
    longitude: float
    time_hour: Optional[int] = None
    lighting_level: Optional[float] = 7.0
    road_type: Optional[str] = "primary"
    foot_traffic: Optional[str] = "moderate"
    weather: Optional[str] = "clear"

class RouteScoreRequest(BaseModel):
    waypoints: List[List[float]] # [[lat, lng], [lat, lng], ...]
    departure_hour: Optional[int] = 21
    travel_mode: Optional[str] = "walking"
    route_type: Optional[str] = "safest"

class AiAskRequest(BaseModel):
    question: str
    latitude: Optional[float] = 28.6328
    longitude: Optional[float] = 77.2195
    time_str: Optional[str] = "10:00 PM"

# ----------------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "safe-route-ai-engine",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/score-segment")
def score_segment(payload: SegmentRequest):
    safe_places = geo_index.find_nearest_safe_places(payload.latitude, payload.longitude)
    risk_zones = geo_index.find_intersecting_risk_zones(payload.latitude, payload.longitude)
    incidents = geo_index.find_nearby_incidents(payload.latitude, payload.longitude)

    result = risk_model.evaluate_point_safety(
        lat=payload.latitude,
        lng=payload.longitude,
        time_hour=payload.time_hour,
        lighting_level=payload.lighting_level or 7.0,
        road_type=payload.road_type or "primary",
        foot_traffic=payload.foot_traffic or "moderate",
        weather=payload.weather or "clear",
        nearby_safe_places=safe_places,
        intersecting_risk_zones=risk_zones,
        nearby_incidents=incidents
    )
    return result

@app.post("/score-route")
def score_route(payload: RouteScoreRequest):
    if not payload.waypoints or len(payload.waypoints) < 2:
        raise HTTPException(status_code=400, detail="At least 2 waypoints required")

    result = route_scorer.score_route_waypoints(
        waypoints=payload.waypoints,
        departure_hour=payload.departure_hour or 21,
        mode=payload.travel_mode or "walking",
        route_type=payload.route_type or "safest"
    )
    return result

@app.post("/ask-ai")
def ask_ai_assistant(payload: AiAskRequest):
    """
    AI Safety Assistant that answers queries such as:
    'Is this area safe at 10 PM?' or 'Which route has better lighting?'
    """
    lat = payload.latitude or 28.6328
    lng = payload.longitude or 77.2195
    q_lower = payload.question.lower()

    safe_places = geo_index.find_nearest_safe_places(lat, lng, max_distance_meters=1500)
    risk_zones = geo_index.find_intersecting_risk_zones(lat, lng)
    incidents = geo_index.find_nearby_incidents(lat, lng, radius_meters=600)

    # Contextual synthesis
    police = [p['name'] for p in safe_places if p['category'] == 'police_station']
    hospitals = [p['name'] for p in safe_places if p['category'] == 'hospital']

    has_night_keyword = any(k in q_lower for k in ["night", "pm", "10", "11", "dark", "late", "shaam", "raat"])

    response_text = ""
    tips = []

    if has_night_keyword or "safe" in q_lower:
        if risk_zones:
            response_text = (
                f"Raat ke samay ({payload.time_str}) is area ke aas-paas savdhan rehna zaroori hai. "
                f"Nearby '{risk_zones[0]['name']}' me poor lighting aur isolated stretches report huye hain. "
            )
            tips.append("Main well-lit avenue use karein aur dark service lane me na jaayein.")
        else:
            response_text = (
                f"Overall ye area moderate-to-safe category me aata hai ({payload.time_str} ke time). "
                f"Main road par active surveillance aur occasional police patrolling rehti hai."
            )
            tips.append("Main roads par chalein jahan shops ya metro connectivity active ho.")

        if police:
            tips.append(f"Nearest police help point: {police[0]} ({int(safe_places[0]['distance_meters'])}m).")
        if hospitals:
            tips.append(f"Nearest 24/7 medical unit: {hospitals[0]}.")
    else:
        response_text = (
            f"Is area me daytime foot-traffic normal rehta hai. "
            f"Verified community reports ke mutabiq major issues nahi hain, par regular safety awareness maintain karein."
        )
        tips.append("Safe Route AI ka live navigation on rakhein taaki live detour alerts mil sakein.")

    return {
        "question": payload.question,
        "answer": response_text,
        "actionable_tips": tips,
        "nearby_safe_amenities_count": len(safe_places),
        "active_risk_alerts": len(risk_zones) + len(incidents),
        "disclaimer": "Safe Route AI provides real-time safety insights based on crowdsourced and geospatial data, not legal or physical guarantees."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
