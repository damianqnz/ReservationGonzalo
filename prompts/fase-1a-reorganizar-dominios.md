# Fase 1A — Reorganizar dominios existentes (Screaming Architecture)

## BOOTSTRAP
Lee en este orden antes de actuar:
1. `CLAUDE.md` — reglas y red lines
2. `HEARTBEAT.md` — estado actual
3. `ARCHITECTURE.md` §4 "The Folder Tree" — estructura objetivo de dominios
4. `AGENTS.md` — revisores pre-entrega

Archivos de código involucrados (leerlos TODOS antes de mover nada):
- `src/domains/booking/services/pricingService.ts`
- `src/domains/coupon/services/couponService.ts`
- `src/domains/guest/services/guestService.ts`
- `src/shared/lib/propertyServices.ts`

---

## OBJETIVO

Reorganizar los services existentes para alinear los límites de dominio con lo definido en `ARCHITECTURE.md` §4. **Esta tarea es exclusivamente de movimiento de archivos y actualización de imports. NO crear lógica nueva, NO modificar funciones, NO cambiar firmas, NO refactorizar código interno.**

### Paso 1 — Crear estructuras de carpetas vacías

Crear las siguientes carpetas (vacías por ahora):
```
src/domains/pricing/services/     ← dominio nuevo
src/domains/property/services/    ← dominio nuevo
src/domains/property/lib/         ← dominio nuevo
src/domains/room/services/        ← dominio nuevo
```

### Paso 2 — Mover `pricingService.ts` de booking a pricing

**Origen**: `src/domains/booking/services/pricingService.ts`
**Destino**: `src/domains/pricing/services/pricingService.ts`

Archivos que importan este service (actualizar TODOS los imports):
- `src/app/api/pricing/route.ts` — import actual: `@/domains/booking/services/pricingService`
- `src/app/property/[slug]/page.tsx` — import actual: `@/domains/booking/services/pricingService`
- `src/domains/booking/services/reservationService.ts` — import actual: `@/domains/booking/services/pricingService`

Nuevo import en todos: `@/domains/pricing/services/pricingService`

### Paso 3 — Mover `couponService.ts` de coupon a pricing

**Origen**: `src/domains/coupon/services/couponService.ts`
**Destino**: `src/domains/pricing/services/couponService.ts`

Archivos que importan este service (actualizar TODOS los imports):
- `src/app/api/coupons/apply/route.ts`
- `src/app/api/coupons/route.ts`
- `src/app/api/coupons/validate/route.ts`
- `src/app/api/coupons/[id]/route.ts`
- `src/app/dashboard/coupons/page.tsx`

Import actual en todos: `@/domains/coupon/services/couponService`
Nuevo import en todos: `@/domains/pricing/services/couponService`

**Después de mover**: eliminar la carpeta `src/domains/coupon/` completa (quedará vacía).

### Paso 4 — Mover `guestService.ts` de guest a booking

**Origen**: `src/domains/guest/services/guestService.ts`
**Destino**: `src/domains/booking/services/guestService.ts`

Archivos que importan este service (actualizar TODOS los imports):
- `src/app/api/guest/bookings/route.ts`
- `src/app/api/guest/bookings/[id]/pdf/route.ts`
- `src/app/api/guest/bookings/[id]/route.ts`
- `src/app/portal/page.tsx`
- `src/app/portal/[code]/page.tsx`

Import actual en todos: `@/domains/guest/services/guestService`
Nuevo import en todos: `@/domains/booking/services/guestService`

**Después de mover**: eliminar la carpeta `src/domains/guest/` completa (quedará vacía).

### Paso 5 — Mover `propertyServices.ts` de shared/lib a property

Este archivo **NO** es un service de negocio — es un catálogo de constantes (amenities/servicios de propiedad). Se mueve al dominio property como dato de dominio.

**Origen**: `src/shared/lib/propertyServices.ts`
**Destino**: `src/domains/property/lib/amenities.ts`

**IMPORTANTE**: NO renombrar las exportaciones internas del archivo. Solo mover y renombrar el archivo.

Archivos que importan este archivo (actualizar TODOS los imports):
- `src/app/property/[slug]/PropertyDetailsClient.tsx` — buscar el import actual que referencia `propertyServices` y actualizarlo a `@/domains/property/lib/amenities`

### Paso 6 — Verificación post-movimiento

1. Ejecutar `grep -r "domains/coupon" src/` — debe devolver **cero** resultados
2. Ejecutar `grep -r "domains/guest" src/` — debe devolver **cero** resultados
3. Ejecutar `grep -r "shared/lib/propertyServices" src/` — debe devolver **cero** resultados
4. Ejecutar `grep -r "booking/services/pricingService" src/` — debe devolver **cero** resultados
5. Verificar que `src/domains/coupon/` ya NO existe
6. Verificar que `src/domains/guest/` ya NO existe
7. Ejecutar `tsc --noEmit` — debe compilar sin errores

**Si algún grep devuelve resultados que no estén en esta lista, es un import que NO fue mapeado aquí. REPORTARLO como error, mostrar el archivo y la línea, y corregirlo.**

### Paso 7 — Actualizar HEARTBEAT.md

En la sección "Architecture Migration Status":
- Cambiar Phase 1 de ⏳ a ✅ con nota: "Dominios reorganizados: pricing (nuevo), property (estructura), room (estructura). coupon y guest eliminados como dominios independientes."
- Actualizar la fecha de `Last updated` a hoy.

En la sección "Services (src/lib/services/)":
- Cambiar el encabezado a "Services (src/domains/)" 
- Actualizar las ubicaciones en la tabla para reflejar los nuevos paths:
  - `pricingService` → ahora en `domains/pricing/services/`
  - `couponService` → ahora en `domains/pricing/services/`
  - `guestService` → ahora en `domains/booking/services/`

---

## RESTRICCIONES EXPLÍCITAS

- **NO crear** archivos `propertyService.ts` ni `roomService.ts` — eso es Fase 1B.
- **NO mover** componentes — eso es una fase posterior.
- **NO crear** carpetas `validations/`, `types/`, `hooks/` dentro de dominios — eso es otra fase.
- **NO modificar** la lógica interna de ningún service. Solo mover archivos y actualizar imports.
- **NO crear** archivos `index.ts` de barrel exports a menos que ya existan en los dominios actuales.
- Si encuentras algún import que no fue listado aquí, **REPÓRTALO** antes de corregirlo. No asumas que es correcto o incorrecto — muestra el hallazgo.

---

## VALIDATION GATE

- [ ] `tsc --noEmit` pasa sin errores
- [ ] `grep -r "domains/coupon" src/` devuelve 0 resultados
- [ ] `grep -r "domains/guest" src/` devuelve 0 resultados
- [ ] `grep -r "shared/lib/propertyServices" src/` devuelve 0 resultados
- [ ] `grep -r "booking/services/pricingService" src/` devuelve 0 resultados
- [ ] Carpetas `src/domains/coupon/` y `src/domains/guest/` eliminadas
- [ ] Carpetas `src/domains/pricing/`, `src/domains/property/`, `src/domains/room/` creadas
- [ ] `HEARTBEAT.md` actualizado con la fecha de hoy y los cambios realizados
