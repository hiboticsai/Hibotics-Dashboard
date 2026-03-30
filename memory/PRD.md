# HiBotics AI - Multi-Tenant SaaS Dashboard PRD

## Project Overview
Multi-tenant SaaS dashboard for HiBotics AI providing AI voice receptionist analytics, lead CRM, social media insights, client onboarding, and admin management.

## Architecture
- **Frontend**: React 18 with Shadcn UI, TailwindCSS, Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT + Emergent Google OAuth

## User Personas
1. **Admin (HiBotics AI Internal)**: Manages all companies, users, agents, billing, and onboarding submissions
2. **Client (Business Owner)**: Views their own analytics, manages leads, sees social insights
3. **New Client (Prospect)**: Completes onboarding wizard to set up AI receptionist

## Core Requirements (Static)

### Authentication
- [x] JWT-based email/password login
- [x] Emergent Google OAuth integration
- [x] Role-based access (admin/client)
- [x] Multi-tenant security middleware

### White-Label Portals
- [x] Path-based routing: `/portal/[companySlug]`
- [x] Custom branding per company (logo, colors, brand name)
- [x] "Powered by HiBotics AI" toggle
- [ ] Subdomain support (nice to have)

### Client Onboarding Flow (NEW - March 30, 2026)
- [x] 7-step onboarding wizard at `/onboarding`
- [x] Step 1: Account creation (skipped if already logged in)
- [x] Step 2: Business profile (name, industry, size)
- [x] Step 3: Website info (URL, social links)
- [x] Step 4: Discovery questions (5 pain point questions)
- [x] Step 5: Receptionist preferences (hours, services, instructions)
- [x] Step 6: Voice picker with ElevenLabs sample voices and audio preview
- [x] Step 7: Review and submit
- [x] Admin management at `/admin/onboarding` with status tracking and notes

### Client Portal Features
- [x] Dashboard with KPIs (calls, bookings, leads, minutes, conversion, revenue)
- [x] Call Log with filters and detail modal (transcript, summary, recording)
- [x] Lead CRM with status management (new/contacted/booked/won/lost)
- [x] Social Media Insights (followers, reach, engagement, charts)
- [x] Reports page with PDF export
- [x] Settings page with notifications preferences

### Admin Dashboard Features
- [x] Overview with global KPIs
- [x] **Client Onboarding Management** (NEW)
- [x] Companies management (CRUD)
- [x] Users management (create, assign to company)
- [x] Agents management (CRUD)
- [x] Billing tracker (status updates)

### UI/UX
- [x] Light/Dark mode toggle
- [x] HiBotics brand colors (cyan #4BACC6, gold #FFCC00)
- [x] Glassmorphism card design
- [x] Responsive layout
- [x] Recharts visualizations

## What's Been Implemented

### March 30, 2026 - Client Onboarding System
- **Backend**: 
  - New collections: `onboarding_submissions`, `onboarding_discovery_answers`
  - Pydantic models for onboarding data
  - API endpoints: `/api/onboarding/discovery-questions`, `/api/onboarding/voices`, `/api/onboarding/submit`
  - Admin endpoints: `/api/onboarding/submissions`, `/api/onboarding/stats`
  - 12 sample ElevenLabs voices with preview URLs
- **Frontend**:
  - 7-step wizard component with progress indicator
  - Step components: AccountStep, BusinessProfileStep, WebsiteInfoStep, DiscoveryStep, PreferencesStep, VoicePickerStep, ReviewStep
  - Voice picker with audio preview playback
  - Admin pages: OnboardingManagement, OnboardingDetail
  - Success page after submission
  - Badge component variants (warning, success, info)

### March 4, 2026 - Initial Implementation
- Full REST API with /api prefix
- All data models (users, companies, agents, calls, leads, social accounts, metrics, billing)
- JWT authentication with bcrypt password hashing
- Emergent OAuth session exchange
- Multi-tenant middleware (tenant resolution by company_id)
- Dashboard KPIs and analytics endpoints
- PDF report generation (server-side text format)
- Complete frontend routing (React Router)
- AuthContext, ThemeContext, TenantContext
- Admin Dashboard with KPIs, charts, performance table
- Client Portal: Dashboard, Calls, Leads, Social, Reports, Settings

### Data Seeded
- 1 admin user (admin@hibotics.ai / admin123)
- 2 companies (Inlux Wellness, Ayur Villa Spa)
- 2 agents (1 per company)
- 30 sample calls
- 16 sample leads
- 3 social accounts with 14 days of metrics
- 6 billing records

## Database Collections
- `users`: User accounts with roles (admin/client)
- `companies`: Company/tenant records with branding
- `agents`: AI voice agents
- `calls`: Call records with transcripts
- `leads`: Lead CRM data
- `social_accounts`: Connected social platforms
- `social_metrics`: Social media performance data
- `billing`: Monthly billing records
- `onboarding_submissions`: Client onboarding submissions (NEW)
- `onboarding_discovery_answers`: Discovery question answers (NEW)

## API Endpoints

### Onboarding (NEW)
- `GET /api/onboarding/discovery-questions` - Get discovery questions
- `GET /api/onboarding/voices` - Get available AI voices
- `GET /api/onboarding/voice-preview/{voice_id}` - Get voice preview audio
- `POST /api/onboarding/submit` - Submit onboarding data
- `GET /api/onboarding/submissions` (admin) - List all submissions
- `GET /api/onboarding/submissions/{id}` (admin) - Get submission details
- `PUT /api/onboarding/submissions/{id}` (admin) - Update submission status
- `POST /api/onboarding/submissions/{id}/notes` (admin) - Add admin note
- `GET /api/onboarding/stats` (admin) - Get onboarding statistics

## Prioritized Backlog

### P0 (Must Have)
- [x] All core features implemented
- [x] Client onboarding flow

### P1 (Should Have)
- [ ] Real ElevenLabs API integration (currently using sample voices)
- [ ] Email notifications for new onboarding submissions
- [ ] Real PDF generation (currently text file)
- [ ] User password reset flow
- [ ] Bulk actions on leads/calls

### P2 (Nice to Have)
- [ ] Automated Retell AI setup from onboarding data
- [ ] Subdomain routing support
- [ ] Real voice provider webhook integration
- [ ] Real social media API integration (Meta Graph, TikTok)
- [ ] Export data to CSV
- [ ] Advanced analytics with date range filters

## Notes
- ElevenLabs integration uses sample voices with real preview URLs. To enable live voice generation, add `ELEVENLABS_API_KEY` to backend .env
- Onboarding supports both new users (account created on submit) and logged-in users (account info pre-filled)
