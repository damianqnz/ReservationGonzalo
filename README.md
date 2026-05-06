# ReservationGonzalo

Direct booking platform for short-term rentals in Lisbon, Portugal. Built for Alojamento Local (AL) property owners to manage reservations, payments, and guests without relying on intermediary platforms like Airbnb.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL 16 + Prisma ORM 6 |
| Authentication | NextAuth v5 — Credentials + Google OAuth |
| Payments | Stripe (PaymentIntents + Webhooks) |
| Email | Resend + React Email |
| Images | Cloudinary |
| Styles | Tailwind CSS 4 |
| Validation | Zod 4 + React Hook Form |
| Deploy | Vercel |

## Features

**Public portal**
- Property listing and detail pages with gallery, map, and description
- Real-time availability booking widget
- Dynamic pricing: seasonal, weekends, long stays (≥7 nights)
- Full checkout flow with Stripe Elements
- Guest portal to view and manage reservations by confirmation code

**Owner dashboard**
- Full CRUD for properties and rooms
- Reservation calendar with manual date blocking
- Review management (approve, reject, reply, import from external sources)
- Coupon system with 7 validation types
- Analytics: revenue, occupancy, look-to-book ratio, nationality breakdown
- Bidirectional iCal sync (export + import external calendars)
- Real-time notifications with Web Push API
- Guest export to CSV

**Infrastructure**
- 11 business services, 48 API endpoints, 35+ pages
- Stripe webhook with signature verification and idempotency
- 7 transactional email templates (confirmation, reminder, cancellation, etc.)
- Cron jobs: pending reservation expiry, reminders, monthly summary
- Rate limiting on public endpoints
- Authentication with bcrypt (rounds=12) and JWT sessions

## Prerequisites

- Node.js ≥ 20
- Docker (for local PostgreSQL)
- Stripe account (test mode for development)
- Resend account (for emails)
- Cloudinary account (for images)

## Installation

```bash
git clone https://github.com/damianqnz/ReservationGonzalo.git
cd ReservationGonzalo
npm install
```

Create your local environment file and fill in the values:

```bash
cp .env.example .env.local
```

Start the database and apply migrations:

```bash
docker compose up -d
npx prisma migrate dev
npx prisma db seed
```

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional in development)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend
RESEND_API_KEY="re_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:..."

# Cron
CRON_SECRET="..."
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run tech-stack   # Update TECH_STACK.md with current versions

npx prisma studio         # Visual database browser (port 5555)
npx prisma migrate dev    # Apply pending migrations
npx prisma generate       # Regenerate client after schema changes

# Stripe webhook forwarding for local testing:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Architecture

The project follows Screaming Architecture with a domain-driven structure. Business logic lives exclusively in `src/domains/{domain}/services/`, API routes act as thin controllers, and all shared infrastructure (database, auth, utilities) lives in `src/shared/lib/`.

```
src/
├── app/
│   ├── api/               # 48 endpoints organized by domain
│   ├── dashboard/         # Owner dashboard (authenticated)
│   ├── portal/            # Guest portal
│   └── ...                # Public pages
├── components/
│   ├── auth/              # LoginScreen
│   ├── booking/           # SearchCard, search modals
│   ├── dashboard/         # Layout, modals and forms for the dashboard
│   ├── layout/            # Navbar, Footer
│   ├── property/          # PropertyCard, gallery
│   ├── sections/          # Hero, FeaturedProperties, public sections
│   └── ui/                # Reusable primitives
├── domains/
│   ├── booking/services/  # availabilityService, pricingService, reservationService
│   ├── payment/services/  # paymentService
│   ├── notification/services/ # notificationService, emailService
│   ├── review/services/   # reviewService
│   ├── coupon/services/   # couponService
│   ├── guest/services/    # guestService
│   ├── calendar/services/ # icalService
│   └── analytics/services/ # analyticsService
└── shared/lib/            # db, auth, cloudinary, date, rateLimiter, webPush
```

## Business Context

- **Market**: Portugal — EUR, 6% VAT on accommodation
- **Languages**: Portuguese (PT), Spanish (ES), English (EN)
- **Legal framework**: Alojamento Local (AL)
- **Timezone**: `Europe/Lisbon` (UTC+0 / UTC+1 DST)
- **Model**: No platform commissions — direct payment to owner via Stripe
