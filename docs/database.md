# Safe Route AI — Database Architecture & PostGIS Guide

Safe Route AI uses **PostgreSQL 15+ with the PostGIS 3+** geospatial extension to perform sub-millisecond geographic distance calculations, bounding-box checks, and spatial joins.

---

## 1. Relational Schema & Data Dictionary

### 1.1 `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Unique user identifier |
| `name` | VARCHAR(120) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Account login email |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash |
| `role` | `user_role` | DEFAULT 'user' | Enum: `user`, `moderator`, `admin` |
| `preferred_mode` | `travel_mode` | DEFAULT 'walking' | Enum: `walking`, `cycling`, `driving` |
| `safety_pref_avoid_dark` | BOOLEAN | DEFAULT TRUE | Route penalty for dark streets |
| `safety_pref_avoid_isolated` | BOOLEAN | DEFAULT TRUE | Penalty for narrow service lanes |

### 1.2 `safety_reports` (Geospatial)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Report identifier |
| `user_id` | UUID | Nullable FK -> users | NULL indicates anonymous report |
| `category` | `report_category`| NOT NULL | Enum: `poor_lighting`, `harassment`, etc. |
| `latitude` | NUMERIC(10, 7) | NOT NULL | WGS-84 Latitude |
| `longitude`| NUMERIC(10, 7) | NOT NULL | WGS-84 Longitude |
| `geom` | geometry(Point, 4326) | GIST Indexed | PostGIS point geometry |
| `severity` | INTEGER | 1 to 5 | Risk level |
| `status` | `report_status` | DEFAULT 'pending' | `pending`, `verified`, `rejected` |

### 1.3 `safe_places` (Police, Hospitals, 24/7 Stores)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Safe place record |
| `name` | VARCHAR(200) | NOT NULL | E.g., 'Central Police Post' |
| `category` | `safe_place_category`| NOT NULL | `police_station`, `hospital`, etc. |
| `geom` | geometry(Point, 4326) | GIST Indexed | Spatial coordinates |
| `open_hours` | VARCHAR(100) | DEFAULT '24/7' | Operational availability |

---

## 2. Essential PostGIS Spatial Queries

### 2.1 Find Verified Safe Havens within 1,000 Meters
```sql
SELECT 
    name,
    category,
    phone,
    ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:user_lng, :user_lat), 4326)::geography) AS distance_meters
FROM safe_places
WHERE ST_DWithin(
    geom::geography,
    ST_SetSRID(ST_MakePoint(:user_lng, :user_lat), 4326)::geography,
    1000
)
ORDER BY distance_meters ASC;
```

### 2.2 Detect if Route Crosses Any Known Risk Zone
```sql
SELECT 
    rz.name,
    rz.risk_score,
    rz.reason
FROM risk_zones rz
WHERE ST_DWithin(
    rz.geom::geography,
    ST_GeomFromGeoJSON(:route_linestring_geojson)::geography,
    rz.radius_meters
);
```

### 2.3 Aggregate Incidents Density Along a Corridor
```sql
SELECT 
    category,
    COUNT(*) as incident_count,
    AVG(severity) as avg_severity
FROM safety_reports
WHERE status = 'verified'
  AND ST_DWithin(
      geom::geography,
      ST_SetSRID(ST_MakePoint(:waypoint_lng, :waypoint_lat), 4326)::geography,
      400
  )
GROUP BY category;
```
