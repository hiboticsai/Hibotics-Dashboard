# Test Credentials for HiBotics AI Dashboard

## Admin Account
- **Email**: admin@hibotics.ai
- **Password**: admin123
- **Role**: admin
- **Access**: Full admin dashboard, all companies, onboarding management

## Sample Companies
- **Inlux Wellness**: slug `inlux`
- **Ayur Villa Spa**: slug `ayurvilla`

## Test User Accounts (created during testing)
- Various TEST_ prefixed accounts created during automated tests
- Can be identified by email prefix or name containing "TEST"

## API Testing
- Base URL: `https://hibotics-analytics.preview.emergentagent.com`
- Auth: JWT Bearer token from `/api/auth/login`

## Onboarding Test Flow
1. Go to `/onboarding` 
2. Create new account or login first
3. Complete all 7 steps
4. Admin reviews at `/admin/onboarding`
