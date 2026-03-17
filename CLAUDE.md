# CLAUDE.md
# AI Agent Instructions — ReservationGonzalo

## Project Summary

ReservationGonzalo is a Next.js 16 App Router full-stack booking platform
for a single property owner in Lisbon, Portugal.
Read ARCHITECTURE.md and TECH_STACK.md before doing any work.

---

## Non-negotiable Rules

### Architecture
- Business logic ONLY in src/lib/services/ — never in API routes or components
- API routes are thin controllers — validate input, call service, return response
- Database access ONLY through src/lib/db.ts (Prisma singleton)
- Authentication ONLY through src/lib/auth.ts (NextAuth v5)
- Validation ALWAYS with Zod — never trust frontend data
- Absolute imports ALWAYS using @/ prefix

### TypeScript
- Strict mode — no `any`, no `@ts-ignore`, no `as unknown as X`
- Use types from src/types/index.ts before creating new ones
- Prisma-generated types are the source of truth for DB models

### React / Next.js
- Server Components by default — only add 'use client' when strictly necessary
- 'use client' is required ONLY for: useState, useEffect, browser events, browser APIs
- Never import Prisma or call db directly from a Client Component
- Never call auth() from a Client Component

### API Routes
- Always validate request body with Zod before any logic
- Consistent response format: `{ data: T | null, error: string | null }`
- Always use try/catch — never let unhandled errors reach the client
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request,
  401 Unauthorized, 403 Forbidden, 404 Not Found,
  409 Conflict (dates taken), 500 Internal Server Error

### Database
- Use Prisma transactions for operations that touch multiple tables
- Never SELECT * — always specify needed fields
- Never expose: hashedPassword, internal IDs of owner, session tokens
- Pagination on all list endpoints: default limit 20, max 100

### Security
- Rate limit all public POST endpoints: max 5 req/IP/10min
- Stripe webhooks MUST verify signature with stripe.webhooks.constructEvent()
- Passwords hashed with bcryptjs rounds=12
- Secrets only in environment variables — never hardcoded

### Error handling
- Log full error in catch: console.error('[ServiceName]', error)
- Return generic message to client — never expose stack traces
- Zod errors → 400 with validation details
- Prisma P2002 (unique constraint) → 409 Conflict

---

## Business Rules

### Reservations
- NEVER create a reservation without checking availability first
- Availability check uses: checkIn < existing.checkOut AND checkOut > existing.checkIn
- Only PENDING and CONFIRMED reservations block dates
- PENDING reservations expire after 15 minutes
- Confirmation code format: RG-XXXXXX (6 random uppercase alphanumeric)
- Long stay discount: 10% on pricePerNight if nights >= 7
- Seasonal pricing overrides base price when PricingRule exists

### Payments
- Stripe is the ONLY source of truth for payment confirmation
- Never confirm a reservation based on frontend redirect
- Only confirm via webhook payment_intent.succeeded
- Always verify Stripe webhook signature

### Market context
- Currency: EUR only
- Country: Portugal
- IVA: 6% on accommodation
- Language: Portuguese (PT) primary, English (EN) secondary

---

## Code Style

- JSDoc comments on all service functions (English)
- Tailwind CSS only — no CSS modules, no inline styles
- Component files: PascalCase.tsx
- Service/lib files: camelCase.ts
- No console.log in production code — use console.error for errors only
- Conventional commits: feat:, fix:, refactor:, docs:, chore:

---

## File Creation Checklist

Before creating any file ask:
1. Does this business logic belong in a service?
2. Does this API route validate with Zod?
3. Does this component need 'use client'?
4. Does this endpoint need auth verification?
5. Does this endpoint need rate limiting?
6. Am I exposing any sensitive data?

---

## Current Implementation Status

### Done ✅
- Prisma schema (13 models)
- NextAuth v5 with JWT + credentials + Google OAuth
- Google OAuth: only users with role OWNER in DB can sign in
- Middleware protecting /dashboard
- availabilityService.ts
- Stitch UI components converted to TSX
- Dashboard UI (static, not connected)
- Public pages UI (static, not connected)

### In Progress 🔄
- API routes (thin controllers)
- reservationService.ts
- notificationService.ts

### Pending ⏳
- paymentService.ts (Stripe)
- emailService.ts (Resend)
- invoiceService.ts (Invoicexpress)
- icalService.ts (Airbnb/Booking sync)
- pricingService.ts (seasonal + long stay)
- Connect dashboard to real data
- Guest portal (access by email/code)
- Apple OAuth
- Push notifications (web push → mobile later)
- Tests (Jest + Playwright)