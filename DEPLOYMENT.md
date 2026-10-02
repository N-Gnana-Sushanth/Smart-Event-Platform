# Smart Event Platform — Production Deployment Guide

This guide provides step-by-step instructions for deploying the **Smart Event Management & Digital Credential Platform** across the production architecture:

* **Frontend**: React + Vite → **Netlify**
* **Backend**: Node.js + Express + Prisma → **Render** (or Railway / Fly.io)
* **Database**: **MongoDB Atlas**
* **ORM**: Prisma with MongoDB (`provider = "mongodb"`)

---

## 1. MongoDB Atlas Setup

### Step 1: Create a Cluster
1. Sign in or create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create** and select the **M0 Free** shared cluster tier.
3. Choose your preferred cloud provider (AWS / Google Cloud) and region closest to your users.
4. Name your cluster (e.g. `Cluster0`) and click **Create Deployment**.

### Step 2: Configure Database Access (User Credentials)
1. In the Atlas sidebar, navigate to **Security → Database Access**.
2. Click **Add New Database User**.
3. Authentication Method: **Password**.
4. Enter a Username (e.g. `smartevent_admin`) and generate a secure Password.
5. Under **Database User Privileges**, select **Read and write to any database** (or **Atlas admin**).
6. Click **Add User**. *(Save this username and password for your connection string!)*

### Step 3: Configure Network Access (IP Whitelist)
1. In the Atlas sidebar, navigate to **Security → Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access from Anywhere** (`0.0.0.0/0`) so that hosting providers like Render and your local development environment can connect.
4. Click **Confirm**.

### Step 4: Obtain Connection String
1. Navigate to **Deployments → Database**.
2. Click **Connect** on your cluster.
3. Choose **Drivers** (Node.js).
4. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartevent?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials and set the database name to `smartevent`.

---

## 2. Backend Deployment on Render

### Step 1: Create a New Web Service
1. Sign in to [Render.com](https://render.com).
2. Click **New + → Web Service**.
3. Connect your GitHub repository containing the `smart-event-platform`.

### Step 2: Configure Service Settings
| Setting | Recommended Value |
| :--- | :--- |
| **Name** | `smart-event-backend` |
| **Region** | Closest to your MongoDB Atlas cluster |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (or Starter) |

### Step 3: Set Backend Environment Variables
In the Render Web Service dashboard, go to the **Environment** tab and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enforces production security checks |
| `PORT` | `10000` *(or leave blank for Render default)* | Server listening port |
| `DATABASE_URL` | `mongodb+srv://user:pass@cluster0.../smartevent` | Your MongoDB Atlas connection string |
| `CLIENT_URL` | `https://your-site.netlify.app` | URL of your deployed Netlify frontend |
| `JWT_SECRET` | *(Generate a random 32+ char string)* | Secret for signing auth tokens |
| `EMAIL_CREDENTIAL_ENCRYPTION_KEY` | *(Generate a random 32-byte string)* | AES key for encrypting SMTP passwords |
| `EMAIL_PROVIDER` | `mock` *(or `smtp`)* | Default email mode |
| `SUPPORT_EMAIL` | `support@smartevent.io` | Support contact address |
| `AI_PROVIDER` | `mock` *(or `gemini` / `openai`)* | Certificate Studio generator |
| `GEMINI_API_KEY` | *(Optional Google Gemini API key)* | Required if `AI_PROVIDER=gemini` |

> **Generate Random Secrets**: You can generate strong 32-byte keys with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Step 4: Initialize MongoDB Schema & Seed
After Render deploys the backend, initialize your MongoDB database:
1. Open the Render **Shell** tab (or run locally pointed to your Atlas `DATABASE_URL`):
   ```bash
   npx prisma db push
   npm run seed
   ```
2. Your MongoDB Atlas cluster will now be seeded with initial organizers, events, and templates!

---

## 3. Frontend Deployment on Netlify

### Step 1: Connect GitHub to Netlify
1. Sign in to [Netlify](https://app.netlify.com).
2. Click **Add new site → Import an existing project**.
3. Authorize GitHub and select your repository.

### Step 2: Configure Netlify Build Settings
The repository includes pre-configured [`netlify.toml`](./netlify.toml) and [`frontend/netlify.toml`](./frontend/netlify.toml):

| Setting | Value |
| :--- | :--- |
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/dist` *(or `dist` if base is `frontend`)* |

### Step 3: Set Frontend Environment Variables
In Netlify, go to **Site settings → Environment variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://smart-event-backend.onrender.com/api` | The public URL of your Render backend API |

### Step 4: Deploy Site
Click **Deploy site**. Netlify will build the React application and deploy it with full SPA routing (`_redirects` support).

---

## 4. File Uploads & Persistent Storage in Production

* **Current Implementation**:
  - Uploaded custom certificate template backgrounds and generated certificate PDFs are saved to `backend/uploads/` via Multer.
  - In addition, digital passes and certificate verifications render **on-the-fly dynamically** using cryptographic tokens and public QR code endpoints.
* **Production Recommendation**:
  - For stateless server instances (e.g. Render Free Tier), dynamic certificate generation and on-the-fly streaming (`GET /api/certificates/:id/pdf` and `POST /api/certificates/preview/pdf`) operate in-memory without requiring persistent disk storage.
  - For custom uploaded template backgrounds, you can attach a **Persistent Disk** on Render (mounted at `/backend/uploads`) or integrate cloud object storage (AWS S3 / Cloudinary) by setting standard S3 environment variables if required.

---

## 5. Local Development Quickstart

### 1. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm run install:all
```

### 2. Configure Local Environment
* Backend `.env`:
  ```env
  PORT=5000
  NODE_ENV=development
  DATABASE_URL="mongodb://localhost:27017/smartevent" # Or your MongoDB Atlas URI
  JWT_SECRET=dev-only-insecure-jwt-secret-do-not-use-in-production-12345
  EMAIL_CREDENTIAL_ENCRYPTION_KEY=dev-only-insecure-encryption-key-32bytes-sample-test
  CLIENT_URL=http://localhost:5173
  EMAIL_PROVIDER=mock
  AI_PROVIDER=mock
  ```
* Frontend `.env`:
  ```env
  VITE_API_URL=http://localhost:5000/api
  ```

### 3. Initialize Prisma & Seed Database
```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

### 4. Start Development Servers
* In terminal 1 (Backend):
  ```bash
  cd backend
  npm run dev
  ```
* In terminal 2 (Frontend):
  ```bash
  cd frontend
  npm run dev
  ```
* Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Default Administrative & Demo Accounts

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Organizer A** | `admin@smartevent.com` | `AdminPass123!` | Event Administrator |
| **Organizer B** | `organizer.b@university.edu` | `AdminPass123!` | Multi-Tenant Organizer |
| **Participant** | `alex.rivera@example.com` | `AdminPass123!` | Participant Portal |
| **Volunteer (Hackathon)** | `VOL-2026-1042` | `volunteer2026` | Event Gate Scanner |
