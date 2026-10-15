from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        orm_mode = True

class RouteCreate(BaseModel):
    source: str
    destination: str

class RouteResponse(BaseModel):
    id: int
    source: str
    destination: str
    safety_score: float
    timestamp: datetime

    class Config:
        orm_mode = True
        
class SafetyScoreRequest(BaseModel):
    route_coordinates: List[List[float]] # List of [lat, lng]
