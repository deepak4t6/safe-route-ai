# Safe Route AI — Product Requirements Document (PRD)

**Project Name:** Safe Route AI  
**Tagline:** “Reach safely, not just quickly.”  
**Target Delivery:** Production-ready Web & PWA  
**Document Version:** 1.0.0  

---

## 1. Executive Summary

Conventional mapping and navigation applications (Google Maps, Apple Maps, Waze) optimize almost exclusively for the shortest distance or lowest estimated time of arrival (ETA). However, for millions of women, students, late-night workers, elderly individuals, and pedestrians traversing unfamiliar urban corridors, the fastest route often cuts through unlit alleys, deserted service lanes, or high-incident zones.

**Safe Route AI** redefines urban navigation by placing personal safety at the center of the routing algorithm. By integrating real-time community incident reports, municipal streetlight infrastructure, police and emergency medical proximity, historical incident density, and time-of-day risk multipliers, Safe Route AI calculates a transparent **Safety Score (0–100)** for every route option.

---

## 2. Problem Statement

1. **Blind Speed Optimization:** Existing navigation tools route pedestrians through dark, deserted shortcuts just to save 2 minutes.
2. **Lack of Nighttime Context:** Roads that are bustling with footfall at 2:00 PM become isolated and risky after 10:00 PM.
3. **Emergency Disconnection:** In critical situations, users must navigate separate apps to find police booths, message family, or dial 112.
4. **Opaque Safety Guarantees:** Users are given binary or scary warnings rather than explainable, actionable recommendations.

---

## 3. Product Vision & Value Proposition

- **Core Vision:** Empower every citizen to walk, cycle, and commute with confidence through explainable safety navigation.
- **Value Proposition:**
  - **3 Distinct Route Alternatives:** Safest Route (Recommended), Balanced Route, and Fastest Route.
  - **Explainable AI (XAI):** Clear breakdown of why a route is safe (e.g., “+15% longer, but 85% illuminated with police post within 350m”).
  - **One-Tap Emergency SOS:** Instant dispatch of live GPS tracking to trusted contacts and proximity mapping to nearest police stations and hospitals.
  - **Crowdsourced Safety Heatmap:** Citizen-reported dark spots, harassment incidents, road hazards, and verified safe havens.

---

## 4. User Personas

| Persona | Demographics | Core Need | Key Feature Used |
| :--- | :--- | :--- | :--- |
| **Ananya (Student)** | 21, University Student | Returning home from library after 9:30 PM | Safest walking route avoiding dark alleys |
| **Pooja (Night Shift Worker)** | 28, BPO / Hospital staff | Commuting between 11 PM and 4 AM | Live navigation with risk alerts & SOS |
| **Vikram (Father)** | 52, Parent | Tracking child's late-night transit | Real-time live trip share link |
| **Arjun (Cyclist / Runner)** | 24, Fitness enthusiast | Early morning routes in low light | Road lighting & stray dog hazard tags |

---

## 5. Functional Requirements (FR)

### 5.1 Authentication & Profile
- **FR-1.1:** Email & password authentication with bcrypt hashing (10 rounds) and JWT token generation.
- **FR-1.2:** Role-based access control: `user`, `moderator`, and `admin`.
- **FR-1.3:** User profile management: travel mode selection (walking, cycling, driving), and custom safety preferences (avoid dark roads, avoid isolated lanes, prefer CCTV corridors, prefer main roads).
- **FR-1.4:** Emergency contacts directory: Add, update, and remove trusted contacts with automated SMS/WhatsApp alerts during SOS triggers.

### 5.2 Multi-Route Planning & AI Scoring
- **FR-2.1:** Geocoding and route calculation generating 3 alternative paths: Fastest, Safest, and Balanced.
- **FR-2.2:** Multi-factor safety engine calculating an aggregate 0–100 score for each route.
- **FR-2.3:** Risk level classification:
  - `80 – 100`: **Safe** (Green)
  - `60 – 79`: **Moderate Risk** (Amber)
  - `40 – 59`: **Exercise Caution** (Orange)
  - `0 – 39`: **High Risk Zone** (Red)
- **FR-2.4:** Worst-segment bottleneck weighting: Route score incorporates the lowest scoring segment to prevent concealing dangerous blind spots in an otherwise safe average.

### 5.3 Live Turn-by-Turn Navigation
- **FR-3.1:** Step-by-step guidance instructions with distance countdown and safety tags (e.g., “Well-lit commercial pavement”).
- **FR-3.2:** Real-time distance and ETA countdown based on travel mode speed.
- **FR-3.3:** Upcoming caution-zone warning toasts when within 200m of a flagged risk zone, with a one-click safer detour option.
- **FR-3.4:** Live GPS trip sharing with unique cryptographic tracking tokens.

### 5.4 One-Tap Emergency SOS
- **FR-4.1:** High-visibility SOS button accessible within one tap on all screens.
- **FR-4.2:** 3-second abort countdown with cancel button to prevent accidental triggers.
- **FR-4.3:** Immediate geolocation broadcast to emergency contacts with battery percentage and live link.
- **FR-4.4:** Direct one-click dialer for National Emergency Helpline `112`.
- **FR-4.5:** Proximity display of nearest police station and 24/7 emergency hospital.

### 5.5 Safety Heatmap & Community Incident Reporting
- **FR-5.1:** Interactive color-coded heatmap with category filters (poor lighting, harassment, theft, construction, stray dogs, police presence, safe havens).
- **FR-5.2:** Anonymous reporting toggle by default for user privacy.
- **FR-5.3:** Anti-spam / duplicate prevention logic: Reject duplicate reports within 60m radius submitted within 10 minutes.
- **FR-5.4:** Community upvoting / verification feed and moderator review dashboard.

### 5.6 Conversational AI Assistant
- **FR-6.1:** Conversational Q&A modal answering questions like: “Is Connaught Place safe at 10:30 PM?”
- **FR-6.2:** Contextual answers synthesizing lighting data, risk zones, nearest police booths, and actionable safety tips.

---

## 6. Non-Functional Requirements (NFR)

1. **Performance:** Route generation and safety scoring must respond in under 1.5 seconds.
2. **Reliability:** Built-in fallback scoring mechanisms ensure 100% route generation uptime even if external microservices are offline.
3. **Privacy by Design:** Exact device GPS coordinates are never stored continuously in the database; only active trip waypoints and emergency SOS events are logged.
4. **Mobile Responsiveness:** Mobile-first responsive UI with touch targets $\ge 48\text{px}$ and PWA compliance.
5. **High Contrast Accessibility:** WCAG 2.1 AA compliant color contrast ratios for dark and light themes.
