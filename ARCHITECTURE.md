# ARCHITECTURE.md

## System Overview

ReservationGonzalo is a private booking system replacing Airbnb.

Users can:

- view property
- check availability
- reserve dates
- pay online

Owner can manage reservations from dashboard.

---

## Tech Stack

Frontend
Next.js 16

Backend
Next.js API Routes

Database
PostgreSQL

ORM
Prisma

Auth
NextAuth v5

Payments
Stripe

Storage
Cloudinary + AWS S3

---

## Folder Structure

src/
 app/
 api/
 services/
 lib/
 components/
 hooks/
 validations/
 types/

---

## Reservation Lifecycle

Statuses:

PENDING
CONFIRMED
CANCELLED
EXPIRED

Flow:

User selects dates
Availability checked
Reservation created PENDING
Stripe checkout
Webhook confirms reservation

---

## Overbooking Prevention

System prevents overlapping reservations.

Conflict condition:

startDate < requestedEnd
AND
endDate > requestedStart

Only reservations with status:

PENDING
CONFIRMED

block dates.

---

## Services

availabilityService

checkAvailability
getUnavailableDates

reservationService

createReservation
cancelReservation
expireReservation

paymentService

createCheckoutSession
handleStripeWebhook

---

## Security

Zod validation
JWT sessions
Protected routes
Environment variables

---

## Deployment

CI/CD

GitHub Actions
Docker (local)
Vercel (production)