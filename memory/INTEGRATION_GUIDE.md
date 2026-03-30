# HiBotics AI Dashboard Integration Guide

## Overview
This guide contains everything needed to integrate the full analytics dashboard into the hiboticsai.com website.

## What's Being Integrated

### 1. Authentication System
- JWT-based email/password login
- Google OAuth via Emergent Auth
- Role-based access (admin/client)
- Session management

### 2. Admin Dashboard (`/admin/*`)
- Overview with global KPIs
- **Client Onboarding Management** - review new submissions
- Companies management (CRUD)
- Users management
- Agents management  
- Billing tracker

### 3. Client Portal (`/portal/[companySlug]/*`)
- Dashboard with KPIs (calls, bookings, leads, revenue)
- Call Log with transcripts and recordings
- Lead CRM with status management
- Social Media Insights
- Reports with PDF export
- Settings

### 4. Onboarding Flow (`/onboarding`)
- 7-step wizard for new clients
- Voice picker with ElevenLabs samples
- Auto email notification to info@hiboticsai.com

## Database Collections (MongoDB)

```
users                      - User accounts with roles
companies                  - Company/tenant records with branding
agents                     - AI voice agents
calls                      - Call records with transcripts
leads                      - Lead CRM data
social_accounts           - Connected social platforms
social_metrics            - Social media performance data
billing                   - Monthly billing records
user_sessions             - OAuth session tokens
onboarding_submissions    - Client onboarding submissions
onboarding_discovery_answers - Discovery question answers
```

## Environment Variables Needed

### Backend (.env)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="hibotics_database"
CORS_ORIGINS="*"
JWT_SECRET="your-secure-secret-key-change-in-production"
RESEND_API_KEY=re_your_key_here
NOTIFICATION_EMAIL=info@hiboticsai.com
ELEVENLABS_API_KEY=optional_for_live_tts
```

## API Endpoints Summary

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/session (OAuth)
- GET /api/auth/me
- POST /api/auth/logout

### Companies
- GET /api/companies (admin)
- GET /api/companies/{id}
- GET /api/companies/slug/{slug}
- POST /api/companies (admin)
- PUT /api/companies/{id} (admin)
- DELETE /api/companies/{id} (admin)

### Agents
- GET /api/agents
- POST /api/agents
- PUT /api/agents/{id}
- DELETE /api/agents/{id}

### Calls
- GET /api/calls
- GET /api/calls/{id}
- POST /api/calls

### Leads
- GET /api/leads
- GET /api/leads/{id}
- POST /api/leads
- PUT /api/leads/{id}
- DELETE /api/leads/{id}

### Social
- GET /api/social-accounts
- POST /api/social-accounts
- DELETE /api/social-accounts/{id}
- GET /api/social-metrics
- POST /api/social-metrics

### Billing
- GET /api/billing
- POST /api/billing (admin)
- PUT /api/billing/{id} (admin)

### Dashboard
- GET /api/dashboard/kpis
- GET /api/dashboard/call-trends
- GET /api/dashboard/outcome-distribution

### Admin
- GET /api/admin/stats
- GET /api/admin/companies-performance
- GET /api/users (admin)
- POST /api/users (admin)
- DELETE /api/users/{id} (admin)

### Onboarding
- GET /api/onboarding/discovery-questions
- GET /api/onboarding/voices
- GET /api/onboarding/voice-preview/{voice_id}
- POST /api/onboarding/submit
- GET /api/onboarding/submissions (admin)
- GET /api/onboarding/submissions/{id} (admin)
- PUT /api/onboarding/submissions/{id} (admin)
- POST /api/onboarding/submissions/{id}/notes (admin)
- GET /api/onboarding/stats (admin)

### Other
- POST /api/seed (admin) - seed demo data
- GET /api/health
- GET /api/reports/generate-pdf

## Frontend Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx
│   ├── dashboard/
│   │   ├── KPICard.jsx
│   │   ├── Charts.jsx
│   │   └── DataTable.jsx
│   └── ui/                    # Shadcn components
├── contexts/
│   ├── AuthContext.js
│   ├── ThemeContext.js
│   └── TenantContext.js
├── pages/
│   ├── LoginPage.jsx
│   ├── AuthCallback.jsx
│   ├── admin/
│   │   ├── Dashboard.jsx
│   │   ├── CompaniesPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── AgentsPage.jsx
│   │   ├── BillingPage.jsx
│   │   ├── OnboardingManagement.jsx
│   │   └── OnboardingDetail.jsx
│   ├── portal/
│   │   ├── Dashboard.jsx
│   │   ├── CallsPage.jsx
│   │   ├── LeadsPage.jsx
│   │   ├── SocialPage.jsx
│   │   ├── ReportsPage.jsx
│   │   └── SettingsPage.jsx
│   └── onboarding/
│       ├── OnboardingWizard.jsx
│       ├── OnboardingSuccess.jsx
│       └── steps/
│           ├── AccountStep.jsx
│           ├── BusinessProfileStep.jsx
│           ├── WebsiteInfoStep.jsx
│           ├── DiscoveryStep.jsx
│           ├── PreferencesStep.jsx
│           ├── VoicePickerStep.jsx
│           └── ReviewStep.jsx
└── lib/
    ├── api.js
    └── utils.js
```

## Routes to Add

```jsx
// Public
/login
/onboarding
/onboarding/success
/auth/callback

// Admin (requireAdmin)
/admin
/admin/onboarding
/admin/onboarding/:submissionId
/admin/companies
/admin/users
/admin/agents
/admin/billing

// Client Portal (requireAuth)
/portal/:slug
/portal/:slug/calls
/portal/:slug/leads
/portal/:slug/social
/portal/:slug/reports
/portal/:slug/settings
```

## Key Dependencies

### Backend (Python)
- fastapi
- motor (MongoDB async)
- pydantic
- bcrypt
- pyjwt
- httpx
- resend
- python-dotenv

### Frontend (React)
- react-router-dom
- recharts
- lucide-react
- tailwindcss
- shadcn/ui components
- sonner (toasts)

## Test Credentials
- Admin: admin@hibotics.ai / admin123

## Integration Steps

1. **Check existing backend** - Determine if FastAPI or different
2. **Merge backend code** - Add models, routes, and helpers to server.py
3. **Set up MongoDB collections** - Run seed endpoint for demo data
4. **Add frontend pages** - Copy all page components
5. **Add contexts** - AuthContext, ThemeContext, TenantContext
6. **Update routing** - Add all dashboard routes
7. **Add navigation link** - "Dashboard" or "Client Portal" in main nav
8. **Test authentication flow**
9. **Test admin and client portal access
