import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { encryptCredential } from '../utils/crypto.js';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEEDING SINGLE REALISTIC DEMONSTRATION TEST CASE ===');

  // 1. Clean existing records to keep strictly ONE demonstration record
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

  // 2. Create Event Administrator / Faculty Coordinator Account
  const passwordHash = await bcrypt.hash('AdminPass123!', 10);
  const organizer = await prisma.user.create({
    data: {
      name: 'Dr. K. Srinivas',
      email: 'admin@smartevent.com',
      passwordHash,
      role: 'ADMIN',
      organization: 'G. Pulla Reddy Engineering College (Autonomous)',
    },
  });

  // 3. Organizer Email Sending Configuration
  await prisma.organizerEmailConfig.create({
    data: {
      userId: organizer.id,
      senderEmail: 'events@gprec.ac.in',
      senderDisplayName: 'GPREC Event Directorate',
      smtpHost: 'smtp.mailtrap.io',
      smtpPort: 587,
      smtpUser: 'gprec_mailer',
      smtpPassword: encryptCredential('gprec_secret_smtp_pass_2026'),
      secure: false,
      isVerified: true,
    },
  });

  // 4. Create Exactly ONE Realistic Event: National Collegiate AI & Cloud Hackathon 2026
  const futureEventDate = new Date();
  futureEventDate.setDate(futureEventDate.getDate() + 14); // 2 weeks in future
  futureEventDate.setHours(9, 0, 0, 0);

  const volunteerPasswordHash = await bcrypt.hash('volunteer2026', 10);

  const event = await prisma.event.create({
    data: {
      slug: 'national-collegiate-ai-hackathon-2026',
      title: 'National Collegiate AI & Cloud Hackathon 2026',
      description: 'A flagship 36-hour inter-collegiate hackathon and innovation sprint hosted by the Department of Computer Science & Engineering in collaboration with the Innovation & Entrepreneurship Cell. University teams will collaborate to architect and deploy production-ready AI agents, edge IoT solutions, and resilient cloud architectures.',
      category: 'Hackathons',
      type: 'HYBRID',
      status: 'REGISTRATION_OPEN',
      eventDate: futureEventDate,
      startTime: '09:00 AM',
      endTime: '08:00 PM',
      durationHours: 36,
      timezone: 'Asia/Kolkata',
      locationOrLink: 'Main Auditorium & Advanced Computing Labs, Tech Block-A',
      organizationName: 'G. Pulla Reddy Engineering College (Autonomous)',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      contactName: 'Dr. K. Srinivas (Faculty Coordinator)',
      contactEmail: 'events@gprec.ac.in',
      contactPhone: '+91 98765 43210',
      websiteUrl: 'https://hackathon.gprec.ac.in',
      socialLinksJson: JSON.stringify({
        twitter: 'https://twitter.com/gprec_hack',
        github: 'https://github.com/gprec-innovation',
        discord: 'https://discord.gg/gprec-ai',
      }),
      regOpenDate: new Date(),
      regCloseDate: new Date(futureEventDate.getTime() - 24 * 60 * 60 * 1000),
      maxRegistrations: 200,
      isTeamEvent: true,
      maxTeamMembers: 4,
      requireCaptain: true,
      allowEditAfterSubmission: false,
      volunteerPasswordHash,
      primaryColor: '#2563eb', // Royal Blue
      secondaryColor: '#0f172a',
      signatureNamesJson: JSON.stringify(['Dr. K. Srinivas, Event Convener', 'Dr. B. Sreenivasa Reddy, Principal']),
      organizerId: organizer.id,
    },
  });

  // 5. Custom Registration Fields for College Students
  await prisma.customRegistrationField.createMany({
    data: [
      {
        eventId: event.id,
        fieldName: 'department_year',
        label: 'Department & Year of Study',
        fieldType: 'DROPDOWN',
        optionsJson: JSON.stringify(['CSE - 3rd Year', 'CSE - 4th Year', 'ECE - 3rd Year', 'ECE - 4th Year', 'IT - 3rd Year', 'Other Department']),
        isRequired: true,
        orderIndex: 0,
      },
      {
        eventId: event.id,
        fieldName: 'github_profile',
        label: 'GitHub / Project Portfolio URL',
        fieldType: 'TEXT',
        isRequired: true,
        orderIndex: 1,
      },
      {
        eventId: event.id,
        fieldName: 'dietary_preference',
        label: 'Meal Preference',
        fieldType: 'DROPDOWN',
        optionsJson: JSON.stringify(['Standard Meals', 'Vegetarian', 'Vegan']),
        isRequired: false,
        orderIndex: 2,
      },
    ],
  });

  // 6. Exactly ONE Sample Team & Registered Participant
  const team = await prisma.team.create({
    data: {
      teamCode: 'TEAM-2026-AI01',
      eventId: event.id,
      teamName: 'Neural Innovations',
      status: 'ACTIVE',
      awardPosition: 1,
    },
  });

  const registration = await prisma.registration.create({
    data: {
      registrationCode: 'REG-2026-AI0101',
      eventId: event.id,
      teamId: team.id,
      fullName: 'Rahul Sharma',
      participantIdCode: '229X1A0501',
      email: 'rahul.sharma@student.gprec.ac.in',
      organization: 'G. Pulla Reddy Engineering College - CSE',
      phone: '+91 91234 56789',
      passStatus: 'ACTIVE',
      qrToken: 'pass-token-rahul-ai2026-valid',
      isCaptain: true,
      volunteerOptIn: false,
      eligibilityStatus: 'APPROVED',
      customFieldValuesJson: JSON.stringify({
        department_year: 'CSE - 3rd Year',
        github_profile: 'https://github.com/rahul-sharma-dev',
        dietary_preference: 'Vegetarian',
      }),
    },
  });

  // Link Team Captain
  await prisma.team.update({
    where: { id: team.id },
    data: { captainRegistrationId: registration.id },
  });

  // 7. Exactly ONE Volunteer Record & Request for Gate Pass Scanner
  await prisma.volunteer.create({
    data: {
      eventId: event.id,
      name: 'Priya Patel',
      volunteerIdCode: 'VOL-2026-101',
      email: 'priya.patel@student.gprec.ac.in',
    },
  });

  await prisma.volunteerRequest.create({
    data: {
      eventId: event.id,
      registrationId: registration.id,
      name: 'Priya Patel',
      participantIdCode: '229X1A0542',
      email: 'priya.patel@student.gprec.ac.in',
      status: 'ACCEPTED',
    },
  });

  // 8. Exactly ONE Certificate Template & Issued Certificate for Public Verification
  const certTemplate = await prisma.certificateTemplate.create({
    data: {
      eventId: event.id,
      name: 'Academic Excellence & AI Innovation',
      designType: 'AI_GENERATED',
      templateConfigJson: JSON.stringify({
        primaryColor: '#2563eb',
        accentColor: '#f59e0b',
        themeName: 'Academic Excellence & AI Innovation',
      }),
      isApproved: true,
    },
  });

  await prisma.certificate.create({
    data: {
      certificateCode: 'CERT-2026-AI0101',
      eventId: event.id,
      registrationId: registration.id,
      recipientName: 'Rahul Sharma',
      organization: 'G. Pulla Reddy Engineering College',
      certificateType: 'WINNER',
      awardPosition: '1st Place (AI Innovation Sprint)',
      issueDate: new Date(),
      templateId: certTemplate.id,
      emailStatus: 'SENT',
      emailSentAt: new Date(),
    },
  });

  // 9. Initial Email Log
  await prisma.emailLog.create({
    data: {
      organizerId: organizer.id,
      senderEmail: 'events@gprec.ac.in',
      eventId: event.id,
      registrationId: registration.id,
      recipientEmail: 'rahul.sharma@student.gprec.ac.in',
      subject: 'Registration Confirmed: National Collegiate AI & Cloud Hackathon 2026',
      emailType: 'WELCOME',
      status: 'SENT',
    },
  });

  console.log('\n🌟 SINGLE REALISTIC TEST CASE SEEDED SUCCESSFULLY! 🌟\n');
  console.log('Event Name:        National Collegiate AI & Cloud Hackathon 2026');
  console.log('Event Slug:        national-collegiate-ai-hackathon-2026');
  console.log('Admin Email:       admin@smartevent.com');
  console.log('Admin Password:    AdminPass123!');
  console.log('Volunteer ID:      VOL-2026-101');
  console.log('Volunteer Pass:    volunteer2026');
  console.log('Sample Pass Code:  REG-2026-AI0101');
  console.log('Certificate Code:  CERT-2026-AI0101');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
