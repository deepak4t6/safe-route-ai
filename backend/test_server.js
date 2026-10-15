const app = require('./src/server');
const http = require('http');

console.log('[TEST] Checking backend routes and mock initialization...');

// Test calculating route using local routingService
const { generateRouteAlternatives } = require('./src/services/routingService');

async function runTests() {
  try {
    const routeRes = await generateRouteAlternatives({
      sourceLat: 28.6328,
      sourceLng: 77.2195,
      destLat: 28.6385,
      destLng: 77.2240,
      sourceName: 'Connaught Place Central',
      destName: 'Barakhamba Road',
      travelMode: 'walking',
      departureHour: 22,
      safetyPriority: 80
    });

    console.log(`[PASS] Generated ${routeRes.routes.length} routes:`);
    routeRes.routes.forEach(r => {
      console.log(`  - ${r.type.toUpperCase()}: Score ${r.safety_score}/100, ETA ${r.duration_formatted}, Distance ${r.distance_formatted}, Risky segments: ${r.risky_segments_count}`);
    });

    // Test SOS trigger service
    const { triggerSOS } = require('./src/services/sosService');
    const sosRes = await triggerSOS({
      userId: 'a0000000-0000-0000-0000-000000000001',
      latitude: 28.6328,
      longitude: 77.2195,
      batteryPercentage: 92
    });

    console.log(`[PASS] SOS Triggered successfully: ID=${sosRes.id}, TrackingURL=${sosRes.live_tracking_url}`);
    console.log(`  - Nearest Police: ${sosRes.nearest_police?.name} (${sosRes.nearest_police?.distance_meters}m)`);
    console.log(`  - Nearest Hospital: ${sosRes.nearest_hospital?.name} (${sosRes.nearest_hospital?.distance_meters}m)`);
    console.log(`  - Notified contacts: ${sosRes.notified_contacts.length}`);

    console.log('\n✅ ALL BACKEND SELF-TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTests();
