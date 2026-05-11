# Fase 1B — Crear propertyService y roomService extrayendo lógica de API routes

## BOOTSTRAP
Lee en este orden antes de actuar:
1. `CLAUDE.md` — reglas y red lines (especialmente §2 Non-Negotiable Rules)
2. `HEARTBEAT.md` — estado actual
3. `ARCHITECTURE.md` §4 — estructura objetivo de dominios
4. `AGENTS.md` — revisores pre-entrega

Lee TODOS estos archivos de código ANTES de escribir nada:

**API routes de Property (8 archivos):**
- `src/app/api/properties/route.ts` — GET (list) + POST (create)
- `src/app/api/properties/[id]/route.ts` — GET (by id) + PATCH (update) + DELETE
- `src/app/api/properties/search/route.ts` — GET (search + availability + ratings)
- `src/app/api/properties/[id]/images/route.ts` — GET (list images) + POST (create image)
- `src/app/api/properties/[id]/images/[imageId]/route.ts` — PATCH + DELETE image
- `src/app/api/properties/[id]/pricing/route.ts` — GET (list pricing) + POST (create seasonal/rule)
- `src/app/api/properties/[id]/pricing/[ruleId]/route.ts` — PATCH + DELETE pricing entry
- `src/app/api/properties/[id]/rooms/route.ts` — GET (list rooms) + POST (create room)

**API routes de Room (3 archivos):**
- `src/app/api/rooms/[roomId]/route.ts` — PATCH (update) + DELETE
- `src/app/api/rooms/[roomId]/images/route.ts` — GET (list) + POST (create)
- `src/app/api/rooms/[roomId]/images/[imageId]/route.ts` — PATCH + DELETE

**Dependencias que usan estas routes:**
- `src/shared/lib/db.ts` — Prisma client
- `src/shared/lib/cloudinary.ts` — `getImageUrl()`
- `src/shared/lib/cloudinary-server.ts` — `deleteImage()`
- `src/domains/booking/services/availabilityService.ts` — `checkAvailability()` (usado en search)

Skill: `prisma-postgres-best-practices`

---

## OBJETIVO

Crear dos services nuevos extrayendo la lógica de negocio que actualmente está inline en las API routes. Las API routes deben quedar como thin controllers (auth + Zod + llamada al service + respuesta HTTP).

**IMPORTANTE:** Esta tarea es SOLO extracción y refactorización. El comportamiento de cada endpoint DEBE permanecer idéntico. NO cambiar lógica, NO agregar features, NO optimizar queries.

---

### PARTE A — Crear `src/domains/property/services/propertyService.ts`

Extraer de las 8 API routes de property las siguientes funciones. Los nombres de función son obligatorios (el agente NO debe renombrarlos):

```
listProperties(page, limit, ownerId?)
createProperty(data, ownerId)
getPropertyById(id)
updateProperty(id, data, userId, userRole)
deleteProperty(id, userId, userRole)
searchProperties(filters: { checkIn?, checkOut?, guests? })
listPropertyImages(propertyId)
createPropertyImage(propertyId, data, userId, userRole)
updatePropertyImage(propertyId, imageId, data, userId, userRole)
deletePropertyImage(propertyId, imageId, userId, userRole)
listPropertyPricing(propertyId)
createPricingEntry(propertyId, data)
updatePricingEntry(ruleId, data)
deletePricingEntry(ruleId, kind)
listRoomsByProperty(propertyId, userId, userRole)
createRoom(propertyId, data, userId, userRole)
```

#### Regla de separación service vs route:

Lo que VA AL SERVICE:
- Queries a Prisma (db.property.*, db.propertyImage.*, db.seasonalPrice.*, db.pricingRule.*)
- Verificación de ownership (comprobar si `ownerId === userId` o `userRole === 'ADMIN'`)
- Guards de negocio (ej: no eliminar property con bookings activos)
- Lógica de Cloudinary (llamar deleteImage, getImageUrl)
- Lógica de cover image (unset existing cover antes de set new)
- Lógica de search (filtro de availability + cálculo de avgRating)
- Manejo de error P2002 (unique constraint) — el service retorna `{ data: null, error: 'Slug already in use.' }`

Lo que QUEDA EN LA API ROUTE:
- `await auth()` y verificación de `session?.user` / `session.user.role`
- Parseo de query params / request body
- Validación Zod (`safeParse` / `.parse`)
- Construcción del `NextResponse.json()` con status code HTTP
- Los schemas Zod quedan inline en la route (NO moverlos al service todavía — eso es fase posterior)

#### Patrón de retorno del service:

Todas las funciones DEBEN retornar `{ data: T | null, error: string | null }`. Cuando el service detecta un error de negocio (not found, forbidden, conflict), retorna `{ data: null, error: 'mensaje' }` y el API route mapea ese error al HTTP status code correspondiente.

Para que el API route sepa qué status code usar, el service debe incluir un campo `status` cuando hay error:
```ts
return { data: null, error: 'Property not found.', status: 404 }
return { data: null, error: 'Forbidden.', status: 403 }
return { data: null, error: 'Slug already in use.', status: 409 }
```

El tipo de retorno del service sería:
```ts
type ServiceResult<T> = 
  | { data: T; error: null; status?: never }
  | { data: null; error: string; status: number }
```

Definir este type en la parte superior de `propertyService.ts`. NO crear un archivo de types separado (eso es fase posterior).

#### Manejo de errores en el service:

- Envolver toda la lógica de db en try/catch
- En catch: `console.error('[PropertyService.functionName]', error)`
- Prisma P2002 → retornar `{ data: null, error: 'mensaje descriptivo', status: 409 }`
- Prisma P2025 → retornar `{ data: null, error: 'Not found.', status: 404 }`
- Error genérico → retornar `{ data: null, error: 'An unexpected error occurred.', status: 500 }`

#### Ejemplo concreto de cómo debe quedar la route DESPUÉS de extraer:

```ts
// api/properties/route.ts — POST (DESPUÉS)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = postSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ data: null, error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const serviceResult = await createProperty(result.data, session.user.id)
  if (serviceResult.error) {
    return NextResponse.json({ data: null, error: serviceResult.error }, { status: serviceResult.status })
  }
  return NextResponse.json({ data: serviceResult.data, error: null }, { status: 201 })
}
```

**IMPORTANTE**: Cada API route debe ELIMINAR su import de `@/shared/lib/db`. Después de la extracción, ninguna route de property debe importar `db` directamente. Si alguna route aún necesita `db`, REPORTAR el caso antes de decidir.

---

### PARTE B — Crear `src/domains/room/services/roomService.ts`

Extraer de las 3 API routes de room las siguientes funciones:

```
updateRoom(roomId, data, userId, userRole)
deleteRoom(roomId, userId, userRole)
listRoomImages(roomId)
createRoomImage(roomId, data, userId, userRole)
updateRoomImage(roomId, imageId, data, userId, userRole)
deleteRoomImage(roomId, imageId, userId, userRole)
```

Aplican las MISMAS reglas de separación, patrón de retorno (`ServiceResult<T>`), y manejo de errores que propertyService.

Las API routes de room deben ELIMINAR su import de `@/shared/lib/db` después de la extracción.

**Nota:** `roomService.ts` importa `deleteImage` de `@/shared/lib/cloudinary-server` y `getImageUrl` de `@/shared/lib/cloudinary` — esos imports pasan del API route al service.

---

### PARTE C — Actualización de API routes

Después de crear ambos services, actualizar TODAS las 11 API routes para:
1. Eliminar `import { db } from '@/shared/lib/db'`
2. Eliminar `import { deleteImage } from '@/shared/lib/cloudinary-server'` (si aplica)
3. Eliminar `import { getImageUrl } from '@/shared/lib/cloudinary'` (si aplica)
4. Agregar import del service correspondiente
5. Reemplazar la lógica inline por la llamada al service
6. Mantener los schemas Zod, auth checks y response formatting en la route

**NO tocar** los helpers `assertOwnerOrAdmin` y `assertAccess` que existen en las pricing routes — su lógica de ownership se mueve al service y los helpers se eliminan de la route.

**NO tocar** el helper `resolveRoom` en rooms/[roomId]/route.ts — su lógica se mueve al service y se elimina de la route.

---

### PARTE D — Verificaciones

1. Ejecutar `grep -r "shared/lib/db" src/app/api/properties/` — debe devolver **cero** resultados
2. Ejecutar `grep -r "shared/lib/db" src/app/api/rooms/` — debe devolver **cero** resultados
3. Ejecutar `grep -r "cloudinary" src/app/api/properties/` — debe devolver **cero** resultados
4. Ejecutar `grep -r "cloudinary" src/app/api/rooms/` — debe devolver **cero** resultados
5. Verificar que `src/domains/property/services/propertyService.ts` existe y exporta las 16 funciones listadas
6. Verificar que `src/domains/room/services/roomService.ts` existe y exporta las 6 funciones listadas
7. Ejecutar `tsc --noEmit` — debe compilar sin errores

**Si algún grep devuelve resultados inesperados, o si alguna route necesita mantener un import de db/cloudinary por un motivo no contemplado aquí, REPORTARLO con archivo y línea antes de decidir cómo proceder.**

---

### PARTE E — Actualizar HEARTBEAT.md

En la tabla de Services:
- Agregar fila: `propertyService` | ✅ | `listProperties, createProperty, getPropertyById, updateProperty, deleteProperty, searchProperties, + image CRUD, + pricing CRUD, + room list/create`
- Agregar fila: `roomService` | ✅ | `updateRoom, deleteRoom, + image CRUD`

Actualizar "Architecture Migration Status" Phase 2 de ⏳ a ✅ con nota: "propertyService y roomService creados. API routes de properties/ y rooms/ refactorizadas a thin controllers."

Actualizar la cuenta de services de "11" a "13".

---

## RESTRICCIONES EXPLÍCITAS

- **NO mover** schemas Zod fuera de las API routes — eso es fase posterior
- **NO crear** archivos en `validations/` ni `types/` — eso es fase posterior
- **NO modificar** la lógica de negocio — solo moverla al service
- **NO cambiar** los response shapes de ningún endpoint — los consumidores frontend dependen de ellos
- **NO tocar** las páginas de dashboard ni de property que también importan `db` directamente — eso es un refactor posterior y fuera de scope
- **NO crear** barrel exports (`index.ts`)
- Si una función del service necesita un tipo que no existe, definirlo como `interface` dentro del mismo archivo del service (NO crear archivo de types separado)
- Si encuentras lógica en una route que no encaja claramente en ninguna de las funciones listadas, **REPORTAR** el caso antes de actuar

---

## VALIDATION GATE

- [ ] `tsc --noEmit` pasa sin errores
- [ ] `grep -r "shared/lib/db" src/app/api/properties/` devuelve 0 resultados
- [ ] `grep -r "shared/lib/db" src/app/api/rooms/` devuelve 0 resultados
- [ ] `grep -r "cloudinary" src/app/api/properties/` devuelve 0 resultados
- [ ] `grep -r "cloudinary" src/app/api/rooms/` devuelve 0 resultados
- [ ] `propertyService.ts` exporta exactamente 16 funciones
- [ ] `roomService.ts` exporta exactamente 6 funciones
- [ ] Ningún helper privado (`assertOwnerOrAdmin`, `assertAccess`, `resolveRoom`) queda en las API routes
- [ ] `HEARTBEAT.md` actualizado con fecha de hoy y cambios realizados
