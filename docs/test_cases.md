# Safe Route AI — Test Plan & Test Cases

Comprehensive test specifications covering AI risk scoring, REST APIs, and frontend user flows.

---

## 1. AI Risk Engine Unit Tests

| Test ID | Test Scenario | Input Conditions | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AI-01** | Day vs Night Lighting Penalty | Segment with `lighting_level: 2.0`, evaluated at 14:00 vs 23:00 | Night evaluation receives $1.8\times$ higher lighting penalty; score drops $\ge 20$ pts | PASS |
| **TC-AI-02** | Score Boundary Clamping | Baseline high bonuses or extreme penalties | Final score strictly clamped between $8.0$ and $95.0$ (never $100\%$) | PASS |
| **TC-AI-03** | Police Proximity Bonus | Coordinate within $350\text{m}$ of police station | $+12.0$ points bonus awarded; explanation includes "Police post within 350m" | PASS |
| **TC-AI-04** | Worst-Segment Bottleneck | Route with 9 safe waypoints ($90$ pts) and 1 alley ($30$ pts) | Route score $\le 66$ pts (not simple average of $84$); flags risky bottleneck | PASS |
| **TC-AI-05** | Low Data Availability Handling | Query in sparse rural sector | `confidence: 0.55`, `confidence_label: "Limited safety data available"` | PASS |

---

## 2. Backend API Integration Tests

| Test ID | Endpoint | Test Description | Expected Status | Validation Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **TC-API-01** | `POST /api/auth/register` | New user registration | 201 Created | Returns JWT token and sanitized user object (no `password_hash`) |
| **TC-API-02** | `POST /api/auth/login` | Login with invalid password | 401 Unauthorized | Returns `success: false, message: "Invalid email or password"` |
| **TC-API-03** | `POST /api/routes/safe-route` | Route calculation with coordinates | 200 OK | Returns array of 3 routes (`safest`, `balanced`, `fastest`) with geometries & scores |
| **TC-API-04** | `POST /api/safety/report` | Duplicate report abuse prevention | 429 Too Many Requests | Rejects duplicate category submitted within $60\text{m}$ inside 10 minutes |
| **TC-API-05** | `POST /api/sos/trigger` | Emergency SOS activation | 201 Created | Dispatches alerts, generates live tracking link, returns nearest police & hospital |
| **TC-API-06** | `PATCH /api/admin/reports/:id` | Moderator verifies report | 200 OK | Updates status to `verified`; changes reflect immediately on heatmap |

---

## 3. Frontend End-to-End (E2E) Test Cases

| Test ID | User Flow | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-FE-01** | One-Tap SOS with Countdown | Tap Red "SOS" button -> wait 3 seconds | Abort countdown counts 3 -> 2 -> 1 -> triggers SOS modal with direct call 112 button & nearest police details |
| **TC-FE-02** | SOS False Alarm Cancellation | Tap "SOS" button -> Tap "Cancel (False Alarm)" within 3s | Modal closes cleanly without triggering emergency dispatch |
| **TC-FE-03** | Interactive Route Switching | In Route Planner, click "Fastest Route" card | Map polyline switches focus to orange route; SafetyScoreCard updates to show caution breakdown |
| **TC-FE-04** | Live Navigation Simulation | Click "Start Navigation" on Safest route | App enters turn-by-turn guidance; live marker moves along coordinates; distance/ETA updates |
| **TC-FE-05** | Anonymous Incident Reporting | Open Report modal -> Check "Anonymous" -> Submit | Report appears on community feed without user's name |
| **TC-FE-06** | Dark/Light Mode Toggle | Click Sun/Moon button on navbar | Seamless toggle of Tailwind `dark` class on root HTML document |
