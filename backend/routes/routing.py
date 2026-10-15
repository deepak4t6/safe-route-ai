from flask import Blueprint, request, jsonify
import random
from database import SessionLocal
from models import RouteHistory

route_bp = Blueprint("route", __name__, url_prefix="/route")

@route_bp.route("/calculate-safety", methods=["POST"])
def calculate_safety():
    data = request.json
    route_coordinates = data.get("route_coordinates", [])
    
    base_score = random.uniform(5.0, 9.5)
    unsafe_zones = []
    
    if len(route_coordinates) > 0 and random.random() > 0.5:
        mid_point = route_coordinates[len(route_coordinates)//2]
        unsafe_zones.append({
            "lat": mid_point[0],
            "lng": mid_point[1],
            "reason": "High crime rate reported in this area"
        })
        base_score -= random.uniform(1.0, 3.0)

    return jsonify({
        "safety_score": round(max(1.0, base_score), 1),
        "unsafe_zones": unsafe_zones
    })

@route_bp.route("/history", methods=["POST"])
def save_route_history():
    data = request.json
    db = SessionLocal()
    
    safety = round(random.uniform(3.0, 9.9), 1)
    db_route = RouteHistory(
        user_id=data.get("user_id"),
        source=data.get("source"),
        destination=data.get("destination"),
        safety_score=safety
    )
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    
    res = {
        "id": db_route.id,
        "source": db_route.source,
        "destination": db_route.destination,
        "safety_score": db_route.safety_score,
        "timestamp": db_route.timestamp.isoformat()
    }
    db.close()
    return jsonify(res)

@route_bp.route("/history/<int:user_id>", methods=["GET"])
def get_user_history(user_id):
    db = SessionLocal()
    history = db.query(RouteHistory).filter(RouteHistory.user_id == user_id).order_by(RouteHistory.timestamp.desc()).all()
    
    res = [{
        "id": r.id,
        "source": r.source,
        "destination": r.destination,
        "safety_score": r.safety_score,
        "timestamp": r.timestamp.isoformat()
    } for r in history]
    
    db.close()
    return jsonify(res)
