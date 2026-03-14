# CLAUDE.md

## Project
ReservationGonzalo

Private reservation platform replacing Airbnb listings.

Stack:

Next.js 16
TypeScript
Prisma
PostgreSQL
NextAuth v5
Stripe
Cloudinary
AWS S3
Vercel

---

## Architecture rules

1. Business logic must be in services

src/services

2. API routes must be thin controllers

src/app/api

3. Validation must use Zod

src/validations

4. Database access only through Prisma

src/lib/db.ts

5. Authentication via NextAuth

src/lib/auth.ts

---

## Reservation rules

NEVER create a reservation without checking availability.

Overlapping detection:

reservation.startDate < requestedEnd
AND
reservation.endDate > requestedStart

Valid reservation statuses:

PENDING
CONFIRMED
CANCELLED
EXPIRED

---

## Payment flow

Reservation flow:

1 user selects dates
2 system creates reservation PENDING
3 Stripe checkout
4 Stripe webhook confirms reservation
5 reservation becomes CONFIRMED

Pending reservations expire after 15 minutes.

---

## Coding rules

Use TypeScript strict.

Prefer server components.

Use transactions for reservation creation.

Never trust frontend data.

Always validate with Zod.

---

## Folder structure

src/app
src/services
src/lib
src/types
src/validations
src/hooks
src/components

---

## Commit format

Conventional commits:

feat:
fix:
refactor:
docs: