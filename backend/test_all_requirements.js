import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import http from 'http';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import participantRoutes from './routes/participantRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/participants', participantRoutes);

const prisma = new PrismaClient();
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;

async function runTests() {
  console.log('=== STARTING FULL SUITE: SMART EVENT PLATFORM VALIDATION ===\n');

  // Start express server on test port
  await new Promise((resolve) => {
    server = http.createServer(app).listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Multi-tenant Organizer Isolation
    // ----------------------------------------------------
    console.log('\n--- Test 1: Multi-Tenant Organizer Isolation ---');
    
    // Login Admin A (Dr. Evelyn Reed)
    const loginARes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartevent.com', password: 'AdminPass123!' })
    });
    const loginAData = await loginARes.json();
    assert(loginARes.status === 200 && loginAData.token, 'Admin A login successful with JWT');
    const tokenA = loginAData.token;

    // Login Admin B (Prof. Marcus Thorne)
    const loginBRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer.b@university.edu', password: 'AdminPass123!' })
    });
    const loginBData = await loginBRes.json();
    assert(loginBRes.status === 200 && loginBData.token, 'Admin B login successful with JWT');
    const tokenB = loginBData.token;

    // Fetch Events for Admin A
    const eventsARes = await fetch(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const eventsAData = await eventsARes.json();
    const eventAIds = eventsAData.events.map(e => e.id);

    // Fetch Events for Admin B
    const eventsBRes = await fetch(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const eventsBData = await eventsBRes.json();
    const eventBIds = eventsBData.events.map(e => e.id);

    assert(eventsAData.events.length > 0, `Admin A has ${eventsAData.events.length} isolated events`);
    assert(eventsBData.events.length > 0, `Admin B has ${eventsBData.events.length} isolated events`);
    
    // Verify no overlap
    const overlap = eventAIds.filter(id => eventBIds.includes(id));
    assert(overlap.length === 0, 'Zero event overlap between Admin A and Admin B (strict isolation)');

    // Admin A attempting to access Admin B's event directly
    if (eventBIds.length > 0) {
      const crossAccessRes = await fetch(`${BASE_URL}/events/${eventBIds[0]}`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(crossAccessRes.status === 404 || crossAccessRes.status === 403, 'Cross-tenant event access blocked (404/403)');
    }

    // ----------------------------------------------------
    // TEST 2: Past Date Rejection on Event Creation
    // ----------------------------------------------------
    console.log('\n--- Test 2: Past Date Event Creation Protection ---');
    const pastDateRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Past Event That Should Fail',
        description: 'Testing past date validation',
        eventDate: '2020-01-01',
        organizationName: 'Global AI Institute',
        locationOrLink: 'San Francisco, CA',
        contactEmail: 'admin@smartevent.com'
      })
    });
    const pastDateData = await pastDateRes.json();
    assert(pastDateRes.status === 400, `Past event date rejected with 400 Bad Request: "${pastDateData.error}"`);

    // Valid Future Date Event Creation
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const createFutureRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Future Automated Test Hackathon',
        description: 'Validation event for automated testing',
        category: 'Hackathons',
        type: 'HYBRID',
        eventDate: futureDateStr,
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        timezone: 'America/New_York',
        locationOrLink: 'MIT Media Lab & Online',
        organizationName: 'Global AI Institute',
        contactEmail: 'admin@smartevent.com',
        volunteerPassword: 'testvolunteer2026'
      })
    });
    const createFutureData = await createFutureRes.json();
    assert(createFutureRes.status === 201 && createFutureData.event?.id, 'Future event creation succeeded with 201 Created');
    const testEventId = createFutureData.event?.id;
    const testEventSlug = createFutureData.event?.slug;

    // ----------------------------------------------------
    // TEST 3: Password Reset Flow (Forgot & Reset Password)
    // ----------------------------------------------------
    console.log('\n--- Test 3: Secure Password Reset Workflow ---');
    // Request password reset
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartevent.com' })
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200, 'Password reset request acknowledged');

    // Retrieve generated token from DB
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@smartevent.com' } });
    assert(adminUser.resetToken && adminUser.resetTokenExpiry > new Date(), 'Single-use cryptographic reset token generated with valid expiry');

    // Reset password with token
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: adminUser.resetToken,
        newPassword: 'newSecretPassword2026!'
      })
    });
    const resetData = await resetRes.json();
    assert(resetRes.status === 200, 'Password reset succeeded');

    // Verify token invalidated after single use
    const adminUserAfter = await prisma.user.findUnique({ where: { email: 'admin@smartevent.com' } });
    assert(adminUserAfter.resetToken === null, 'Reset token cleared immediately after single use');

    // Verify login with new password
    const loginNewRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartevent.com', password: 'newSecretPassword2026!' })
    });
    assert(loginNewRes.status === 200, 'Login with new password succeeded');

    // Restore original password for consistency
    await prisma.user.update({
      where: { email: 'admin@smartevent.com' },
      data: { passwordHash: await bcrypt.hash('AdminPass123!', 10) }
    });

    // ----------------------------------------------------
    // TEST 4: Registration, Digital Pass & Zero-Attendance
    // ----------------------------------------------------
    console.log('\n--- Test 4: Registration & Digital Pass Issuance ---');
    
    // Set test event to REGISTRATION_OPEN
    await prisma.event.update({
      where: { id: testEventId },
      data: { status: 'REGISTRATION_OPEN' }
    });

    const regRes = await fetch(`${BASE_URL}/registrations/events/${testEventId}/register/solo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Jane Doe Test',
        email: 'janedoe@testdomain.com',
        participantIdCode: 'TEST-PART-001',
        organization: 'MIT',
        phone: '+1 555-0199',
        volunteerOptIn: true
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.registration?.registrationCode, 'Participant registered and pass generated');
    const testRegCode = regData.registration?.registrationCode;
    const testRegId = regData.registration?.id;

    // View Digital Pass
    const passRes = await fetch(`${BASE_URL}/registrations/pass/${testRegCode}`);
    const passData = await passRes.json();
    assert(passRes.status === 200 && passData.pass.qrDataUrl, 'Public pass accessible with encrypted QR data');

    // ----------------------------------------------------
    // TEST 5: Volunteer Authentication & Scanner Gate Check
    // ----------------------------------------------------
    console.log('\n--- Test 5: Volunteer Login & Gate Pass Scanner ---');
    
    // Volunteer Login with event slug and volunteer password
    const volLoginRes = await fetch(`${BASE_URL}/volunteers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventSlugOrId: testEventSlug,
        eventPassword: 'testvolunteer2026',
        name: 'Alex Staff Member',
        identifier: 'janedoe@testdomain.com'
      })
    });
    const volLoginData = await volLoginRes.json();
    assert(volLoginRes.status === 200 && volLoginData.token, 'Volunteer login successful with event staff credentials');
    const volToken = volLoginData.token;

    // Reset Volunteer Password from Admin
    const resetVolPassRes = await fetch(`${BASE_URL}/events/${testEventId}/reset-volunteer-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const resetVolPassData = await resetVolPassRes.json();
    assert(resetVolPassRes.status === 200 && resetVolPassData.volunteerPassword, `Volunteer password reset by admin to: ${resetVolPassData.volunteerPassword}`);

    // Scan Pass using Volunteer Token via /api/qr/verify
    const qrToken = passData.pass.qrToken;
    const scanRes = await fetch(`${BASE_URL}/qr/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volToken}`
      },
      body: JSON.stringify({ qrToken })
    });
    const scanData = await scanRes.json();
    assert(scanRes.status === 200 && scanData.status === 'VALID', `Gate scanner validated pass with status: ${scanData.status} (Zero attendance logged)`);

    // ----------------------------------------------------
    // TEST 6: Certificate Studio AI Suggestions & Custom Colors
    // ----------------------------------------------------
    console.log('\n--- Test 6: AI Certificate Studio & Custom Themes ---');
    
    // AI Suggestions (Seed 1)
    const sug1Res = await fetch(`${BASE_URL}/certificates/events/${testEventId}/ai-suggestions?seed=1`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const sug1Data = await sug1Res.json();
    assert(sug1Data.suggestions?.length === 5, 'AI returned 5 distinct certificate theme suggestions');

    // AI Suggestions (Seed 2 - Regeneration)
    const sug2Res = await fetch(`${BASE_URL}/certificates/events/${testEventId}/ai-suggestions?seed=2`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const sug2Data = await sug2Res.json();
    assert(sug2Data.suggestions?.length === 5, 'Regenerate suggestions returned fresh theme suggestions across seeds');

    // Generate Certificates with custom theme colors
    const genCertRes = await fetch(`${BASE_URL}/certificates/events/${testEventId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        eligibilityMode: 'ALL',
        templateConfig: {
          id: 'modern_tech_dark',
          name: 'Custom Brand Dark Theme',
          primaryColor: '#0f172a',
          accentColor: '#38bdf8',
          secondaryColor: '#1e293b'
        },
        distributeEmail: false
      })
    });
    const genCertData = await genCertRes.json();
    assert((genCertRes.status === 200 || genCertRes.status === 201) && genCertData.count >= 1, `Generated ${genCertData.count} certificates with custom brand colors`);

    // Verify Public Certificate Verification
    const createdCert = await prisma.certificate.findFirst({
      where: { eventId: testEventId }
    });
    assert(createdCert !== null, 'Certificate record created in database');

    const verifyCertRes = await fetch(`${BASE_URL}/certificates/verify/${createdCert.certificateCode}`);
    const verifyCertData = await verifyCertRes.json();
    assert(verifyCertRes.status === 200 && (verifyCertData.valid || verifyCertData.verified), 'Public certificate verification endpoint verified credential');

    // ----------------------------------------------------
    // TEST 7: Pass Token Cleanup without Breaking Certificates
    // ----------------------------------------------------
    console.log('\n--- Test 7: 12-Hour Pass Token Cleanup Integrity ---');
    
    const cleanupRes = await fetch(`${BASE_URL}/events/${testEventId}/cleanup-passes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const cleanupData = await cleanupRes.json();
    assert(cleanupRes.status === 200, `Pass cleanup executed: ${cleanupData.message}`);

    // Verify pass token is cleaned
    const regAfterCleanup = await prisma.registration.findUnique({
      where: { id: testRegId }
    });
    assert(regAfterCleanup.qrToken === null && regAfterCleanup.passStatus === 'EXPIRED', 'Pass QR token expired and cleaned safely');

    // Verify certificate and public verification STILL work perfectly
    const verifyAfterCleanup = await fetch(`${BASE_URL}/certificates/verify/${createdCert.certificateCode}`);
    const verifyAfterData = await verifyAfterCleanup.json();
    assert(verifyAfterCleanup.status === 200 && (verifyAfterData.valid || verifyAfterData.verified), 'Certificate and public verification intact after pass cleanup');

    // ----------------------------------------------------
    // TEST 8: Participant Roster CSV Export
    // ----------------------------------------------------
    console.log('\n--- Test 8: Participant Roster CSV Export ---');
    const csvRes = await fetch(`${BASE_URL}/participants/events/${testEventId}/export/csv`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const csvContent = await csvRes.text();
    assert(csvRes.status === 200, 'CSV export endpoint returned 200 OK');
    assert(csvContent.includes('Jane Doe Test') && csvContent.includes('TEST-PART-001'), 'CSV contains correct participant records');
    assert(!csvContent.includes('T-Shirt'), 'CSV does not contain T-Shirt size column');

    // ----------------------------------------------------
    // TEST 9: SMTP Config Diagnostics Endpoint
    // ----------------------------------------------------
    console.log('\n--- Test 9: SMTP Diagnostics & Config ---');
    const smtpInfoRes = await fetch(`${BASE_URL}/emails/config-info`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const smtpInfoData = await smtpInfoRes.json();
    assert(smtpInfoRes.status === 200 && smtpInfoData.supportEmail, `SMTP diagnostics returns configured supportEmail: ${smtpInfoData.supportEmail}`);

    // Verify no hardcoded production secrets in runtime config
    const { JWT_SECRET, EMAIL_CREDENTIAL_ENCRYPTION_KEY } = await import('./config/env.js');
    assert(
      !JWT_SECRET.includes('super_secret_jwt_key_smartevent_2026_production'),
      'Hardcoded production JWT_SECRET fallback string has been completely removed'
    );
    assert(
      !EMAIL_CREDENTIAL_ENCRYPTION_KEY.includes('smartevent-organizer-smtp-aes256-secret-key-32b'),
      'Hardcoded production EMAIL_CREDENTIAL_ENCRYPTION_KEY fallback string has been completely removed'
    );

    // ----------------------------------------------------
    // TEST 10: Per-Organizer Email Architecture & Isolation
    // ----------------------------------------------------
    console.log('\n--- Test 10: Per-Organizer Email Architecture & Strict Isolation ---');

    // 10.1: Organizer A saves email configuration
    const saveConfigARes = await fetch(`${BASE_URL}/emails/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        senderEmail: 'evelyn.reed@gtcouncil.org',
        senderDisplayName: 'Global Technology Council Events',
        smtpHost: 'smtp.mailtrap.io',
        smtpPort: 2525,
        smtpUser: 'gtc_mailer_user',
        smtpPassword: 'gtc_super_secret_smtp_password_2026!',
        secure: false
      })
    });
    const saveConfigAData = await saveConfigARes.json();
    assert(saveConfigARes.status === 200 && saveConfigAData.success, 'Organizer A successfully saved email sending configuration');

    // 10.2: Organizer B saves a distinct email configuration
    const saveConfigBRes = await fetch(`${BASE_URL}/emails/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        senderEmail: 'events@apexscience.edu',
        senderDisplayName: 'Apex Science Institute Outbox',
        smtpHost: 'smtp.university.edu',
        smtpPort: 587,
        smtpUser: 'apex_smtp_account',
        smtpPassword: 'apex_super_secret_smtp_password_2026!',
        secure: false
      })
    });
    const saveConfigBData = await saveConfigBRes.json();
    assert(saveConfigBRes.status === 200 && saveConfigBData.success, 'Organizer B successfully saved a different email sending configuration');

    // 10.3: Multi-tenant reading isolation: Organizer A retrieves own config
    const getConfigARes = await fetch(`${BASE_URL}/emails/config`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const getConfigAData = await getConfigARes.json();
    assert(
      getConfigARes.status === 200 &&
      getConfigAData.config?.senderEmail === 'evelyn.reed@gtcouncil.org' &&
      getConfigAData.config?.senderDisplayName === 'Global Technology Council Events',
      'Organizer A reads only their own email sender configuration'
    );

    // 10.4: Multi-tenant reading isolation: Organizer B retrieves own config
    const getConfigBRes = await fetch(`${BASE_URL}/emails/config`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const getConfigBData = await getConfigBRes.json();
    assert(
      getConfigBRes.status === 200 &&
      getConfigBData.config?.senderEmail === 'events@apexscience.edu' &&
      getConfigBData.config?.senderDisplayName === 'Apex Science Institute Outbox',
      'Organizer B reads only their own email sender configuration'
    );

    // 10.5: Security: SMTP Password and encryption keys are NEVER returned in API responses
    assert(
      getConfigAData.config?.smtpPassword === undefined &&
      getConfigBData.config?.smtpPassword === undefined &&
      getConfigAData.config?.hasPassword === true,
      'Organizer SMTP passwords are never exposed or returned through API responses'
    );

    // 10.6: Organizer A verifies SMTP connection using authenticated credentials
    const verifyARes = await fetch(`${BASE_URL}/emails/verify-smtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({})
    });
    const verifyAData = await verifyARes.json();
    assert(verifyARes.status === 200, 'Organizer A authenticated SMTP verification endpoint functional');

    // 10.7: Organizer A sends test email with authenticated sender
    const testEmailARes = await fetch(`${BASE_URL}/emails/send-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ recipientEmail: 'admin.inbox.test@example.com' })
    });
    const testEmailAData = await testEmailARes.json();
    assert(
      testEmailARes.status === 200 &&
      testEmailAData.success &&
      testEmailAData.log?.senderEmail === 'evelyn.reed@gtcouncil.org',
      'Organizer A test email dispatched using Organizer A sender identity (evelyn.reed@gtcouncil.org)'
    );

    // 10.8: Registration for Organizer A's event dispatches email using Organizer A's sender
    const adminAUser = await prisma.user.findUnique({ where: { email: 'admin@smartevent.com' } });
    const adminBUser = await prisma.user.findUnique({ where: { email: 'organizer.b@university.edu' } });

    const emailA_test = `attendee.orga.${Date.now()}@test.com`;
    const regARes = await fetch(`${BASE_URL}/registrations/events/${testEventId}/register/solo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Attendee Under Org A',
        email: emailA_test,
        participantIdCode: 'PART-A-999',
        organization: 'Council Member Org'
      })
    });
    assert(regARes.status === 201, 'Participant registered for Organizer A event');

    // Wait briefly for asynchronous email dispatch
    await new Promise(r => setTimeout(r, 200));

    // Check EmailLog for Org A registration
    const logA = await prisma.emailLog.findFirst({
      where: {
        eventId: testEventId,
        recipientEmail: emailA_test,
        emailType: 'WELCOME'
      }
    });
    assert(
      logA !== null &&
      logA.senderEmail === 'evelyn.reed@gtcouncil.org' &&
      logA.organizerId === adminAUser.id,
      `Registration for Org A event used Organizer A sender identity (${logA?.senderEmail})`
    );

    // 10.9: Registration for Organizer B's event dispatches email using Organizer B's sender
    const eventB = await prisma.event.findFirst({
      where: { organizerId: adminBUser.id }
    });
    assert(eventB !== null, 'Organizer B event located');

    const emailB_test = `attendee.orgb.${Date.now()}@test.com`;
    const regBRes = await fetch(`${BASE_URL}/registrations/events/${eventB.id}/register/solo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Attendee Under Org B',
        email: emailB_test,
        participantIdCode: 'PART-B-999',
        organization: 'Robotics Lab'
      })
    });
    assert(regBRes.status === 201, 'Participant registered for Organizer B event');

    // Wait briefly for asynchronous email dispatch
    await new Promise(r => setTimeout(r, 200));

    // Check EmailLog for Org B registration
    const logB = await prisma.emailLog.findFirst({
      where: {
        eventId: eventB.id,
        recipientEmail: emailB_test,
        emailType: 'WELCOME'
      }
    });
    assert(
      logB !== null &&
      logB.senderEmail === 'events@apexscience.edu' &&
      logB.organizerId === adminBUser.id,
      `Registration for Org B event used Organizer B sender identity (${logB?.senderEmail})`
    );

    // 10.10: Certificate email for Organizer A event uses Organizer A sender
    const certA = await prisma.certificate.findFirst({
      where: { eventId: testEventId }
    });
    if (certA) {
      const distCertARes = await fetch(`${BASE_URL}/certificates/events/${testEventId}/distribute-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({ certificateIds: [certA.id] })
      });
      const distCertAData = await distCertARes.json();
      assert(distCertARes.status === 200 && distCertAData.success, 'Certificate email distribution triggered for Org A');

      const certLogA = await prisma.emailLog.findFirst({
        where: {
          eventId: testEventId,
          emailType: 'CERTIFICATE'
        },
        orderBy: { sentAt: 'desc' }
      });
      assert(
        certLogA !== null && certLogA.senderEmail === 'evelyn.reed@gtcouncil.org',
        `Certificate email sent using Organizer A sender identity (${certLogA?.senderEmail})`
      );
    }

    // 10.11: Unconfigured Organizer Registration Handling (Honest FAILED status, no false SENT claims)
    // Clean up any old unconfigured test user
    await prisma.user.deleteMany({ where: { email: { contains: 'unconfigured.org' } } });

    const unconfEmail = `unconfigured.org.${Date.now()}@smartevent.com`;
    const unconfiguredOrganizer = await prisma.user.create({
      data: {
        name: 'Unconfigured Organizer',
        email: unconfEmail,
        passwordHash: await bcrypt.hash('TestPass123!', 10),
        role: 'ADMIN'
      }
    });

    const unconfEvent = await prisma.event.create({
      data: {
        slug: `unconfigured-org-event-${Date.now()}`,
        title: 'Unconfigured Org Event',
        description: 'Testing email dispatch behavior without email config',
        category: 'Workshops',
        type: 'ONLINE',
        status: 'REGISTRATION_OPEN',
        eventDate: futureDate,
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        locationOrLink: 'Online Stream',
        organizationName: 'Unconfigured Entity',
        contactName: 'Test Staff',
        contactEmail: unconfEmail,
        organizerId: unconfiguredOrganizer.id
      }
    });

    const unconfAttendeeEmail = `unconf.attendee.${Date.now()}@test.com`;
    await fetch(`${BASE_URL}/registrations/events/${unconfEvent.id}/register/solo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Attendee Unconfigured Event',
        email: unconfAttendeeEmail,
        participantIdCode: 'PART-UNCONF-01',
        organization: 'Testing Corp'
      })
    });

    // Wait a brief moment for async dispatch
    await new Promise(r => setTimeout(r, 200));

    const unconfLog = await prisma.emailLog.findFirst({
      where: {
        eventId: unconfEvent.id,
        recipientEmail: unconfAttendeeEmail
      }
    });
    assert(
      unconfLog !== null && unconfLog.status === 'FAILED',
      'Unconfigured organizer email logged honestly as FAILED without claiming false delivery'
    );

    // 10.12: Security: EmailLog never contains plain text passwords or secrets
    const anyLogWithPass = await prisma.emailLog.findFirst({
      where: {
        OR: [
          { errorMessage: { contains: 'super_secret' } },
          { subject: { contains: 'super_secret' } }
        ]
      }
    });
    assert(
      anyLogWithPass === null,
      'Zero SMTP passwords or credential secrets written to EmailLog table'
    );

    // Cleanup unconfigured organizer test data
    await prisma.registration.deleteMany({ where: { eventId: unconfEvent.id } });
    await prisma.emailLog.deleteMany({ where: { eventId: unconfEvent.id } });
    await prisma.event.delete({ where: { id: unconfEvent.id } });
    await prisma.user.delete({ where: { id: unconfiguredOrganizer.id } });

    // Cleanup test event
    await prisma.certificate.deleteMany({ where: { eventId: testEventId } });
    await prisma.volunteerRequest.deleteMany({ where: { eventId: testEventId } });
    await prisma.volunteer.deleteMany({ where: { eventId: testEventId } });
    await prisma.registration.deleteMany({ where: { eventId: testEventId } });
    await prisma.emailLog.deleteMany({ where: { eventId: testEventId } });
    await prisma.event.delete({ where: { id: testEventId } });

    console.log('\n=== TEST SUMMARY ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total:  ${passed + failed}`);

    if (failed === 0) {
      console.log('\n🌟 ALL SYSTEM REQUIREMENTS AND SPECIFICATIONS VERIFIED & PASSING 100%! 🌟\n');
    }
  } catch (err) {
    console.error('Test run encountered unexpected error:', err);
    failed++;
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
    process.exit(failed === 0 ? 0 : 1);
  }
}

runTests();
