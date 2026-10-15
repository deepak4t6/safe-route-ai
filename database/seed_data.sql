-- ============================================================================
-- Safe Route AI — Demo Seed Data
-- Standard Metro Area Coordinates (e.g. Connaught Place & Central Hub, Delhi Demo)
-- Lat: 28.6300 to 28.6450, Lng: 77.2100 to 77.2300
-- ============================================================================

-- 1. Demo Users (Passwords: 'password123' bcrypt hash: $2a$10$wT9tUjWq9R2U3j3BqCceE.YlGvG5qf519o6yEw.L5Zg1N/UfqeQ0a)
INSERT INTO users (id, name, email, password_hash, phone, role, preferred_mode) VALUES
('a0000000-0000-0000-0000-000000000001', 'Ananya Sharma', 'ananya@saferoute.ai', '$2a$10$wT9tUjWq9R2U3j3BqCceE.YlGvG5qf519o6yEw.L5Zg1N/UfqeQ0a', '+919876543210', 'user', 'walking'),
('a0000000-0000-0000-0000-000000000002', 'Rahul Verma', 'rahul@saferoute.ai', '$2a$10$wT9tUjWq9R2U3j3BqCceE.YlGvG5qf519o6yEw.L5Zg1N/UfqeQ0a', '+919811223344', 'moderator', 'cycling'),
('a0000000-0000-0000-0000-000000000003', 'Dr. Priya Mehta (Admin)', 'admin@saferoute.ai', '$2a$10$wT9tUjWq9R2U3j3BqCceE.YlGvG5qf519o6yEw.L5Zg1N/UfqeQ0a', '+919800000000', 'admin', 'driving')
ON CONFLICT (email) DO NOTHING;

-- 2. Emergency Contacts for Demo User
INSERT INTO emergency_contacts (user_id, name, phone, relationship, notify_on_trip_start, notify_on_sos) VALUES
('a0000000-0000-0000-0000-000000000001', 'Rajesh Sharma (Father)', '+919876500001', 'Parent', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000001', 'Sneha Kapoor (Friend)', '+919876500002', 'Friend', FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- 3. Verified Safe Places (Police Stations, Hospitals, 24/7 Stores, Metro Stations)
INSERT INTO safe_places (id, name, category, latitude, longitude, address, phone, open_hours, is_verified) VALUES
('b0000000-0000-0000-0000-000000000001', 'Central District Police Station', 'police_station', 28.6328, 77.2195, 'Outer Circle, Connaught Place', '011-23412233', '24/7', TRUE),
('b0000000-0000-0000-0000-000000000002', 'Metro Police Post & Helpdesk', 'police_station', 28.6360, 77.2155, 'Rajiv Chowk Gate 2', '112', '24/7', TRUE),
('b0000000-0000-0000-0000-000000000003', 'City Care Multi-Specialty Hospital', 'hospital', 28.6385, 77.2240, 'Barakhamba Road', '011-44556677', '24/7', TRUE),
('b0000000-0000-0000-0000-000000000004', 'Apollo 24x7 Pharmacy', 'pharmacy_24x7', 28.6315, 77.2160, 'Block B, Inner Circle', '011-23344556', '24/7', TRUE),
('b0000000-0000-0000-0000-000000000005', 'Rajiv Chowk Metro Station (Central)', 'metro_station', 28.6329, 77.2195, 'Radial Road 1', '155370', '05:30 - 23:30', TRUE),
('b0000000-0000-0000-0000-000000000006', '24 Seven Convenience Hub', 'convenience_store_24x7', 28.6342, 77.2210, 'Regal Building, CP', '011-23719000', '24/7', TRUE),
('b0000000-0000-0000-0000-000000000007', 'St. Stephen Emergency Medical Unit', 'hospital', 28.6430, 77.2180, 'Janpath Lane', '011-23966021', '24/7', TRUE)
ON CONFLICT DO NOTHING;

-- 4. Known Risk Zones (Low light, isolated service lanes, construction hazards)
INSERT INTO risk_zones (id, name, latitude, longitude, radius_meters, risk_score, reason, time_sensitivity) VALUES
('c0000000-0000-0000-0000-000000000001', 'Old Service Alley (Rear of Block D)', 28.6355, 77.2130, 180, 78.5, 'Broken streetlights, blind corners, isolated after 8 PM', 'night_only'),
('c0000000-0000-0000-0000-000000000002', 'Underpass Construction Sector 4', 28.6290, 77.2250, 200, 65.0, 'Major trench digging, pedestrian pathway blocked, low foot traffic', 'all_day'),
('c0000000-0000-0000-0000-000000000003', 'Railway Boundary Backroad', 28.6410, 77.2120, 250, 85.0, 'No CCTV, sparse lighting, multiple evening chain snatching incidents', 'night_only')
ON CONFLICT DO NOTHING;

-- 5. Community Safety Reports (Sample data)
INSERT INTO safety_reports (category, description, latitude, longitude, severity, status, is_anonymous, upvotes, downvotes, incident_time) VALUES
('poor_lighting', 'Four consecutive streetlights are non-functional on radial road 4. Very dark.', 28.6348, 77.2142, 4, 'verified', FALSE, 14, 1, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('stray_dogs', 'Pack of aggressive stray dogs near garbage dump behind market lane.', 28.6370, 77.2165, 3, 'verified', TRUE, 8, 0, CURRENT_TIMESTAMP - INTERVAL '1 day'),
('harassment', 'Catcalling and loitering reported near deserted bus stop after 9:30 PM.', 28.6350, 77.2135, 5, 'verified', TRUE, 22, 2, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
('police_presence', 'Active PCR van stationed at Rajiv Chowk Radial 3 corner. Safe point.', 28.6335, 77.2185, 1, 'verified', FALSE, 19, 0, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
('construction', 'Pavement dug up for fiber cable installation. Pedestrians forced into motor lane.', 28.6305, 77.2230, 3, 'pending', FALSE, 5, 1, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
('safe_haven', 'Women-friendly 24/7 cafe with security guard on duty.', 28.6320, 77.2170, 1, 'verified', FALSE, 31, 0, CURRENT_TIMESTAMP - INTERVAL '5 days');
