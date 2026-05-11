# Fase 2 — Co-localizar validaciones (Zod) y types en cada dominio

## BOOTSTRAP
Lee en este orden antes de actuar:
1. `CLAUDE.md` — reglas y red lines
2. `HEARTBEAT.md` — estado actual
3. `ARCHITECTURE.md` §4 — estructura objetivo (nota las carpetas `validations/` y `types/` en cada dominio)
4. `AGENTS.md` — revisores pre-entrega
5. `STANDARDS.md` — convenciones de naming

Skill: `prisma-postgres-best-practices`

---

## OBJETIVO

Crear carpetas `validations/` y `types/` dentro de cada dominio, mover los schemas Zod desde las API routes y los types desde los services a sus carpetas correspondientes. **SOLO mover y renombrar — NO cambiar lógica, NO agregar validaciones nuevas, NO modificar types.**

---

### PARTE A — Types por dominio

Extraer interfaces y types que actualmente están definidos inline en los services hacia `src/domains/{domain}/types/index.ts`. Un archivo por dominio.

#### A1 — `src/domains/analytics/types/index.ts`

Mover desde `src/domains/analytics/services/analyticsService.ts`:
- `export interface InventorySegment` (línea ~12)
- `export interface AnalyticsData` (línea ~18)

Archivos que importan estos types (actualizar imports):
- `src/app/dashboard/analytics/AnalyticsClient.tsx` → import actual: `import type { AnalyticsData } from '@/domains/analytics/services/analyticsService'` → nuevo: `import type { AnalyticsData } from '@/domains/analytics/types'`
- `src/app/dashboard/analytics/page.tsx` → verificar si importa types de este service

En `analyticsService.ts`: reemplazar las definiciones inline por `import type { InventorySegment, AnalyticsData } from '@/domains/analytics/types'`

#### A2 — `src/domains/booking/types/index.ts`

Mover desde `src/domains/booking/services/guestService.ts`:
- `export type GuestBooking` (línea ~45)

Mover desde `src/domains/booking/services/reservationService.ts`:
- `export interface CreateReservationInput` (línea ~70)
- `export interface CreateManualBookingInput` (línea ~335)

Archivos que importan estos types (actualizar imports):
- `src/app/portal/[code]/page.tsx` → `import type { GuestBooking } from '@/domains/booking/services/guestService'` → nuevo: `import type { GuestBooking } from '@/domains/booking/types'`
- `src/app/portal/page.tsx` → `import type { GuestBooking } from '@/domains/booking/services/guestService'` → nuevo: `import type { GuestBooking } from '@/domains/booking/types'`
- `src/app/confirmacion/page.tsx` → verificar si importa types

En los services: reemplazar las definiciones inline por imports desde `@/domains/booking/types`.

#### A3 — `src/domains/pricing/types/index.ts`

Mover desde `src/domains/pricing/services/pricingService.ts`:
- `export interface PriceBreakdown` (línea ~18)
- `interface SeasonalPriceInput` (línea ~6, no es export — hacerla export al moverla)
- `interface PricingRuleInput` (línea ~12, no es export — hacerla export al moverla)

Mover desde `src/domains/pricing/services/couponService.ts`:
- `export type ValidateCouponResult` (línea ~6)

En los services: reemplazar definiciones por imports desde `@/domains/pricing/types`.

**IMPORTANTE**: Buscar si `PriceBreakdown` se importa en algún otro archivo además del propio service. Si sí, actualizar ese import.

#### A4 — `src/domains/calendar/types/index.ts`

Mover desde `src/domains/calendar/services/icalService.ts`:
- `export interface SyncResult` (línea ~79)

En el service: reemplazar por import desde `@/domains/calendar/types`.

#### A5 — `src/domains/notification/types/index.ts`

Mover desde `src/domains/notification/services/notificationService.ts`:
- `export interface CreateNotificationInput` (línea ~39)

Mover desde `src/domains/notification/services/emailService.tsx`:
- `export type BookingWithProperty` (línea ~29)
- `export type EmailResult` (línea ~82)

En los services: reemplazar por imports desde `@/domains/notification/types`.

#### A6 — `src/domains/review/types/index.ts`

Mover desde `src/domains/review/services/reviewService.ts`:
- `export interface ListReviewsQuery` (línea ~4)
- `export type ReviewWithDetails` (línea ~12)

Archivos que importan estos types (actualizar imports):
- `src/app/dashboard/reviews/ReviewsClient.tsx` → `import { ReviewWithDetails } from '@/domains/review/services/reviewService'` → nuevo: `import type { ReviewWithDetails } from '@/domains/review/types'`

En el service: reemplazar por import desde `@/domains/review/types`.

#### Regla general para los types:
- Si un type NO era `export` en el service pero es necesario en el types file, hacerlo `export`
- Si un type usa tipos de Prisma (`import { Review } from '@prisma/client'`), ese import va en el archivo `types/index.ts`
- NO crear types nuevos — solo mover los existentes
- Si al mover un type descubres que depende de otro type que está en un service diferente, **REPORTAR** el caso

---

### PARTE B — Validaciones Zod por dominio

Extraer los schemas Zod desde las API routes hacia `src/domains/{domain}/validations/{archivo}.ts`. Los schemas Zod se COPIAN a los archivos de validación y se RE-EXPORTAN. Las API routes pasan a importarlos desde la nueva ubicación.

**Convención de nombres de archivo**: `{domainName}Schema.ts` (camelCase). Un archivo por dominio.

**Convención de renombrado de schemas**: Los schemas genéricos (`postSchema`, `bodySchema`, `patchSchema`) deben renombrarse para ser descriptivos y únicos. Formato: `{accion}{entidad}Schema`. Ejemplos: `createPropertySchema`, `updatePropertySchema`, `searchPropertySchema`.

#### B1 — `src/domains/booking/validations/bookingSchema.ts`

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `rangeSchema` | `availabilityRangeSchema` | `api/availability/route.ts` |
| `blockedSchema` | `unavailableDatesSchema` | `api/availability/route.ts` |
| `reservationSchema` | `createReservationSchema` | `api/reservations/route.ts` |
| `getQuerySchema` | `listReservationsQuerySchema` | `api/reservations/route.ts` |
| `patchSchema` | `updateReservationSchema` | `api/reservations/[id]/route.ts` |
| `schema` | `createManualBookingSchema` | `api/reservations/manual/route.ts` |
| `postSchema` | `createCheckoutSchema` | `api/checkout/route.ts` |
| `querySchema` | `guestLookupSchema` | `api/guest/bookings/route.ts` |
| `querySchema` | `guestBookingByIdSchema` | `api/guest/bookings/[id]/route.ts` |
| `querySchema` | `guestBookingPdfSchema` | `api/guest/bookings/[id]/pdf/route.ts` |

Cada API route: eliminar la definición inline del schema, agregar import desde `@/domains/booking/validations/bookingSchema`.

#### B2 — `src/domains/property/validations/propertySchema.ts`

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `postSchema` | `createPropertySchema` | `api/properties/route.ts` |
| `patchSchema` | `updatePropertySchema` | `api/properties/[id]/route.ts` |
| `searchSchema` | `searchPropertySchema` | `api/properties/search/route.ts` |
| `createSchema` | `createPropertyImageSchema` | `api/properties/[id]/images/route.ts` |
| `patchSchema` | `updatePropertyImageSchema` | `api/properties/[id]/images/[imageId]/route.ts` |
| `postSchema` | `createRoomInPropertySchema` | `api/properties/[id]/rooms/route.ts` |

#### B3 — `src/domains/room/validations/roomSchema.ts`

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `patchSchema` | `updateRoomSchema` | `api/rooms/[roomId]/route.ts` |
| `createSchema` | `createRoomImageSchema` | `api/rooms/[roomId]/images/route.ts` |
| `patchSchema` | `updateRoomImageSchema` | `api/rooms/[roomId]/images/[imageId]/route.ts` |

#### B4 — `src/domains/pricing/validations/pricingSchema.ts`

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `querySchema` | `calculatePriceQuerySchema` | `api/pricing/route.ts` |
| `seasonalSchema` | `createSeasonalPriceSchema` | `api/properties/[id]/pricing/route.ts` |
| `ruleSchema` | `createPricingRuleSchema` | `api/properties/[id]/pricing/route.ts` |
| `postSchema` | `createPricingEntrySchema` | `api/properties/[id]/pricing/route.ts` |
| `patchSeasonalSchema` | `updateSeasonalPriceSchema` | `api/properties/[id]/pricing/[ruleId]/route.ts` |
| `patchRuleSchema` | `updatePricingRuleSchema` | `api/properties/[id]/pricing/[ruleId]/route.ts` |
| `patchSchema` | `updatePricingEntrySchema` | `api/properties/[id]/pricing/[ruleId]/route.ts` |

#### B5 — `src/domains/pricing/validations/couponSchema.ts`

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `postSchema` | `createCouponSchema` | `api/coupons/route.ts` |
| `bodySchema` | `applyCouponSchema` | `api/coupons/apply/route.ts` |
| `bodySchema` | `validateCouponSchema` | `api/coupons/validate/route.ts` |

#### B6 — `src/domains/review/validations/reviewSchema.ts`

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `QuerySchema` | `listReviewsQuerySchema` | `api/reviews/route.ts` |
| `ActionSchema` | `reviewActionSchema` | `api/reviews/[id]/route.ts` |
| `ImportSchema` | `importReviewSchema` | `api/reviews/import/route.ts` |

#### B7 — `src/domains/calendar/validations/calendarSchema.ts`

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `bodySchema` | `blockDatesSchema` | `api/calendar/block/route.ts` |
| `importSchema` | `importICalSchema` | `api/ical/import/route.ts` |

#### B8 — `src/domains/notification/validations/notificationSchema.ts`

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `bodySchema` | `checkinReminderSchema` | `api/emails/checkin/route.ts` |
| `subscribeSchema` | `pushSubscribeSchema` | `api/push/subscribe/route.ts` |
| `unsubscribeSchema` | `pushUnsubscribeSchema` | `api/push/subscribe/route.ts` |

#### Schemas que NO se mueven (se quedan inline en la route):

Estos endpoints no tienen un dominio claro o son utilidades. Dejarlos como están:
- `api/geocode/route.ts` → `schema`
- `api/settings/maintenance/route.ts` → `bodySchema`
- `api/upload/delete/route.ts` → `bodySchema`

#### Schemas del dashboard analytics/clients:

Estos schemas pertenecen al dominio analytics. Agregarlos a `src/domains/analytics/validations/analyticsSchema.ts`:

| Schema actual | Nombre nuevo | Origen |
|---|---|---|
| `querySchema` | `analyticsQuerySchema` | `api/dashboard/analytics/route.ts` |
| `querySchema` | `listClientsQuerySchema` | `api/dashboard/clients/route.ts` |
| `querySchema` | `exportClientsQuerySchema` | `api/dashboard/clients/export/route.ts` |

---

### PARTE C — Actualización de imports en API routes

Para CADA API route modificada:
1. Eliminar la definición inline del schema Zod
2. Agregar import desde `@/domains/{domain}/validations/{archivo}`
3. Actualizar las referencias al schema si fue renombrado (ej: `postSchema.safeParse(body)` → `createPropertySchema.safeParse(body)`)
4. NO cambiar ninguna otra cosa en la route

**IMPORTANTE**: Los imports de `z` de Zod (`import { z } from 'zod'`) pueden quedarse en la route SI la route aún usa `z.ZodError` en un catch, o `z.infer<>` para tipar. Si la route ya no referencia `z` directamente después de mover el schema, eliminar el import de `z`.

---

### PARTE D — Verificaciones

1. `grep -rn "const.*Schema.*z\.\|const.*schema.*z\." src/app/api/ --include="*.ts"` → solo debe devolver resultados de los 3 archivos excluidos (geocode, settings/maintenance, upload/delete)
2. `find src/domains -name "*Schema.ts" -path "*/validations/*"` → debe devolver exactamente 9 archivos
3. `find src/domains -name "index.ts" -path "*/types/*"` → debe devolver exactamente 6 archivos
4. `tsc --noEmit` — debe compilar sin errores
5. Verificar que NINGÚN service define types inline después de la migración (excepto types privados no exportados que solo usa ese service internamente — esos pueden quedarse)

**Si alguna verificación falla o encuentras un type/schema que no fue mapeado en este prompt, REPORTAR con archivo y línea antes de decidir.**

---

### PARTE E — Actualizar HEARTBEAT.md

Agregar una sección nueva o actualizar "Architecture Migration Status":
- Nota: "Fase 2 completada: validations/ y types/ co-localizados en todos los dominios. 9 archivos de validación, 6 archivos de types creados."
- Actualizar la fecha de `Last updated` a hoy.

---

## RESTRICCIONES EXPLÍCITAS

- **NO crear** schemas Zod nuevos — solo mover y renombrar los existentes
- **NO crear** types nuevos — solo mover los existentes
- **NO modificar** la lógica de validación de ningún schema
- **NO modificar** la estructura de ningún type/interface
- **NO crear** barrel exports en `domains/{domain}/index.ts`
- **NO tocar** los services más allá de reemplazar definiciones inline por imports
- **NO tocar** componentes — si un componente importa un type de un service, actualizar solo ese import
- Los schemas de `discriminatedUnion` (como los de pricing) deben mantenerse juntos: los sub-schemas (`seasonalSchema`, `ruleSchema`) y el schema compuesto (`postSchema`) van al mismo archivo
- Si un schema referencia un enum de Prisma (`PropertyType`, `RoomType`, etc.), ese import de `@prisma/client` se mueve al archivo de validación

---

## VALIDATION GATE

- [ ] `tsc --noEmit` pasa sin errores
- [ ] 9 archivos de validación en `src/domains/*/validations/`
- [ ] 6 archivos de types en `src/domains/*/types/index.ts`
- [ ] Ningún service exporta interfaces/types inline (excepto tipos privados internos)
- [ ] Solo 3 API routes conservan schemas Zod inline (geocode, settings, upload)
- [ ] `HEARTBEAT.md` actualizado
