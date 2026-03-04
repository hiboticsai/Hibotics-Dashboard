# HiBotics AI - Multi-Tenant SaaS Dashboard PRD

## Project Overview
Multi-tenant SaaS dashboard for HiBotics AI providing AI voice receptionist analytics, lead CRM, social media insights, and admin management.

## Architecture
- **Frontend**: React 18 with Shadcn UI, TailwindCSS, Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT + Emergent Google OAuth

## User Personas
1. **Admin (HiBotics AI Internal)**: Manages all companies, users, agents, and billing
2. **Client (Business Owner)**: Views their own analytics, manages leads, sees social insights

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

### Client Portal Features
- [x] Dashboard with KPIs (calls, bookings, leads, minutes, conversion, revenue)
- [x] Call Log with filters and detail modal (transcript, summary, recording)
- [x] Lead CRM with status management (new/contacted/booked/won/lost)
- [x] Social Media Insights (followers, reach, engagement, charts)
- [x] Reports page with PDF export
- [x] Settings page with notifications preferences

### Admin Dashboard Features
- [x] Overview with global KPIs
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

## What's Been Implemented (March 4, 2026)

### Backend (server.py)
- Full REST API with /api prefix
- All data models (users, companies, agents, calls, leads, social accounts, metrics, billing)
- JWT authentication with bcrypt password hashing
- Emergent OAuth session exchange
- Multi-tenant middleware (tenant resolution by company_id)
- Dashboard KPIs and analytics endpoints
- PDF report generation (server-side text format)
- Webhook placeholders for voice provider and social metrics
- Seed data endpoint for demo

### Frontend
- Complete routing (React Router)
- AuthContext with JWT + OAuth support
- ThemeContext with light/dark toggle
- TenantContext with white-label branding
- Login page with tabs and Google OAuth
- Admin Dashboard with KPIs, charts, performance table
- Admin pages: Companies, Users, Agents, Billing
- Client Portal: Dashboard, Calls, Leads, Social, Reports, Settings
- Sidebar, Header, KPICard, Charts, DataTable components

### Data Seeded
- 1 admin user (admin@hibotics.ai / admin123)
- 2 companies (Inlux Wellness, Ayur Villa Spa)
- 2 agents (1 per company)
- 30 sample calls
- 16 sample leads
- 3 social accounts with 14 days of metrics
- 6 billing records

## Prioritized Backlog

### P0 (Must Have)
- [x] All core features implemented

### P1 (Should Have)
- [ ] Real PDF generation (currently text file)
- [ ] Email notifications for new bookings/leads
- [ ] User password reset flow
- [ ] Bulk actions on leads/calls

### P2 (Nice to Have)
- [ ] Subdomain routing support
- [ ] Real voice provider webhook integration
- [ ] Real social media API integration (Meta Graph, TikTok)
- [ ] Export data to CSV
- [ ] Advanced analytics with date range filters
- [ ] Mobile app (React Native)

## Next Tasks
1. Enhance PDF report with proper PDF library (reportlab)
2. Add email notifications integration
3. Implement bulk lead status updates
4. Add date range picker for analytics
5. Consider Stripe integration for actual billing
