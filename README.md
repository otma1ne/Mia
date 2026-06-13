# EduDrive — Driving School Management Platform

A full-stack management platform for driving schools, built with Next.js 16 App Router. Covers the complete lifecycle from student recruitment and e-signature workflows through training delivery, exams, practical driving sessions, and post-formation feedback.

---

## Features

### Roles

| Role | Access |
|---|---|
| **Admin** | Full access — students, trainers, formations, vehicles, inscriptions, commercial pipeline, center settings |
| **Trainer** | Assigned modules, attendance, grading, schedule |
| **Student** | Enrolled formations, modules, exams, documents, schedule |
| **Commercial** | Prospect contact pipeline (Nouveau → Contacté → Relancé → Converti) |

### Modules

- **Inscriptions** — Application workflow with admin evaluation, PDF generation, and multi-document e-signature via YouSign
- **Formations** — Training programs with theory, practical, and assessment modules; sequential module unlocking
- **Exams** — QCM, true/false, and open-ended questions; auto-grading + manual grading for open questions
- **Attendance** — Per-session tracking (present / absent / late / excused) with percentage calculation
- **Vehicles** — Fleet status, maintenance dates, insurance expiry alerts, archive with sale info
- **Bilans** — Post-formation feedback surveys (Bilan Chaud immediately after, Bilan Froid at 30 days) with PDF storage
- **Commercial** — Sales CRM with contact status history and notes
- **Schedule** — Unified calendar for sessions, rooms, and vehicles with conflict detection
- **Center** — Operating hours, rooms, logo, rules documents (règlement intérieur, CGV)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 — App Router, Server Components |
| Language | TypeScript 5 (strict) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Lucide React |
| Database | MongoDB via Prisma 6 |
| Auth | NextAuth v5 (JWT, credentials) |
| File storage | Cloudinary |
| PDF generation | React PDF Renderer |
| Email | Nodemailer (SMTP) |
| E-signature | YouSign API |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (Atlas or local)
- Cloudinary account
- SMTP credentials (e.g. Gmail App Password)
- YouSign account (for e-signature features)

### Installation

```bash
# Install dependencies
yarn install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local — see Environment Variables section below

# Generate Prisma client
yarn db:generate

# Push schema to database
yarn db:push

# (Optional) Seed initial data
yarn db:seed

# Start dev server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
yarn dev          # Development server with Turbopack
yarn build        # Production build (runs prisma generate first)
yarn start        # Production server
yarn lint         # ESLint
yarn db:generate  # Generate Prisma client
yarn db:push      # Sync schema to MongoDB
yarn db:studio    # Prisma Studio — visual database browser
yarn db:seed      # Seed database with initial data
```

---

## Environment Variables

Create `.env.local` at the project root:

```env
# Database
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority

# Auth
AUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="EduDrive <noreply@yourdomain.com>"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# YouSign (e-signature)
YOUSIGN_API_KEY=your-api-key
YOUSIGN_ENV=sandbox
YOUSIGN_WEBHOOK_SECRET=your-webhook-secret

# Cron jobs (protects /api/cron/* endpoints)
CRON_SECRET=<random-secret>
```

---

## Project Structure

```
app/
├── (admin)/admin/          # Admin dashboard and all management pages
├── (commercial)/commercial/ # Commercial rep space
├── (trainer)/trainer/      # Trainer space
├── (student)/student/      # Student space
├── api/                    # Route handlers (auth, cron jobs, uploads, webhooks)
├── actions/                # Server Actions
└── ...

components/
├── ui/                     # Base UI components (shadcn/ui)
└── layout/                 # Shell, sidebar, header

lib/
├── auth.ts                 # Auth helpers and requireRole()
├── db.ts                   # Prisma client
├── email.ts                # Email sending functions
├── validations/            # Zod schemas

prisma/
└── schema.prisma           # MongoDB schema
```

---

## Deployment

The project is configured for deployment on **Vercel**.

1. Push to GitHub
2. Import the repository in Vercel
3. Add all environment variables in the Vercel dashboard
4. Deploy — `prisma generate` runs automatically during build

For cron jobs (Bilan reminders, vehicle alerts), configure Vercel Cron or an external scheduler to call `/api/cron/formation-bilan` and `/api/cron/vehicles` with the `CRON_SECRET` header.
