import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { encryptCredential } from '../utils/crypto.js';

const prisma = new PrismaClient();

function secureToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function main() {
  console.log('Seeding Smart Event Management database...');

  // 1. Clean existing records
  await prisma.organizerEmailConfig.deleteMany({});
  await prisma.emailLog.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.certificateTemplate.deleteMany({});
  await prisma.volunteerRequest.deleteMany({});
  await prisma.volunteer.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.customRegistrationField.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Admin Organizers (Organizer A & Organizer B for Multi-tenant isolation testing)
  const passwordHash = await bcrypt.hash('AdminPass123!', 10);
  const adminA = await prisma.user.create({
    data: {
      name: 'Dr. Evelyn Reed',
      email: 'admin@smartevent.com',
      passwordHash,
      role: 'ADMIN',
      organization: 'Global Technology Council',
    },
  });

  // Seed Email Config for Admin A
  await prisma.organizerEmailConfig.create({
    data: {
      userId: adminA.id,
      senderEmail: 'evelyn.reed@gtcouncil.org',
      senderDisplayName: 'Global Technology Council Events',
      smtpHost: 'smtp.mailtrap.io',
      smtpPort: 2525,
      smtpUser: 'gtc_mailer_user',
      smtpPassword: encryptCredential('gtc_app_secret_pass_2026'),
      secure: false,
      isVerified: true,
    },
  });

  const adminB = await prisma.user.create({
    data: {
      name: 'Prof. Marcus Thorne',
      email: 'organizer.b@university.edu',
      passwordHash,
      role: 'ADMIN',
      organization: 'Apex Science Institute',
    },
  });

  // Seed Email Config for Admin B (Distinct sender identity)
  await prisma.organizerEmailConfig.create({
    data: {
      userId: adminB.id,
      senderEmail: 'events@apexscience.edu',
      senderDisplayName: 'Apex Science Institute Outbox',
      smtpHost: 'smtp.university.edu',
      smtpPort: 587,
      smtpUser: 'apex_smtp_account',
      smtpPassword: encryptCredential('apex_app_secret_pass_2026'),
      secure: false,
      isVerified: true,
    },
  });

  // Participant User
  const studentUser = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      passwordHash,
      role: 'PARTICIPANT',
      organization: 'MIT Autonomous Lab',
    },
  });

  // Volunteer passwords
  const hackathonVolPass = await bcrypt.hash('volunteer2026', 10);
  const summitVolPass = await bcrypt.hash('summit2026', 10);
  const quantumVolPass = await bcrypt.hash('quantum2026', 10);

  // 3. Event 1 (Owned by Admin A): Global AI & Cloud Hackathon 2026 (Upcoming, Team event)
  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 14); // 2 weeks in future

  const event1 = await prisma.event.create({
    data: {
      slug: 'global-ai-cloud-hackathon-2026',
      title: 'Global AI & Cloud Hackathon 2026',
      description: 'An international 48-hour competitive hackathon bringing together software engineers, AI researchers, and designers to build next-generation autonomous systems and resilient cloud architectures.',
      category: 'Hackathons',
      type: 'HYBRID',
      status: 'REGISTRATION_OPEN',
      eventDate: futureDate1,
      startTime: '09:00 AM',
      endTime: '09:00 PM',
      durationHours: 48,
      timezone: 'America/New_York',
      locationOrLink: 'Metropolitan Tech Center, Hall B & Virtual Discord',
      organizationName: 'Global AI Foundation & Cloud Alliance',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      contactName: 'Alex Mercer',
      contactEmail: 'organizers@globalaihackathon.io',
      contactPhone: '+1 (555) 234-8901',
      websiteUrl: 'https://globalaihackathon.io',
      socialLinksJson: JSON.stringify({
        twitter: 'https://twitter.com/globalai',
        github: 'https://github.com/globalai-hack',
        discord: 'https://discord.gg/globalai',
      }),
      regOpenDate: new Date(),
      regCloseDate: new Date(futureDate1.getTime() - 24 * 60 * 60 * 1000),
      maxRegistrations: 250,
      isTeamEvent: true,
      maxTeamMembers: 4,
      requireCaptain: true,
      allowEditAfterSubmission: false,
      volunteerPasswordHash: hackathonVolPass,
      primaryColor: '#059669', // Emerald
      secondaryColor: '#064e3b',
      signatureNamesJson: JSON.stringify(['Dr. Evelyn Reed, Council Chair', 'Marcus Thorne, Chief Architect']),
      organizerId: adminA.id,
    },
  });

  // Custom Fields for Event 1 (T-Shirt Size removed)
  await prisma.customRegistrationField.createMany({
    data: [
      {
        eventId: event1.id,
        fieldName: 'github_profile',
        label: 'GitHub Profile URL',
        fieldType: 'TEXT',
        isRequired: true,
        orderIndex: 0,
      },
      {
        eventId: event1.id,
        fieldName: 'dietary_restrictions',
        label: 'Dietary Preferences',
        fieldType: 'DROPDOWN',
        optionsJson: JSON.stringify(['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free']),
        isRequired: false,
        orderIndex: 1,
      },
    ],
  });

  // Team 1: Neural Knights
  const team1 = await prisma.team.create({
    data: {
      teamCode: 'TEAM-2026-A101',
      eventId: event1.id,
      teamName: 'Neural Knights',
      status: 'ACTIVE',
    },
  });

  const reg1 = await prisma.registration.create({
    data: {
      registrationCode: 'REG-2026-NK001',
      eventId: event1.id,
      teamId: team1.id,
      fullName: 'Alex Rivera',
      participantIdCode: 'PART-AI-011',
      email: 'alex.rivera@example.com',
      organization: 'MIT Autonomous Lab',
      phone: '+1 555-0192',
      passStatus: 'ACTIVE',
      qrToken: secureToken(),
      isCaptain: true,
      volunteerOptIn: false,
      customFieldValuesJson: JSON.stringify({ github_profile: 'https://github.com/arivera-ai' }),
    },
  });

  const reg2 = await prisma.registration.create({
    data: {
      registrationCode: 'REG-2026-NK002',
      eventId: event1.id,
      teamId: team1.id,
      fullName: 'Sarah Chen',
      participantIdCode: 'PART-AI-012',
      email: 'sarah.chen@example.com',
      organization: 'MIT Autonomous Lab',
      phone: '+1 555-0193',
      passStatus: 'ACTIVE',
      qrToken: secureToken(),
      isCaptain: false,
      volunteerOptIn: true,
      customFieldValuesJson: JSON.stringify({ github_profile: 'https://github.com/schen-cloud' }),
    },
  });

  await prisma.team.update({
    where: { id: team1.id },
    data: { captainRegistrationId: reg1.id },
  });

  // Approved Volunteer for Event 1
  await prisma.volunteer.create({
    data: {
      eventId: event1.id,
      name: 'Sarah Chen',
      volunteerIdCode: 'VOL-2026-1042',
      email: 'sarah.chen@example.com',
    },
  });

  await prisma.volunteerRequest.create({
    data: {
      eventId: event1.id,
      registrationId: reg2.id,
      name: 'Sarah Chen',
      participantIdCode: 'PART-AI-012',
      email: 'sarah.chen@example.com',
      status: 'ACCEPTED',
    },
  });

  // 4. Event 2 (Owned by Admin A): International Tech Leaders Summit 2026 (Upcoming, Solo event)
  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 30); // 1 month in future

  const event2 = await prisma.event.create({
    data: {
      slug: 'international-tech-leaders-summit-2026',
      title: 'International Tech Leaders Summit 2026',
      description: 'The premier global summit for CTOs, Engineering VPs, and Technology Innovators exploring scalable enterprise computing, ethical AI governance, and digital transformation.',
      category: 'Conferences',
      type: 'PHYSICAL',
      status: 'REGISTRATION_OPEN',
      eventDate: futureDate2,
      startTime: '08:30 AM',
      endTime: '06:00 PM',
      durationHours: 9.5,
      timezone: 'Europe/London',
      locationOrLink: 'ExCeL London International Convention Centre, Royal Victoria Dock',
      organizationName: 'Global Leadership Institute',
      logoUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      contactName: 'Clara Oswald',
      contactEmail: 'summit@techleaders.org',
      contactPhone: '+44 20 7946 0912',
      websiteUrl: 'https://techleaders.org',
      regOpenDate: new Date(),
      regCloseDate: new Date(futureDate2.getTime() - 24 * 60 * 60 * 1000),
      maxRegistrations: 500,
      isTeamEvent: false,
      volunteerPasswordHash: summitVolPass,
      primaryColor: '#1e40af', // Blue
      secondaryColor: '#0f172a',
      signatureNamesJson: JSON.stringify(['Dame Clara Hughes, President', 'Arthur Vance, Program Chair']),
      organizerId: adminA.id,
    },
  });

  const regSummit1 = await prisma.registration.create({
    data: {
      registrationCode: 'REG-2026-TLS101',
      eventId: event2.id,
      fullName: 'Emily Zhang',
      participantIdCode: 'TL-EXEC-801',
      email: 'emily.zhang@techcorp.com',
      organization: 'TechCorp Global',
      phone: '+44 7700 900123',
      passStatus: 'ACTIVE',
      qrToken: secureToken(),
      isCaptain: false,
      volunteerOptIn: false,
    },
  });

  // A revoked pass for testing revocation logic
  await prisma.registration.create({
    data: {
      registrationCode: 'REG-2026-TLS103',
      eventId: event2.id,
      fullName: 'Aisha Khan (Revoked Pass Demo)',
      participantIdCode: 'TL-EXEC-803',
      email: 'aisha.khan.demo@enterprise.io',
      organization: 'Global Ventures',
      passStatus: 'REVOKED',
      qrToken: 'demo-revoked-token-aisha-12345',
      isCaptain: false,
      volunteerOptIn: false,
    },
  });

  // 5. Event 3 (Owned by Admin A): Quantum Computing Masterclass (Completed, has certificates)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 20);

  const event3 = await prisma.event.create({
    data: {
      slug: 'quantum-computing-security-masterclass',
      title: 'Quantum Computing & Post-Quantum Cryptography Masterclass',
      description: 'An advanced technical masterclass covering lattice-based cryptography, Shor algorithm mitigation, and quantum key distribution architectures.',
      category: 'Seminars',
      type: 'ONLINE',
      status: 'COMPLETED',
      eventDate: pastDate,
      startTime: '02:00 PM',
      endTime: '07:00 PM',
      durationHours: 5,
      timezone: 'UTC',
      locationOrLink: 'Zoom Webinar ID: 883-9921-4402',
      organizationName: 'Institute for Advanced Quantum Research',
      logoUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80',
      contactName: 'Prof. Nikolai Petrov',
      contactEmail: 'masterclass@iaqr.org',
      regOpenDate: new Date(pastDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      regCloseDate: new Date(pastDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      maxRegistrations: 100,
      isTeamEvent: false,
      volunteerPasswordHash: quantumVolPass,
      primaryColor: '#7c3aed', // Purple
      secondaryColor: '#2e1065',
      signatureNamesJson: JSON.stringify(['Prof. Nikolai Petrov, Director', 'Dr. Alistair Finch, Cryptography Lead']),
      organizerId: adminA.id,
    },
  });

  const regQuantum1 = await prisma.registration.create({
    data: {
      registrationCode: 'REG-2026-QC001',
      eventId: event3.id,
      fullName: 'Dr. Elena Rostova',
      participantIdCode: 'RES-QUANTUM-01',
      email: 'elena.rostova@oxford.ac.uk',
      organization: 'University of Oxford',
      passStatus: 'ACTIVE',
      qrToken: secureToken(),
      isCaptain: false,
      volunteerOptIn: false,
      eligibilityStatus: 'APPROVED',
    },
  });

  const certTemplate = await prisma.certificateTemplate.create({
    data: {
      eventId: event3.id,
      name: 'Technology & Futuristic',
      designType: 'AI_GENERATED',
      templateConfigJson: JSON.stringify({
        primaryColor: '#7c3aed',
        accentColor: '#10b981',
        themeName: 'Technology & Futuristic',
      }),
      isApproved: true,
    },
  });

  await prisma.certificate.create({
    data: {
      certificateCode: 'CERT-2026-000101',
      eventId: event3.id,
      registrationId: regQuantum1.id,
      recipientName: 'Dr. Elena Rostova',
      organization: 'University of Oxford',
      certificateType: 'WINNER',
      awardPosition: '1st Place Winner',
      templateId: certTemplate.id,
      emailStatus: 'SENT',
      emailSentAt: new Date(),
    },
  });

  // 6. Event 4 (Owned by Admin B for Organizer Isolation): Apex Robotics Championship 2026
  const futureDateB = new Date();
  futureDateB.setDate(futureDateB.getDate() + 45);

  await prisma.event.create({
    data: {
      slug: 'apex-robotics-championship-2026',
      title: 'Apex Robotics National Championship 2026',
      description: 'National autonomous robotics engineering championship and drone navigation challenge.',
      category: 'Competitions',
      type: 'PHYSICAL',
      status: 'REGISTRATION_OPEN',
      eventDate: futureDateB,
      startTime: '10:00 AM',
      endTime: '06:00 PM',
      timezone: 'America/Chicago',
      locationOrLink: 'Apex Engineering Arena, Chicago',
      organizationName: 'Apex Science Institute',
      contactName: 'Prof. Marcus Thorne',
      contactEmail: 'organizer.b@university.edu',
      primaryColor: '#dc2626', // Red
      secondaryColor: '#450a0a',
      organizerId: adminB.id,
    },
  });

  // Email Logs for Event 1 & Event 3
  await prisma.emailLog.createMany({
    data: [
      {
        eventId: event1.id,
        registrationId: reg1.id,
        recipientEmail: 'alex.rivera@example.com',
        subject: 'Registration Confirmed: Global AI & Cloud Hackathon 2026',
        emailType: 'WELCOME',
        status: 'SENT',
      },
      {
        eventId: event2.id,
        registrationId: regSummit1.id,
        recipientEmail: 'emily.zhang@techcorp.com',
        subject: 'Registration Confirmed: International Tech Leaders Summit 2026',
        emailType: 'WELCOME',
        status: 'SENT',
      },
      {
        eventId: event3.id,
        registrationId: regQuantum1.id,
        recipientEmail: 'elena.rostova@oxford.ac.uk',
        subject: 'Your Certificate for Quantum Computing Masterclass is Ready!',
        emailType: 'CERTIFICATE',
        status: 'SENT',
      },
    ],
  });

  console.log('Database seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
