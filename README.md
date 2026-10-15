# Safe Route AI — AI-Powered Safety Navigation App

> **“Reach safely, not just quickly.”**

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/AI%20Microservice-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-336791?logo=postgresql&logoColor=white)](https://postgis.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

Conventional navigation applications (Google Maps, Apple Maps) optimize exclusively for travel time and distance. For women, students, night-shift employees, and tourists walking in unfamiliar urban areas, the fastest shortcut often leads through pitch-dark alleys, unmonitored service lanes, or crime-dense zones.

**Safe Route AI** is a complete, production-ready full-stack navigation platform that calculates a transparent **Safety Score (0–100)** for every route option. It analyzes:
- **Street Illumination:** Municipal lighting coverage and dark spot detection.
- **Incident Density:** Crowdsourced and historical reports of harassment, theft, and accidents.
- **Emergency Proximity:** Walking distance to 24/7 police stations, emergency hospital units, and verified safe havens.
- **Pedestrian Activity:** Time-of-day crowd density and commercial storefront activity.
- **Time-of-Day Multipliers:** Dynamic risk penalties for travel between 9:00 PM and 5:00 AM.

---

## 🚀 Key Features

### 1. Multi-Route Generation & Comparison
- **Safest Route (Recommended - Green):** Prioritizes well-lit, commercial avenues with high footfall and active police presence.
- **Balanced Route (Amber):** Optimal compromise between travel time and safety.
- **Fastest Route (Red / Orange):** Shortest distance; highlights specific caution stretches (e.g. unlit alleys).

### 2. Explainable AI (XAI) Safety Engine
- Clear, calming, and transparent reasons for every score (e.g., *“This route is 12% longer, but follows 85% illuminated pavements and stays within 350m of Central Police Post”*).
- **Worst-Segment Bottleneck Penalty:** Prevents dangerous alleys from being masked by a high average score.
- **Never claims 100% safety:** Transparent data confidence indicator (*High / Moderate / Limited*).

### 3. One-Tap Emergency SOS Mode
- Prominent SOS trigger with a **3-second abort countdown** to avoid false alarms.
- Instant SMS/WhatsApp dispatch of live GPS tracking URL to configured emergency contacts.
- Real-time directory and one-click dialer for **112 (National Emergency Helpline)**, nearest police station, and nearest hospital.

### 4. Live Turn-by-Turn Guidance & Hazard Alerts
- Real-time simulated navigation with step-by-step guidance and safety tags.
- Proactive floating warning toasts when within 150m of a known caution zone, with a one-click **"Switch to Safer Detour"** option.
- Live GPS trip sharing with unique cryptographic tracking tokens.

### 5. Community Safety Heatmap & Anonymous Reporting
- Color-coded interactive heatmap with category filters (poor lighting, harassment, road construction, stray animals, police presence).
- Anti-spam & duplicate prevention logic (60m radius / 10-minute throttle).
- Anonymous reporting by default for complete privacy.

### 6. Conversational AI Safety Assistant
- Ask natural questions: *“Is this area safe at 10:30 PM?”* or *“Which route has more police booths?”*
- Synthesizes geospatial data, municipal lighting, and nearby safe havens into actionable advice.

---

## 🏗️ System Architecture

```
safe-route-ai/
├── frontend/             # React 18 + Vite + Tailwind CSS + Leaflet Maps
│   ├── src/
│   │   ├── components/   # Navbar, MapComponent, SafetyScoreCard, SosModal, ReportModal, etc.
│   │   ├── pages/        # Landing, Auth, Dashboard, Plan, Navigate, SafetyMap, Profile, Admin
│   │   ├── context/      # AuthContext, ThemeContext, TripContext
│   │   ├── services/     # Axios API client
│   │   └── index.css     # Tailwind styling & Leaflet map theme
│   └── package.json
├── backend/              # Node.js + Express REST API Gateway
│   ├── src/
│   │   ├── config/       # PostgreSQL connection & portable in-memory failover
│   │   ├── controllers/  # Auth, Routes, Safety, SOS, AI, Admin controllers
│   │   ├── middleware/   # JWT auth guard, Role-based control, Error handlers
│   │   ├── services/     # Route geometry, Embedded risk algorithm, SOS dispatcher
│   │   └── server.js     # Express server setup
│   └── package.json
├── ai-engine/            # Python FastAPI Microservice
│   ├── main.py           # FastAPI endpoints (/score-route, /ask-ai)
│   ├── risk_model.py     # Multi-factor explainable risk formula
│   ├── route_scorer.py   # Waypoint sampling & bottleneck calculation
│   ├── data_pipeline.py  # Spatial indexing & Haversine distance
│   └── requirements.txt
├── database/
│   ├── schema.sql        # PostgreSQL with PostGIS extension & spatial indexes
│   └── seed_data.sql     # Realistic demo seed data (Delhi Central Hub corridor)
├── docs/
│   ├── prd.md            # Product Requirements Document
│   ├── architecture.md   # Mathematical algorithm & system architecture
│   ├── api.md            # REST API specification with sample JSON
│   ├── database.md       # Data dictionary & PostGIS spatial queries
│   ├── deployment.md     # Production deployment on Vercel, Render, Supabase
│   ├── test_cases.md     # Test suite & E2E verification checklist
│   └── pitch_deck.md     # 10-Slide presentation script for demo/hackathons
├── .env.example
└── README.md
```

---

## ⚡ Quick Start Guide (Run in 2 Minutes)

Safe Route AI is designed with **zero external dependency friction**. The backend includes an automatic portable in-memory failover preloaded with realistic demo data, so you can test immediately without configuring PostgreSQL!

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+) *[Optional for AI Microservice]*

---

### Step 1: Start the Backend Server

```bash
cd backend
npm install
npm start
```
> Server runs on `http://localhost:5000`.  
> Health check: `http://localhost:5000/health`.

---

### Step 2: Start the Frontend Application

```bash
cd frontend
npm install
npm run dev
```
> App runs on `http://localhost:5173`. Open your browser to begin navigating!

---

### Step 3 (Optional): Start the Python AI Microservice

```bash
cd ai-engine
pip install -r requirements.txt
python main.py
```
> Microservice runs on `http://localhost:8000`.  
> *(Note: If the Python engine is not running, the Node.js backend automatically uses its built-in JavaScript risk algorithm seamlessly!)*

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Regular User** | `ananya@saferoute.ai` | `password123` | Route Planning, SOS, Profile, Trips |
| **Moderator** | `rahul@saferoute.ai` | `password123` | Safety Map, Community Incident Feed |
| **Admin** | `admin@saferoute.ai` | `password123` | Full Admin Dashboard & Moderation Table |

*(Tip: You can also click the one-touch demo login buttons on the Sign-In page to log in instantly without typing!)*

---

## 📊 Safety Score Formula Summary

$$\text{Safety Score} = \text{clamp}\Big(75 + \Delta\text{Light} + \Delta\text{Road} + \Delta\text{Police} + \Delta\text{CCTV} - \Omega_{\text{Incidents}} - \Omega_{\text{RiskZones}},\ 8,\ 95\Big)$$

$$\text{Route Score} = 0.60 \times (\text{Average Segment Score}) + 0.40 \times (\text{Worst Bottleneck Score})$$

---

## 🛡️ Responsible AI & Privacy Principles

1. **Guidance, Not Guarantee:** Safe Route AI provides real-time situational guidance based on community and municipal data. It never claims 100% immunity from risk.
2. **Privacy First:** Device GPS coordinates are never stored continuously; only active trip points and SOS logs are processed.
3. **Anonymous Reporting:** Community incident submissions are anonymous by default.
4. **Anti-Spam Throttling:** Submissions within 60m of an existing report are consolidated to prevent false fear-mongering.

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.
