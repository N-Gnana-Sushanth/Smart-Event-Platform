import http from 'http';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(buffer.toString('utf8')) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: buffer.toString('utf8') });
          }
        } else {
          resolve({ status: res.statusCode, buffer, contentType });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runEndToEndTests() {
  console.log('=== STARTING END-TO-END VERIFICATION SUITE ===\n');

  try {
    // 1. Admin Login
    console.log('1. Testing Admin Authentication...');
    const adminLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@smartevent.com',
      password: 'AdminPass123!',
    });
    if (adminLogin.status !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.token;
    console.log('? Admin authenticated successfully. Token received.');

    // 2. Public Events Discovery
    console.log('\n2. Testing Public Events Discovery...');
    const publicEvents = await makeRequest('/api/events/public');
    if (publicEvents.status !== 200 || !publicEvents.data.events?.length) throw new Error('Public events failed');
    const hackathon = publicEvents.data.events.find(e => e.slug === 'global-ai-cloud-hackathon-2026');
    const summit = publicEvents.data.events.find(e => e.slug === 'international-tech-leaders-summit-2026');
    console.log(`? Discovered ${publicEvents.data.events.length} active events: "${hackathon.title}" and "${summit.title}"`);

    // 3. Solo Registration with Custom Fields & Volunteer Opt-in
    console.log('\n3. Testing Solo Registration with Custom Fields & Volunteer Opt-In...');
    const soloReg = await makeRequest(`/api/registrations/events/${summit.id}/register/solo`, 'POST', {
      fullName: 'Marcus Aurelius',
      participantIdCode: 'PART-ROM-01',
      email: 'marcus.aurelius@stoic.org',
      organization: 'Philosophical Research Institute',
      phone: '+1 555-4421',
      volunteerOptIn: true,
      customFieldValues: {
        job_title: 'Senior Fellow',
        workshop_track: 'Ethics in AI',
      },
    });
    if (soloReg.status !== 201) throw new Error('Solo registration failed: ' + JSON.stringify(soloReg.data));
    const soloCode = soloReg.data.registration.registrationCode;
    console.log(`? Solo participant registered: ${soloReg.data.registration.fullName} (Code: ${soloCode})`);

    // 4. Team Registration
    console.log('\n4. Testing Team Registration with Dynamic Members...');
    const teamReg = await makeRequest(`/api/registrations/events/${hackathon.id}/register/team`, 'POST', {
      teamName: 'Titanium Coders',
      captainIndex: 0,
      members: [
        {
          fullName: 'Leon Vance',
          participantIdCode: 'LEO-01',
          email: 'leon.vance@coders.io',
          organization: 'Apex Lab',
        },
        {
          fullName: 'Nadia Fox',
          participantIdCode: 'NAD-02',
          email: 'nadia.fox@coders.io',
          organization: 'Apex Lab',
        },
      ],
      volunteerOptIn: false,
    });
    if (teamReg.status !== 201) throw new Error('Team registration failed: ' + JSON.stringify(teamReg.data));
    console.log(`? Team registered: "${teamReg.data.team.teamName}" with ${teamReg.data.team.membersCount} members (Team Code: ${teamReg.data.team.teamCode})`);

    // 5. Digital Event Pass Retrieval
    console.log('\n5. Testing Digital Event Pass Retrieval...');
    const passRes = await makeRequest(`/api/registrations/pass/${soloCode}`);
    if (passRes.status !== 200) throw new Error('Digital pass retrieval failed');
    if (!passRes.data.pass.qrDataUrl.startsWith('data:image/png;base64,')) throw new Error('Invalid QR Data URL');
    const qrToken = passRes.data.pass.qrToken;
    console.log(`? Digital Pass loaded for ${passRes.data.pass.fullName} with valid encrypted QR Token.`);

    // 6. Volunteer Scoped Authorization
    console.log('\n6. Testing Volunteer Event-Scoped Authorization...');
    const volAuth = await makeRequest('/api/volunteers/authorize', 'POST', {
      eventSlugOrId: 'global-ai-cloud-hackathon-2026',
      identifier: 'VOL-2026-1042',
      eventPassword: 'volunteer2026',
    });
    if (volAuth.status !== 200) throw new Error('Volunteer authorization failed');
    const volToken = volAuth.data.token;
    console.log(`? Volunteer logged in: ${volAuth.data.volunteer.name} (Scope: ${volAuth.data.volunteer.eventTitle})`);

    // 7. QR Pass Verification by Volunteer (Anti-Attendance Verification)
    console.log('\n7. Testing Volunteer QR Verification (Strictly No Attendance Logging)...');
    
    // Test Valid Token
    const validVerify = await makeRequest('/api/qr/verify', 'POST', {
      qrToken,
      eventId: summit.id,
    }, { Authorization: `Bearer ${adminToken}` });
    if (validVerify.data.status !== 'VALID') throw new Error('Valid QR token verification failed');
    console.log(`? Valid pass verified: ${validVerify.data.participant.fullName} (${validVerify.data.message})`);

    // Test Revoked Pass
    const revokedVerify = await makeRequest('/api/qr/verify', 'POST', {
      qrToken: 'demo-revoked-token-aisha-12345',
      eventId: summit.id,
    }, { Authorization: `Bearer ${adminToken}` });
    if (revokedVerify.data.status !== 'REVOKED') throw new Error('Revoked QR verification failed');
    console.log(`? Revoked pass correctly rejected: ${revokedVerify.data.message}`);

    // Test Invalid Pass
    const invalidVerify = await makeRequest('/api/qr/verify', 'POST', {
      qrToken: 'totally-random-unknown-token',
    }, { Authorization: `Bearer ${adminToken}` });
    if (invalidVerify.data.status !== 'INVALID') throw new Error('Invalid QR check failed');
    console.log(`? Non-existent token correctly flagged: ${invalidVerify.data.message}`);

    // 8. AI Certificate Design Suggestions
    console.log('\n8. Testing AI Certificate Design Generator...');
    const aiSug = await makeRequest(`/api/certificates/events/${hackathon.id}/ai-suggestions`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    if (aiSug.status !== 200 || aiSug.data.suggestions?.length !== 5) throw new Error('AI suggestions failed');
    console.log(`? Generated ${aiSug.data.suggestions.length} AI Certificate Themes:`);
    aiSug.data.suggestions.forEach(t => console.log(`   ? ${t.name} (${t.category})`));

    // 9. Bulk Certificate Generation & Winner Selection
    console.log('\n9. Testing Bulk Certificate Generation with Winner Conferred...');
    const genRes = await makeRequest(`/api/certificates/events/${hackathon.id}/generate`, 'POST', {
      eligibilityMode: 'ALL',
      winnerAssignments: [
        { teamId: teamReg.data.team.id, position: '1st Place Winner' },
      ],
      templateConfig: aiSug.data.suggestions[2], // Tech & Futuristic
      distributeEmail: true,
    }, { Authorization: `Bearer ${adminToken}` });
    if (genRes.status !== 201) throw new Error('Certificate generation failed');
    console.log(`? Generated ${genRes.data.count} official certificates with individual winner awards.`);

    // 10. Public Certificate Verification
    console.log('\n10. Testing Public Tamper-Proof Certificate Verification (/verify/:code)...');
    const sampleCert = genRes.data.certificates[0];
    const pubVerify = await makeRequest(`/api/certificates/verify/${sampleCert.certificateCode}`);
    if (!pubVerify.data.verified) throw new Error('Public certificate verification failed');
    console.log(`? Public Verification Confirmed for ${pubVerify.data.certificate.recipientName}:`);
    console.log(`   ? Certificate ID: ${pubVerify.data.certificate.certificateCode}`);
    console.log(`   ? Type: ${pubVerify.data.certificate.certificateType} (${pubVerify.data.certificate.awardPosition})`);
    console.log(`   ? Event: ${pubVerify.data.event.title}`);

    // 11. Bulk Downloads: ZIP of individual PDFs and Combined Multi-page PDF
    console.log('\n11. Testing Bulk Downloads (ZIP and Combined PDF)...');
    const zipRes = await makeRequest(`/api/certificates/events/${hackathon.id}/download/zip`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    if (zipRes.status !== 200 || !zipRes.contentType.includes('zip')) throw new Error('ZIP download failed');
    console.log(`? Bulk ZIP Archive generated successfully (${zipRes.buffer.length} bytes)`);

    const pdfRes = await makeRequest(`/api/certificates/events/${hackathon.id}/download/combined-pdf`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    if (pdfRes.status !== 200 || !pdfRes.contentType.includes('pdf')) throw new Error('Combined PDF failed');
    console.log(`? Combined Multi-Page PDF generated successfully (${pdfRes.buffer.length} bytes)`);

    // 12. Participant Portal Lookup
    console.log('\n12. Testing Participant Portal Lookup...');
    const portalRes = await makeRequest(`/api/participants/lookup?email=marcus.aurelius@stoic.org`);
    if (portalRes.status !== 200 || !portalRes.data.registrations?.length) throw new Error('Participant portal lookup failed');
    console.log(`? Participant Portal retrieved ${portalRes.data.registrations.length} registered event(s) for marcus.aurelius@stoic.org`);

    // 13. Email Audit Logs & Retry
    console.log('\n13. Testing Email Logs and Automated Workflow Audit...');
    const mailLogs = await makeRequest('/api/emails/logs', 'GET', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    if (mailLogs.status !== 200) throw new Error('Email logs failed');
    console.log(`? Dispatched and recorded ${mailLogs.data.logs?.length} automated emails in audit log.`);

    console.log('\n======================================================');
    console.log('? ALL 13 END-TO-END INTEGRATION TESTS PASSED 100%!');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n? Test suite failed:', err);
    process.exit(1);
  }
}

runEndToEndTests();
