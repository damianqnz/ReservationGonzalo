# ARCHITECTURE.md
# ReservationGonzalo — System Architecture

## Business Context

Private short-term rental booking platform for a single property owner
in Lisbon, Portugal. Replaces direct Airbnb bookings with a direct
booking system. Built to scale to multiple properties in the future.

Target market: Portugal (EUR, Portuguese/English bilingual)
Legal context: Alojamento Local (AL) — Portuguese short-term rental law
Tax context: IVA 23% on accommodation services

---

## System Overview

Single-owner booking platform where:
- Guests browse properties, check availability and book online
- Guest pays via Stripe (card) at booking time
- Reservation auto-confirms after successful Stripe webhook
- Owner manages everything from a protected dashboard
- Guest can retrieve their booking with email or confirmation code

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4.2.1 |
| Database | PostgreSQL (Docker) | 16 |
| ORM | Prisma (engineType=binary) | 6.19.2 |
| Auth | NextAuth v5 beta | 5.0.0-beta.30 |
| Payments | Stripe | pending setup |
| Images | Cloudinary | pending setup |
| Emails | Resend | pending setup |
| Invoices | Invoicexpress API | pending setup |
| Deploy | Vercel + GitHub Actions | - |

---

## Folder Structure
```
src/
├── app/
│   ├── (public)/          # Public pages — no auth required
│   ├── (guest)/           # Guest portal — access by email/code
│   ├── dashboard/         # Owner dashboard — auth required
│   └── api/               # API routes (thin controllers only)
│       ├── reservations/
│       ├── availability/
│       ├── checkout/
│       ├── webhooks/
│       ├── notifications/
│       ├── properties/
│       ├── guest/
│       └── cron/
├── lib/
│   ├── db.ts              # Prisma singleton
│   ├── auth.ts            # NextAuth config
│   ├── utils.ts           # Shared utilities
│   └── services/          # ALL business logic lives here
│       ├── availabilityService.ts
│       ├── reservationService.ts
│       ├── paymentService.ts
│       ├── notificationService.ts
│       ├── emailService.ts
│       ├── invoiceService.ts
│       ├── icalService.ts
│       └── pricingService.ts
├── components/
│   ├── ui/                # Base reusable components
│   ├── layout/            # Header, Footer, Sidebar
│   ├── dashboard/         # Dashboard-specific components
│   ├── public/            # Public pages components
│   └── stitch/            # Stitch-generated components
├── hooks/                 # Custom React hooks
├── types/                 # Global TypeScript types
└── validations/           # Zod schemas
```

---

## Database Models

| Model | Purpose |
|-------|---------|
| User | Owner/Admin accounts |
| Account | OAuth linked accounts (Google, Apple) |
| Session | Active sessions |
| VerificationToken | Email verification |
| Property | Listings with pricing and policies |
| PropertyImage | Cloudinary images per property |
| Amenity | Amenity catalog |
| PropertyAmenity | N:M property ↔ amenity |
| Booking | Reservations with guest data and payment |
| BlockedDate | Manually blocked dates per property |
| Review | Guest reviews linked to bookings |
| Notification | Owner notifications |
| GuestAccess | Guest access logs by email/code |
| PricingRule | Dynamic pricing rules (season, length) |

---

## Reservation Lifecycle
```
PENDING (created, awaiting payment — expires 15min)
    ↓ Stripe webhook payment_intent.succeeded
CONFIRMED (paid)
    ↓ Manual or policy-based
CANCELLED (refunded if was PAID)
    ↓ After checkout date
COMPLETED
```

Overbooking prevention — conflict condition:
```
existing.checkIn < requested.checkOut
AND
existing.checkOut > requested.checkIn
AND
existing.status IN (PENDING, CONFIRMED)
```

---

## Pricing Rules

1. Base price per night (set on Property)
2. Seasonal pricing — PricingRule model (high/low season)
3. Long stay discount — 10% if nights >= 7
4. Final price calculated in pricingService.ts

---

## Payment Flow
```
POST /api/reservations     → create PENDING booking
POST /api/checkout         → create Stripe PaymentIntent
[Stripe processes payment]
POST /api/webhooks/stripe  → verify signature → CONFIRMED
GET  /api/reservations/[id] → return confirmed booking
```

---

## Calendar Sync (iCal)

- Export: GET /api/ical/[propertyId] → .ics file
- Import: cron job every hour fetches Airbnb/Booking.com iCal
- Imported blocks create BlockedDate entries
- Prevents double booking across platforms

---

## Email Triggers

| Event | Recipient | Template |
|-------|-----------|---------|
| Booking confirmed | Guest + Owner | confirmation |
| Check-in reminder | Guest + Owner | checkin-reminder (24h before) |
| Check-out reminder | Owner | checkout-reminder (day of) |
| Booking cancelled | Guest + Owner | cancellation |
| New review | Owner | new-review |

---

## Security Layers

1. Zod validation on all API inputs
2. JWT sessions via NextAuth
3. Middleware protects /dashboard routes
4. Stripe webhook signature verification
5. Rate limiting on public endpoints
6. Never expose hashedPassword or owner PII in public endpoints
7. Environment variables for all secrets
8. RGPD compliant — cookie consent, privacy policy required

---

## Scalability Decisions

- Schema supports multiple properties (ownerId on Property)
- Multi-language ready (PT/EN) — i18n to be implemented
- Stripe account switchable via env vars only
- Domain configurable via env vars — client pays, domain added
- Mobile app (React Native) — all logic in API, ready to consume