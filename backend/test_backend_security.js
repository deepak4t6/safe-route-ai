const BASE_URL = 'http://localhost:5000/api';

async function runBackendSecurityAudit() {
  console.log('=== STEP 6: BACKEND, DATABASE & SECURITY AUDIT (EXACT ENDPOINTS) ===\n');

  // 1. Healthcheck
  console.log('--- 1. Healthcheck Endpoint ---');
  const hRes = await fetch('http://localhost:5000/health');
  console.log('Healthcheck status:', hRes.status, await hRes.json());

  // 2. Auth: Register new user
  console.log('\n--- 2. Auth: Register New User ---');
  const testEmail = `auditor_${Date.now()}@saferoute.ai`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Auditor User',
      email: testEmail,
      password: 'SecurePassword123!',
      phone: '+919999988888',
      preferred_mode: 'walking'
    })
  });
  console.log('Register HTTP Status:', regRes.status);
  const regJson = await regRes.json();
  console.log('Register Success:', regJson.success, '| User ID:', regJson.user?.id, '| Has Token:', Boolean(regJson.token));
  const userToken = regJson.token;

  // 3. Auth: Login with created user
  console.log('\n--- 3. Auth: Login with Created User ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword123!'
    })
  });
  console.log('Login HTTP Status:', loginRes.status);
  const loginJson = await loginRes.json();
  console.log('Login Success:', loginJson.success, '| Role:', loginJson.user?.role, '| Token Length:', loginJson.token?.length);

  // 4. Auth: Profile Access with JWT Token
  console.log('\n--- 4. Auth: Protected Profile Access (/auth/me) ---');
  const profRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log('Profile HTTP Status:', profRes.status);
  const profJson = await profRes.json();
  console.log('Profile User:', profJson.user?.name, '| Email:', profJson.user?.email, '| Mode:', profJson.user?.preferred_mode);

  // 5. Auth: Access Profile without Token (Should be 401)
  console.log('\n--- 5. Auth: Unauthorized Profile Access (Should be 401) ---');
  const unauthRes = await fetch(`${BASE_URL}/auth/me`);
  console.log('Unauth HTTP Status:', unauthRes.status, '(401 Expected)');

  // 6. Safety Reports: Submit Community Report (/safety/report)
  console.log('\n--- 6. Safety: Submit Community Incident Report ---');
  const reportRes = await fetch(`${BASE_URL}/safety/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      category: 'poor_lighting',
      description: 'Street light broken near metro pillar 42',
      latitude: 28.6328,
      longitude: 77.2195,
      severity: 3,
      is_anonymous: false
    })
  });
  console.log('Submit Report HTTP Status:', reportRes.status);
  const reportJson = await reportRes.json();
  console.log('Report Created:', reportJson.success, '| ID:', reportJson.report?.id, '| Status:', reportJson.report?.status);

  // 7. Safety Heatmap: Fetch Heatmap Points
  console.log('\n--- 7. Safety: Heatmap Data Fetch ---');
  const heatRes = await fetch(`${BASE_URL}/safety/heatmap?minLat=28.60&maxLat=28.66&minLng=77.20&maxLng=77.25`);
  console.log('Heatmap HTTP Status:', heatRes.status);
  const heatJson = await heatRes.json();
  console.log('Heatmap Points Count:', heatJson.points?.length, '| Sample point intensity:', heatJson.points?.[0]?.intensity);

  // 8. Safe Places Directory (/safety/nearby-safe-places)
  console.log('\n--- 8. Safety: Nearby Safe Places Directory ---');
  const spRes = await fetch(`${BASE_URL}/safety/nearby-safe-places?lat=28.6328&lng=77.2195&radius=2000`);
  console.log('Safe Places HTTP Status:', spRes.status);
  const spJson = await spRes.json();
  console.log('Safe Places Count:', spJson.safe_places?.length, '| Top:', spJson.safe_places?.[0]?.name);

  // 9. AI Assistant Endpoint (/ai/ask-safety-question)
  console.log('\n--- 9. AI Assistant API ---');
  const aiRes = await fetch(`${BASE_URL}/ai/ask-safety-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'Is it safe to walk from Connaught Place to Mandi House at 10 PM?',
      latitude: 28.6328,
      longitude: 77.2195,
      time_str: '22:00'
    })
  });
  console.log('AI HTTP Status:', aiRes.status);
  const aiJson = await aiRes.json();
  console.log('AI Answer Preview:', aiJson.answer);
  console.log('AI Actionable Tips:', aiJson.actionable_tips?.length);

  // 10. Admin: Moderate Reports (Requires Admin role - normal user should be 403)
  console.log('\n--- 10. Admin: Access with Normal User Token (Expected 403) ---');
  const adminUnauth = await fetch(`${BASE_URL}/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log('Admin Access with Normal User Token HTTP Status:', adminUnauth.status, '(403 Expected)');

  // 11. Admin: Access with Admin Account
  console.log('\n--- 11. Admin: Access with Admin Account ---');
  const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@saferoute.ai',
      password: 'password123'
    })
  });
  const adminJson = await adminLogin.json();
  const adminToken = adminJson.token;
  console.log('Admin Login Role:', adminJson.user?.role, '| Token length:', adminToken?.length);

  const adminStats = await fetch(`${BASE_URL}/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('Admin Analytics HTTP Status:', adminStats.status, '(200 Expected)');
  const statsJson = await adminStats.json();
  console.log('Admin Analytics Summary:', statsJson.analytics?.summary);

  // 12. Rate Limiting verification
  console.log('\n--- 12. Security: Rate Limit Headers ---');
  console.log('RateLimit-Remaining:', adminStats.headers.get('ratelimit-remaining'));
  console.log('RateLimit-Limit:', adminStats.headers.get('ratelimit-limit'));
}

runBackendSecurityAudit().catch(e => console.error(e));
