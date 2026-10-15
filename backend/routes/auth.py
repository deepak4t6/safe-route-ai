from flask import Blueprint, request, jsonify
import hashlib
from database import SessionLocal
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    db = SessionLocal()
    
    db_user = db.query(User).filter(User.username == data.get("username")).first()
    if db_user:
        db.close()
        return jsonify({"detail": "Username already registered"}), 400
    
    hashed_pwd = hash_password(data.get("password"))
    new_user = User(username=data.get("username"), hashed_password=hashed_pwd)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    res = {"id": new_user.id, "username": new_user.username}
    db.close()
    return jsonify(res)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    db = SessionLocal()
    
    db_user = db.query(User).filter(User.username == data.get("username")).first()
    if not db_user or db_user.hashed_password != hash_password(data.get("password")):
        db.close()
        return jsonify({"detail": "Invalid credentials"}), 401
    
    res = {"id": db_user.id, "username": db_user.username}
    db.close()
    return jsonify(res)
