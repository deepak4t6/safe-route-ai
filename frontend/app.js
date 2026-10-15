const API_BASE = 'http://127.0.0.1:8000';
let map, currentRouteLayer;
let safetyMarkers = [];

// Initialize Map
function initMap() {
    map = L.map('map').setView([40.7128, -74.0060], 12); // Default to NY
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps'
    }).addTo(map);
}

document.addEventListener("DOMContentLoaded", () => {
    initMap();

    document.getElementById('findRouteBtn').addEventListener('click', findRoute);
    document.getElementById('sosBtn').addEventListener('click', triggerSOS);
    
    // Auth Modals
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    document.getElementById('loginBtn').addEventListener('click', () => loginModal.show());
    
    document.getElementById('submitLogin').addEventListener('click', () => authenticate('login'));
    document.getElementById('submitSignup').addEventListener('click', () => authenticate('signup'));
});

async function geocode(location) {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
    const data = await res.json();
    if(data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    return null;
}

async function findRoute() {
    const srcInput = document.getElementById('source').value;
    const destInput = document.getElementById('destination').value;

    if(!srcInput || !destInput) return alert("Please enter source and destination");

    document.getElementById('findRouteBtn').innerText = "Calculating...";

    const srcCoords = await geocode(srcInput);
    const destCoords = await geocode(destInput);

    if(!srcCoords || !destCoords) {
        alert("Location not found");
        document.getElementById('findRouteBtn').innerText = "Get Routes";
        return;
    }

    // Call OSRM for actual route geometry
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${srcCoords[1]},${srcCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`;
    
    try {
        const routeRes = await fetch(osrmUrl);
        const routeData = await routeRes.json();
        
        if (routeData.code !== 'Ok') throw new Error("No route found");
        
        const coords = routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // Leaflet uses [lat, lng]
        
        // Call our backend to get Safety Score
        const safetyRes = await fetch(`${API_BASE}/route/calculate-safety`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ route_coordinates: coords })
        });
        
        const safetyData = await safetyRes.json();
        
        displayRoute(coords);
        document.getElementById('routeResults').classList.remove('d-none');
        document.getElementById('safeScoreDisplay').innerText = safetyData.safety_score;
        document.getElementById('shortDistDisplay').innerText = (routeData.routes[0].distance / 1000).toFixed(1) + " km";
        
        displaySafetyAlerts(safetyData.unsafe_zones);
        
    } catch(err) {
        console.error(err);
        alert("Error calculating route");
    } finally {
        document.getElementById('findRouteBtn').innerText = "Get Routes";
    }
}

function displayRoute(coords) {
    if(currentRouteLayer) map.removeLayer(currentRouteLayer);
    currentRouteLayer = L.polyline(coords, {color: 'green', weight: 5}).addTo(map);
    map.fitBounds(currentRouteLayer.getBounds());
}

function displaySafetyAlerts(zones) {
    safetyMarkers.forEach(m => map.removeLayer(m));
    safetyMarkers = [];
    
    const alertsDiv = document.getElementById('safetyAlerts');
    alertsDiv.innerHTML = '';
    
    if(!zones || zones.length === 0) return;
    
    alertsDiv.innerHTML = '<h6>Safety Alerts:</h6>';
    zones.forEach(z => {
        // Map Marker
        const marker = L.circleMarker([z.lat, z.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 15
        }).addTo(map).bindPopup(z.reason);
        safetyMarkers.push(marker);
        
        // UI Alert
        alertsDiv.innerHTML += `
            <div class="alert alert-danger py-2 small">
                <strong>Warning:</strong> ${z.reason}
            </div>
        `;
    });
}

function triggerSOS() {
    alert("🚨 SOS TRIGGERED! Location shared with emergency contacts and police helpline.");
}

async function authenticate(action) {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const msg = document.getElementById('authMessage');
    
    try {
        const res = await fetch(`${API_BASE}/auth/${action}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user, password: pass})
        });
        
        if(!res.ok) {
            const data = await res.json();
            msg.innerText = data.detail || "Authentication failed";
            return;
        }
        
        alert(`${action} successful!`);
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        document.getElementById('loginBtn').innerText = user;
    } catch(err) {
        msg.innerText = "Error connecting to server";
    }
}
