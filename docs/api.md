# Safe Route AI — REST API Documentation

Base URL: `http://localhost:5000/api` (Production: `https://api.saferoute.ai/api`)

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method:** `POST`
- **Path:** `/auth/register`
- **Auth Required:** No

#### Request Body
```json
{
  "name": "Ananya Sharma",
  "email": "ananya@saferoute.ai",
  "password": "password123",
  "phone": "+919876543210",
  "preferred_mode": "walking"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Account registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-1730000000000",
    "name": "Ananya Sharma",
    "email": "ananya@saferoute.ai",
    "phone": "+919876543210",
    "role": "user",
    "preferred_mode": "walking"
  }
}
```

---

### 1.2 User Login
- **Method:** `POST`
- **Path:** `/auth/login`
- **Auth Required:** No

#### Request Body
```json
{
  "email": "ananya@saferoute.ai",
  "password": "password123"
}
```

---

### 1.3 Add Emergency Contact
- **Method:** `POST`
- **Path:** `/auth/contacts`
- **Auth Required:** Yes (`Bearer <token>`)

#### Request Body
```json
{
  "name": "Rajesh Sharma (Father)",
  "phone": "+919876500001",
  "relationship": "Parent"
}
```

---

## 2. Route Planning & AI Scoring

### 2.1 Calculate Safe Routes
- **Method:** `POST`
- **Path:** `/routes/safe-route`
- **Auth Required:** Optional

#### Request Body
```json
{
  "sourceLat": 28.6328,
  "sourceLng": 77.2195,
  "destLat": 28.6385,
  "destLng": 77.2240,
  "sourceName": "Connaught Place Central",
  "destName": "Barakhamba Road",
  "travelMode": "walking",
  "departureHour": 21,
  "safetyPriority": 80
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Generated 3 route alternatives with AI safety scoring",
  "data": {
    "source": { "name": "Connaught Place Central", "lat": 28.6328, "lng": 77.2195 },
    "destination": { "name": "Barakhamba Road", "lat": 28.6385, "lng": 77.2240 },
    "travel_mode": "walking",
    "departure_hour": 21,
    "recommended_route_type": "safest",
    "routes": [
      {
        "id": "route-safest-1730000000",
        "type": "safest",
        "name": "Safest Route (Recommended)",
        "tagline": "Well-lit main roads & active police proximity",
        "is_recommended": true,
        "geometry": [
          [28.6328, 77.2195],
          [28.6335, 77.2205],
          [28.6385, 77.2240]
        ],
        "distance_meters": 1120,
        "distance_formatted": "1.12 km",
        "duration_seconds": 896,
        "duration_formatted": "15 mins",
        "safety_score": 88.5,
        "risk_level": "safe",
        "risky_segments_count": 0,
        "explanation": {
          "title": "Safest walking & travel path",
          "summary": "Ye route safest option hai (Safety Score: 88.5/100). Isme well-lit broad avenues aur police post proximity zyada hai.",
          "highlights": [
            "Follows 85% illuminated main radial avenues",
            "Passes within 350m of Central Police Post",
            "Continuous commercial storefronts & CCTV"
          ]
        }
      },
      {
        "id": "route-fastest-1730000001",
        "type": "fastest",
        "name": "Fastest Route (Shortest)",
        "safety_score": 48.0,
        "risk_level": "caution",
        "distance_meters": 910,
        "duration_seconds": 728,
        "duration_formatted": "12 mins",
        "risky_segments_count": 1
      }
    ]
  }
}
```

---

## 3. Safety & Heatmap Endpoints

### 3.1 Get Heatmap Data
- **Method:** `GET`
- **Path:** `/safety/heatmap?category=all`

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "points": [
      {
        "lat": 28.6355,
        "lng": 77.2130,
        "intensity": 0.785,
        "type": "risk_zone",
        "name": "Old Service Alley",
        "radius": 180,
        "reason": "Broken streetlights, blind corners"
      }
    ],
    "safe_places": [
      {
        "id": "sp-1",
        "name": "Central District Police Station",
        "category": "police_station",
        "latitude": 28.6328,
        "longitude": 77.2195,
        "open_hours": "24/7"
      }
    ]
  }
}
```

### 3.2 Submit Community Incident Report
- **Method:** `POST`
- **Path:** `/safety/report`

#### Request Body
```json
{
  "category": "poor_lighting",
  "description": "Four streetlights completely dark along radial lane 3.",
  "latitude": 28.6348,
  "longitude": 77.2142,
  "severity": 4,
  "is_anonymous": true
}
```

---

## 4. Emergency SOS Endpoints

### 4.1 Trigger SOS Alert
- **Method:** `POST`
- **Path:** `/sos/trigger`

#### Request Body
```json
{
  "latitude": 28.6328,
  "longitude": 77.2195,
  "batteryPercentage": 84
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "EMERGENCY SOS ACTIVATED: Emergency contacts notified and nearest authorities located.",
  "sos": {
    "id": "sos-1730000000",
    "status": "triggered",
    "share_token": "sos-xyz123abc",
    "live_tracking_url": "https://saferoute.ai/track/sos-xyz123abc",
    "nearest_police": {
      "name": "Central District Police Station",
      "phone": "011-23412233",
      "distance_meters": 320
    },
    "nearest_hospital": {
      "name": "City Care Multi-Specialty Hospital",
      "phone": "011-44556677",
      "distance_meters": 540
    },
    "notified_contacts": [
      {
        "name": "Rajesh Sharma (Father)",
        "phone": "+919876500001",
        "status": "SMS & WhatsApp alert dispatched"
      }
    ]
  }
}
```

---

## 5. Conversational AI Assistant

### 5.1 Ask AI Safety Assistant
- **Method:** `POST`
- **Path:** `/ai/ask-safety-question`

#### Request Body
```json
{
  "question": "Is Connaught Place outer circle safe at 10 PM?",
  "latitude": 28.6328,
  "longitude": 77.2195,
  "timeStr": "10:00 PM"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "ai_response": {
    "question": "Is Connaught Place outer circle safe at 10 PM?",
    "answer": "Raat ke samay (10:00 PM) is area ke aas-paas savdhan rehna zaroori hai. Outer ring aur police booths ke paas active patrolling rehti hai.",
    "actionable_tips": [
      "Main commercial road prefer karein, dark back-alleys avoid karein.",
      "Nearest police station: Central District Police Station (24/7).",
      "Live route tracking dost ya parivaar ke sath share karein."
    ],
    "nearby_safe_amenities_count": 3,
    "active_risk_alerts": 3
  }
}
```
