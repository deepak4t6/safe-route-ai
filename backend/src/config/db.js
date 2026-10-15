const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool = null;
let usePostgres = false;

// Default demo seed in-memory store for instant zero-dependency testing
const inMemoryStore = {
  users: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Ananya Sharma',
      email: 'ananya@saferoute.ai',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+919876543210',
      role: 'user',
      preferred_mode: 'walking',
      safety_pref_avoid_dark: true,
      safety_pref_avoid_isolated: true,
      safety_pref_prefer_cctv: true,
      safety_pref_prefer_main_roads: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Rahul Verma',
      email: 'rahul@saferoute.ai',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+919811223344',
      role: 'moderator',
      preferred_mode: 'cycling',
      created_at: new Date().toISOString()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      name: 'Dr. Priya Mehta (Admin)',
      email: 'admin@saferoute.ai',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+919800000000',
      role: 'admin',
      preferred_mode: 'driving',
      created_at: new Date().toISOString()
    }
  ],
  emergency_contacts: [
    {
      id: 'ec-001',
      user_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Rajesh Sharma (Father)',
      phone: '+919876500001',
      relationship: 'Parent',
      notify_on_trip_start: true,
      notify_on_sos: true
    },
    {
      id: 'ec-002',
      user_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Sneha Kapoor (Friend)',
      phone: '+919876500002',
      relationship: 'Friend',
      notify_on_trip_start: false,
      notify_on_sos: true
    }
  ],
  safe_places: [
    {
      id: 'sp-1',
      name: 'Central District Police Station',
      category: 'police_station',
      latitude: 28.6328,
      longitude: 77.2195,
      address: 'Outer Circle, Connaught Place',
      phone: '011-23412233',
      open_hours: '24/7',
      is_verified: true
    },
    {
      id: 'sp-2',
      name: 'Metro Police Post & Helpdesk',
      category: 'police_station',
      latitude: 28.6360,
      longitude: 77.2155,
      address: 'Rajiv Chowk Gate 2',
      phone: '112',
      open_hours: '24/7',
      is_verified: true
    },
    {
      id: 'sp-3',
      name: 'City Care Multi-Specialty Hospital',
      category: 'hospital',
      latitude: 28.6385,
      longitude: 77.2240,
      address: 'Barakhamba Road',
      phone: '011-44556677',
      open_hours: '24/7',
      is_verified: true
    },
    {
      id: 'sp-4',
      name: 'Apollo 24x7 Pharmacy',
      category: 'pharmacy_24x7',
      latitude: 28.6315,
      longitude: 77.2160,
      address: 'Block B, Inner Circle',
      phone: '011-23344556',
      open_hours: '24/7',
      is_verified: true
    },
    {
      id: 'sp-5',
      name: 'Rajiv Chowk Metro Station',
      category: 'metro_station',
      latitude: 28.6329,
      longitude: 77.2195,
      address: 'Radial Road 1',
      phone: '155370',
      open_hours: '05:30 - 23:30',
      is_verified: true
    },
    {
      id: 'sp-6',
      name: '24 Seven Convenience Hub',
      category: 'convenience_store_24x7',
      latitude: 28.6342,
      longitude: 77.2210,
      address: 'Regal Building, CP',
      phone: '011-23719000',
      open_hours: '24/7',
      is_verified: true
    }
  ],
  risk_zones: [
    {
      id: 'rz-1',
      name: 'Old Service Alley (Rear of Block D)',
      latitude: 28.6355,
      longitude: 77.2130,
      radius_meters: 180,
      risk_score: 78.5,
      reason: 'Broken streetlights, blind corners, isolated after 8 PM',
      time_sensitivity: 'night_only'
    },
    {
      id: 'rz-2',
      name: 'Underpass Construction Sector 4',
      latitude: 28.6290,
      longitude: 77.2250,
      radius_meters: 200,
      risk_score: 65.0,
      reason: 'Pedestrian pathway blocked, major ditch',
      time_sensitivity: 'all_day'
    },
    {
      id: 'rz-3',
      name: 'Railway Boundary Backroad',
      latitude: 28.6410,
      longitude: 77.2120,
      radius_meters: 250,
      risk_score: 85.0,
      reason: 'No CCTV, sparse lighting, multiple chain snatching reports',
      time_sensitivity: 'night_only'
    }
  ],
  safety_reports: [
    {
      id: 'rep-1',
      user_id: 'a0000000-0000-0000-0000-000000000001',
      category: 'poor_lighting',
      description: 'Four consecutive streetlights are non-functional on radial road 4. Very dark.',
      latitude: 28.6348,
      longitude: 77.2142,
      severity: 4,
      status: 'verified',
      is_anonymous: false,
      upvotes: 14,
      downvotes: 1,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'rep-2',
      user_id: null,
      category: 'stray_dogs',
      description: 'Pack of aggressive stray dogs near garbage dump behind market lane.',
      latitude: 28.6370,
      longitude: 77.2165,
      severity: 3,
      status: 'verified',
      is_anonymous: true,
      upvotes: 8,
      downvotes: 0,
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'rep-3',
      user_id: null,
      category: 'harassment',
      description: 'Catcalling and loitering reported near deserted bus stop after 9:30 PM.',
      latitude: 28.6350,
      longitude: 77.2135,
      severity: 5,
      status: 'verified',
      is_anonymous: true,
      upvotes: 22,
      downvotes: 2,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString()
    },
    {
      id: 'rep-4',
      user_id: 'a0000000-0000-0000-0000-000000000002',
      category: 'police_presence',
      description: 'Active PCR van stationed at Rajiv Chowk Radial 3 corner. Safe point.',
      latitude: 28.6335,
      longitude: 77.2185,
      severity: 1,
      status: 'verified',
      is_anonymous: false,
      upvotes: 19,
      downvotes: 0,
      created_at: new Date(Date.now() - 3 * 3600000).toISOString()
    },
    {
      id: 'rep-5',
      user_id: 'a0000000-0000-0000-0000-000000000001',
      category: 'construction',
      description: 'Pavement dug up for fiber cable installation. Pedestrians forced onto motor lane.',
      latitude: 28.6305,
      longitude: 77.2230,
      severity: 3,
      status: 'pending',
      is_anonymous: false,
      upvotes: 5,
      downvotes: 1,
      created_at: new Date(Date.now() - 6 * 3600000).toISOString()
    }
  ],
  trips: [],
  routes: [],
  sos_logs: []
};

// Initialize DB
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    usePostgres = true;
    console.log('[DB] PostgreSQL pool configured with PostGIS connection');
  } catch (err) {
    console.warn('[DB] Could not connect to PostgreSQL, falling back to portable in-memory store:', err.message);
    usePostgres = false;
  }
} else {
  console.log('[DB] No DATABASE_URL specified. Running in self-contained portable mode (preloaded with realistic demo data).');
}

const query = async (text, params) => {
  if (usePostgres && pool) {
    return pool.query(text, params);
  }
  return null;
};

module.exports = {
  pool,
  query,
  usePostgres,
  inMemoryStore
};
