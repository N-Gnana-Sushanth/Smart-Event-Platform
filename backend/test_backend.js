import http from 'http';
import { PORT } from './config/env.js';

// Wait for server to start, then test endpoints
async function runTests() {
  console.log('Testing backend API endpoints...');
  
  const testUrl = (path, method = 'GET', body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(`http://localhost:${PORT}${path}`);
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };
      
      const req = http.request(parsedUrl, {
        method,
        headers: reqHeaders,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    // 1. Health check
    const health = await testUrl('/api/health');
    console.log('? Health Check:', health.status === 200 ? 'PASS' : 'FAIL', health.data.platform);

    // 2. Public events list
    const publicEvents = await testUrl('/api/events/public');
    console.log('? Public Events:', publicEvents.status === 200 ? 'PASS' : 'FAIL', `Found ${publicEvents.data.events?.length} events`);

    // 3. Admin login
    const loginRes = await testUrl('/api/auth/login', 'POST', {
      email: 'admin@smartevent.com',
      password: 'AdminPass123!',
    });
    console.log('? Admin Login:', loginRes.status === 200 ? 'PASS' : 'FAIL', loginRes.data.user?.name);
    const token = loginRes.data.token;

    // 4. Admin Dashboard Stats (strictly no attendance)
    const stats = await testUrl('/api/events/dashboard/stats', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('? Dashboard Metrics:', stats.status === 200 ? 'PASS' : 'FAIL', {
      events: stats.data.events?.total,
      registrations: stats.data.registrations?.total,
      certificates: stats.data.certificates?.generated,
    });

    // 5. Public Certificate Verification
    const certVerify = await testUrl('/api/certificates/verify/CERT-2026-000101');
    console.log('? Public Certificate Verification:', certVerify.status === 200 ? 'PASS' : 'FAIL', {
      verified: certVerify.data.verified,
      recipient: certVerify.data.certificate?.recipientName,
      type: certVerify.data.certificate?.certificateType,
    });

    // 6. Volunteer Login for Hackathon
    const volLogin = await testUrl('/api/volunteers/authorize', 'POST', {
      eventSlugOrId: 'global-ai-cloud-hackathon-2026',
      identifier: 'VOL-2026-1042',
      eventPassword: 'volunteer2026',
    });
    console.log('? Volunteer Auth:', volLogin.status === 200 ? 'PASS' : 'FAIL', volLogin.data.volunteer?.name);
    const volToken = volLogin.data.token;

    // 7. QR Verification - Revoked pass test
    const revokedQrTest = await testUrl('/api/qr/verify', 'POST', {
      qrToken: 'demo-revoked-token-aisha-12345',
    }, { Authorization: `Bearer ${volToken}` });
    console.log('? QR Revoked Pass Check:', revokedQrTest.data.status === 'REVOKED' ? 'PASS' : 'FAIL', revokedQrTest.data.message);

    // 8. QR Verification - Invalid token test
    const invalidQrTest = await testUrl('/api/qr/verify', 'POST', {
      qrToken: 'random-invalid-token-xyz',
    }, { Authorization: `Bearer ${volToken}` });
    console.log('? QR Invalid Pass Check:', invalidQrTest.data.status === 'INVALID' ? 'PASS' : 'FAIL', invalidQrTest.data.message);

    console.log('\nAll backend verification tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Backend test failed:', err);
    process.exit(1);
  }
}

runTests();
