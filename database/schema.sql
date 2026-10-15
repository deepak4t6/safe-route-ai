-- ============================================================================
-- Safe Route AI — Database Schema
-- PostgreSQL with PostGIS Geospatial Extension
-- ============================================================================

-- Enable PostGIS extension for geospatial indexing and distance calculation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE travel_mode AS ENUM ('walking', 'cycling', 'driving');
CREATE TYPE route_type AS ENUM ('fastest', 'safest', 'balanced');
CREATE TYPE risk_level AS ENUM ('safe', 'moderate', 'caution', 'risky');
CREATE TYPE report_category AS ENUM (
    'poor_lighting',
    'harassment',
    'theft',
    'road_accident',
    'construction',
    'stray_dogs',
    'unsafe_crowd',
    'police_presence',
    'safe_haven'
);
CREATE TYPE report_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE safe_place_category AS ENUM (
    'police_station',
    'hospital',
    'pharmacy_24x7',
    'convenience_store_24x7',
    'metro_station',
    'verified_safe_zone'
);
CREATE TYPE trip_status AS ENUM ('active', 'completed', 'sos_triggered', 'cancelled');

-- ----------------------------------------------------------------------------
-- 2. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'user',
    preferred_mode travel_mode DEFAULT 'walking',
    safety_pref_avoid_dark BOOLEAN DEFAULT TRUE,
    safety_pref_avoid_isolated BOOLEAN DEFAULT TRUE,
    safety_pref_prefer_cctv BOOLEAN DEFAULT TRUE,
    safety_pref_prefer_main_roads BOOLEAN DEFAULT TRUE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 3. EMERGENCY CONTACTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(60) DEFAULT 'Family',
    notify_on_trip_start BOOLEAN DEFAULT TRUE,
    notify_on_sos BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- ----------------------------------------------------------------------------
-- 4. TRIPS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source_name VARCHAR(255),
    source_lat NUMERIC(10, 7) NOT NULL,
    source_lng NUMERIC(10, 7) NOT NULL,
    destination_name VARCHAR(255),
    destination_lat NUMERIC(10, 7) NOT NULL,
    destination_lng NUMERIC(10, 7) NOT NULL,
    travel_mode travel_mode DEFAULT 'walking',
    status trip_status DEFAULT 'active',
    selected_route_id UUID,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    current_lat NUMERIC(10, 7),
    current_lng NUMERIC(10, 7),
    share_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_share_token ON trips(share_token);

-- ----------------------------------------------------------------------------
-- 5. ROUTES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    route_type route_type NOT NULL,
    geometry JSONB NOT NULL, -- Array of [lat, lng] or GeoJSON LineString
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    safety_score NUMERIC(5, 2) NOT NULL CHECK (safety_score >= 0 AND safety_score <= 100),
    risk_level risk_level NOT NULL,
    confidence_level NUMERIC(3, 2) DEFAULT 0.85,
    explanation JSONB NOT NULL, -- structured list of reasons
    factors JSONB, -- breakdown of lighting, crime, crowd, police score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routes_trip_id ON routes(trip_id);

-- ----------------------------------------------------------------------------
-- 6. COMMUNITY SAFETY REPORTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE safety_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- nullable for anonymous
    category report_category NOT NULL,
    description TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom geometry(Point, 4326),
    severity INTEGER DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
    status report_status DEFAULT 'pending',
    is_anonymous BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    photo_url VARCHAR(500),
    incident_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safety_reports_geom ON safety_reports USING GIST(geom);
CREATE INDEX idx_safety_reports_status ON safety_reports(status);
CREATE INDEX idx_safety_reports_category ON safety_reports(category);

-- ----------------------------------------------------------------------------
-- 7. SAFE PLACES TABLE (Police, Hospitals, 24/7 Stores)
-- ----------------------------------------------------------------------------
CREATE TABLE safe_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category safe_place_category NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom geometry(Point, 4326),
    address TEXT,
    phone VARCHAR(30),
    open_hours VARCHAR(100) DEFAULT '24/7',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safe_places_geom ON safe_places USING GIST(geom);
CREATE INDEX idx_safe_places_category ON safe_places(category);

-- ----------------------------------------------------------------------------
-- 8. RISK ZONES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE risk_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom geometry(Point, 4326),
    radius_meters INTEGER DEFAULT 150,
    risk_score NUMERIC(5, 2) NOT NULL, -- 0 to 100 risk weight
    reason TEXT NOT NULL,
    time_sensitivity VARCHAR(50) DEFAULT 'night_only', -- all_day, night_only, peak_hours
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_zones_geom ON risk_zones USING GIST(geom);

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'safety_alert', -- safety_alert, sos, trip_update, system
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ----------------------------------------------------------------------------
-- 10. SOS LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE sos_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    battery_percentage INTEGER,
    status VARCHAR(50) DEFAULT 'triggered', -- triggered, acknowledged, resolved, false_alarm
    notified_contacts_count INTEGER DEFAULT 0,
    nearest_police_distance_meters INTEGER,
    nearest_hospital_distance_meters INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sos_logs_user_id ON sos_logs(user_id);

-- ----------------------------------------------------------------------------
-- TRIGGERS TO AUTO-POPULATE POSTGIS GEOMETRY POINTS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_geom_point()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_safety_reports_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON safety_reports
FOR EACH ROW EXECUTE FUNCTION update_geom_point();

CREATE TRIGGER trg_safe_places_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON safe_places
FOR EACH ROW EXECUTE FUNCTION update_geom_point();

CREATE TRIGGER trg_risk_zones_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON risk_zones
FOR EACH ROW EXECUTE FUNCTION update_geom_point();
