const axios = require('axios');

async function runStep3Tests() {
  console.log('=== STEP 3: REAL MAP & LOCATION FLOW TESTS ===\n');

  // Test 1: Autocomplete Source ('Connaught Place')
  console.log('--- 1. Testing Autocomplete (Source: Connaught Place) ---');
  const res1 = await fetch('http://localhost:5000/api/maps/autocomplete?q=Connaught+Place');
  const json1 = await res1.json();
  console.log('Success:', json1.success, '| Count:', json1.count);
  if (json1.suggestions?.length > 0) {
    console.log('Top Result:', json1.suggestions[0].place_name, '| Coords:', json1.suggestions[0].coordinates);
  }

  // Test 2: Autocomplete Destination ('India Gate')
  console.log('\n--- 2. Testing Autocomplete (Destination: India Gate) ---');
  const res2 = await fetch('http://localhost:5000/api/maps/autocomplete?q=India+Gate');
  const json2 = await res2.json();
  console.log('Success:', json2.success, '| Count:', json2.count);
  if (json2.suggestions?.length > 0) {
    console.log('Top Result:', json2.suggestions[0].place_name, '| Coords:', json2.suggestions[0].coordinates);
  }

  // Test 3: Reverse Geocoding (coordinates to street name)
  console.log('\n--- 3. Testing Reverse Geocode (lat: 28.6129, lng: 77.2295) ---');
  const res3 = await fetch('http://localhost:5000/api/maps/geocode?lat=28.6129&lng=77.2295');
  const json3 = await res3.json();
  console.log('Geocoded Place:', json3.place?.place_name, '| LatLng:', json3.place?.latitude, json3.place?.longitude);

  // Test 4 & 5: Real Road Routing (Connaught Place -> India Gate)
  console.log('\n--- 4 & 5. Testing Real Road Routing (Delhi Corridor: CP to India Gate) ---');
  const routePayloadCPtoIG = {
    sourceLat: 28.6328,
    sourceLng: 77.2195,
    destLat: 28.6129,
    destLng: 77.2295,
    sourceName: 'Connaught Place Central',
    destName: 'India Gate',
    travelMode: 'walking'
  };
  const rRes1 = await fetch('http://localhost:5000/api/routes/safe-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routePayloadCPtoIG)
  });
  const rJson1 = await rRes1.json();
  const routes1 = rJson1.data?.routes || [];
  console.log('Generated Routes Count:', routes1.length);
  routes1.forEach(r => {
    console.log(`Route [${r.type}]: Name='${r.name}', Score=${r.safety_score}, Distance=${r.distance_formatted}, ETA=${r.duration_formatted}, Waypoints=${r.coordinates?.length}`);
  });
  const isStraightLine1 = routes1[0]?.coordinates?.length <= 2;
  console.log('Is Route 1 straight line (<=2 points)?', isStraightLine1, `(Actual points: ${routes1[0]?.coordinates?.length})`);

  // Test 6: Route Change Test (Different Destination: Hauz Khas Village)
  console.log('\n--- 6. Testing Route Difference when Destination Changes (CP to Hauz Khas) ---');
  const routePayloadCPtoHK = {
    sourceLat: 28.6328,
    sourceLng: 77.2195,
    destLat: 28.5534,
    destLng: 77.1945,
    sourceName: 'Connaught Place',
    destName: 'Hauz Khas Village',
    travelMode: 'walking'
  };
  const rRes2 = await fetch('http://localhost:5000/api/routes/safe-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routePayloadCPtoHK)
  });
  const rJson2 = await rRes2.json();
  const routes2 = rJson2.data?.routes || [];
  console.log(`CP -> India Gate Distance: ${routes1[0]?.distance_formatted} | CP -> Hauz Khas Distance: ${routes2[0]?.distance_formatted}`);
  console.log(`CP -> India Gate ETA: ${routes1[0]?.duration_formatted} | CP -> Hauz Khas ETA: ${routes2[0]?.duration_formatted}`);
  const areDifferent = routes1[0]?.distance_formatted !== routes2[0]?.distance_formatted;
  console.log('Are routes genuinely different?', areDifferent);

  // Test 7: Travel Modes Comparison (Walking vs Cycling vs Driving)
  console.log('\n--- 7. Testing Travel Modes (Walking vs Cycling vs Driving) ---');
  for (const mode of ['walking', 'cycling', 'driving']) {
    const modeRes = await fetch('http://localhost:5000/api/routes/safe-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...routePayloadCPtoIG, travelMode: mode })
    });
    const modeJson = await modeRes.json();
    const top = modeJson.data?.routes?.[0];
    console.log(`Mode [${mode}]: Distance=${top?.distance_formatted}, ETA=${top?.duration_formatted}`);
  }

  // Test 8: Error Cases (Same Origin & Dest, Missing Coords)
  console.log('\n--- 8. Testing Edge & Error Cases ---');
  const sameRes = await fetch('http://localhost:5000/api/routes/safe-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceLat: 28.6328, sourceLng: 77.2195,
      destLat: 28.6328, destLng: 77.2195,
      sourceName: 'Same Place', destName: 'Same Place'
    })
  });
  console.log('Same Origin & Dest HTTP Status:', sameRes.status);
  const sameJson = await sameRes.json();
  console.log('Same Origin response:', sameJson);

  const missingRes = await fetch('http://localhost:5000/api/routes/safe-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log('Missing Coordinates HTTP Status:', missingRes.status);

  // Test 10: Turn-by-Turn Steps in Directions API
  console.log('\n--- 10. Testing Turn-by-Turn Steps Verification ---');
  const steps = routes1[0]?.steps || [];
  console.log('Total Steps generated:', steps.length);
  if (steps.length > 0) {
    console.log('Step 1:', steps[0].instruction, `(${steps[0].distance_meters}m) - Safety: ${steps[0].safety_tag}`);
    if (steps.length > 1) {
      console.log('Step 2:', steps[1].instruction, `(${steps[1].distance_meters}m) - Safety: ${steps[1].safety_tag}`);
    }
  }
}

runStep3Tests().catch(e => console.error(e));
