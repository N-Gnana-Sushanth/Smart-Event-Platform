# Smart Event Management & Digital Credential Platform

A real, production-ready full-stack web platform for colleges, universities, companies, conferences, hackathons, clubs, communities, workshops, and competitions worldwide.

The platform manages the complete event lifecycle:

**Create Event ? Publish Event ? Register Participants ? Generate Secure Digital Pass ? Volunteer QR Verification ? Communicate With Participants ? Generate AI-Assisted Digital Certificates ? Distribute Credentials ? Publicly Verify Certificates**

---

## ??? Strict Anti-Attendance Architecture (Rule 1)

This platform is **NOT an attendance system**.
- **No Attendance Table**: There is no attendance table or database check-in schema.
- **Pass Verification Only**: The Volunteer QR Scanner strictly verifies that a participant holds an active, unrevoked registration for that specific event.
- **Zero Attendance Metrics**: There are no check-in timestamps, attendance percentages, present/absent counters, or attendance analytics anywhere in the codebase.
- **Independent Eligibility**: Certificate eligibility is determined by registration status or administrative approval, **never by attendance**.

---

## ? Core Features

1. **Complete Event Lifecycle Management**:
   - Statuses: `DRAFT` ? `REGISTRATION_OPEN` ? `REGISTRATION_CLOSED` ? `EVENT_LIVE` ? `COMPLETED` ? `ARCHIVED`.
   - Automatic registration deadline enforcement.
   - Comprehensive event branding: logos, banners, primary/secondary colors, and authorized signatories.

2. **Public Event Discovery & Custom Registration**:
   - Shareable public event pages (e.g., `/events/global-ai-cloud-hackathon-2026`).
   - Dynamic custom fields builder: Text, Number, Email, Dropdowns, Radio buttons, Checkboxes, and File uploads.
   - Support for Solo registrations and Multi-Member Team registrations (with configurable team size caps and captain assignment).

3. **Cryptographically Secure Digital Event Passes**:
   - Unpredictable, high-entropy random QR credential tokens (`crypto.randomBytes(24)`).
   - Personal data is **never** embedded inside the QR code.
   - Printable & downloadable digital passes with barcodes, branding, venue details, and registration codes.

4. **Volunteer Staff System & QR Scanner**:
   - Browser-based camera scanner powered by `html5-qrcode` with image file upload and manual input fallback.
   - Event-scoped volunteer authorization via event password and volunteer identifier.
   - Clear visual validation: **VALID REGISTRATION**, **PASS REVOKED**, **REGISTRATION CANCELLED**, and **INVALID QR**.
   - Admin pass revocation controls.

5. **AI-Assisted Certificate Studio**:
   - Generates 5 distinct AI design themes based on event category, branding, and theme:
     1. Modern Professional (Corporate / Conferences)
     2. Elegant Academic (Colleges & Universities)
     3. Technology & Futuristic (Hackathons & Tech Summits)
     4. Minimal Corporate (Executive & Seminars)
     5. Creative Competition (Clubs, Arts & Competitions)
   - Custom certificate template background uploader (PNG / JPG / PDF).
   - Live sample preview with actual participant data prior to generation.
   - Winner selection: 1st, 2nd, and 3rd place for individual and team events (with individual certificate generated for every team member).
   - High-resolution vector PDF generation using `pdf-lib` with ornate borders, gold seals, and embedded verification QR codes.

6. **Public Credential Verification**:
   - Publicly verifiable credential page at `/verify/:certificateCode` (e.g. `/verify/CERT-2026-000101`).
   - Green verified shield, authentic credential metadata, issuing organization, recipient name, award position, and direct PDF download.

7. **Bulk Export & Distribution**:
   - Bulk ZIP download of individual participant PDF certificates.
   - Combined multi-page single PDF download.
   - Participant roster CSV export.
   - Email dispatch queue with delivery status tracking (Sent, Pending, Failed) and one-click retry.
   - Background 2-hour event reminder scheduler respecting event timezones.

8. **Participant Self-Service Portal**:
   - Participants can view all registered events, active digital passes, and conferred certificates across institutions in one place at `/portal`.

---

## ??? Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, `html5-qrcode`, `qrcode.react`, `canvas-confetti`, React Router v6.
- **Backend**: Node.js, Express.js (ES Modules), Prisma ORM v5.22, `pdf-lib`, `archiver`, `qrcode`, `nodemailer`, `bcryptjs`, `jsonwebtoken`, `multer`.
- **Database**: SQLite for zero-dependency instant local execution (`dev.db`), seamlessly switchable to PostgreSQL by updating `DATABASE_URL` and `provider` in `schema.prisma`.

---

## ?? Quick Start Guide

### Prerequisites
- Node.js v18+ and npm installed.

### 1. Setup & Seed Database
From the project root:
```powershell
# Install backend dependencies
cd backend
npm install

# Push Prisma schema and seed demo database
npx prisma generate
npx prisma db push
node prisma/seed.js
cd ..
```

### 2. Start Backend Server
```powershell
cd backend
npm run dev
# Server will run on http://localhost:5000
```

### 3. Start Frontend App
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
# App will run on http://localhost:5173
```

---

## ?? Demo & Test Credentials

### Organizer / Admin Account
- **URL**: `http://localhost:5173/admin/login`
- **Email**: `admin@smartevent.com`
- **Password**: `AdminPass123!`

### Volunteer QR Scanner Access
- **URL**: `http://localhost:5173/volunteer/login`
- **Assigned Event**: Global AI & Cloud Hackathon 2026
- **Volunteer ID**: `VOL-2026-1042`
- **Event Password**: `volunteer2026`

### Public Certificate Verification Demo
- **URL**: `http://localhost:5173/verify/CERT-2026-000101`
- Displays verified credential for Dr. Elena Rostova (1st Place Winner, Quantum Computing Masterclass).

### Participant Portal Demo
- **URL**: `http://localhost:5173/portal`
- **Email**: `alex.rivera@example.com` or `elena.rostova@oxford.ac.uk`

---

## ?? Automated Testing

Run the full end-to-end integration test suite:
```powershell
node test_e2e.js
```
Tests verify admin login, public event discovery, solo and team registrations, pass retrieval, volunteer auth, anti-attendance QR validation, AI certificate suggestions, bulk PDF generation, public credential verification, bulk ZIP and combined PDF downloads, and email logs.
