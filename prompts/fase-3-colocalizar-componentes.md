# Fase 3 — Co-localizar componentes por dominio

## BOOTSTRAP
Lee en este orden antes de actuar:
1. `CLAUDE.md` — reglas y red lines
2. `HEARTBEAT.md` — estado actual
3. `ARCHITECTURE.md` §4 — estructura objetivo (nota `domains/{domain}/components/` y `shared/components/{category}/`)
4. `DESIGN_SYSTEM.md` — contexto de componentes UI
5. `AGENTS.md` — revisores pre-entrega

---

## OBJETIVO

Mover los componentes desde `src/components/` hacia `src/domains/{domain}/components/` o `src/shared/components/{category}/` según corresponda. También mover los client components que viven en `src/app/` hacia sus dominios. Eliminar la carpeta `src/components/` al final.

**SOLO mover archivos y actualizar imports. NO modificar lógica, NO renombrar componentes, NO cambiar props, NO refactorizar.**

---

### PARTE A — Componentes de dominio (de `src/components/` → `src/domains/`)

Crear carpetas `components/` dentro de cada dominio que las necesite.

#### A1 — `src/domains/booking/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/dashboard/AddBookingButton.tsx` | `domains/booking/components/AddBookingButton.tsx` | `app/dashboard/reservations/page.tsx` |
| `components/dashboard/AddBookingModal.tsx` | `domains/booking/components/AddBookingModal.tsx` | Verificar — probablemente importado por AddBookingButton |
| `components/dashboard/BookingDetailModal.tsx` | `domains/booking/components/BookingDetailModal.tsx` | `app/dashboard/reservations/ReservationsTable.tsx` |
| `components/dashboard/CheckInModal.tsx` | `domains/booking/components/CheckInModal.tsx` | `app/dashboard/reservations/ReservationsTable.tsx` |

#### A2 — `src/domains/property/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/property/PropertyCard.tsx` | `domains/property/components/PropertyCard.tsx` | `app/properties/page.tsx` |
| `components/property/PropertyDetails.tsx` | `domains/property/components/PropertyDetails.tsx` | Verificar |
| `components/property/PropertyGallery.tsx` | `domains/property/components/PropertyGallery.tsx` | Verificar |
| `components/property/GalleryModal.tsx` | `domains/property/components/GalleryModal.tsx` | Verificar — probablemente por PropertyGallery |
| `components/dashboard/PropertyManageButton.tsx` | `domains/property/components/PropertyManageButton.tsx` | `app/dashboard/properties/page.tsx` |
| `components/dashboard/PropertyManageModal.tsx` | `domains/property/components/PropertyManageModal.tsx` | Verificar — probablemente por PropertyManageButton |
| `components/dashboard/DeletePropertyButton.tsx` | `domains/property/components/DeletePropertyButton.tsx` | `app/dashboard/properties/page.tsx` |
| `components/dashboard/DeletePropertyModal.tsx` | `domains/property/components/DeletePropertyModal.tsx` | Verificar — probablemente por DeletePropertyButton |
| `components/ui/ImageUploader.tsx` | `domains/property/components/ImageUploader.tsx` | `app/dashboard/properties/[id]/rooms/[roomId]/images/page.tsx`, `app/dashboard/properties/[id]/images/ImagesClient.tsx`, `app/dashboard/properties/[id]/images/page.tsx` |
| `components/ui/PropertyMap.tsx` | `domains/property/components/PropertyMap.tsx` | `components/ui/PropertyMapWrapper.tsx` (que se moverá junto) |
| `components/ui/PropertyMapWrapper.tsx` | `domains/property/components/PropertyMapWrapper.tsx` | `app/dashboard/properties/[id]/edit/PropertyEditForm.tsx` (dynamic import), `app/property/[slug]/PropertyDetailsClient.tsx` |

**NOTA sobre ImageUploader**: Este componente lo usan TANTO property images como room images. Sin embargo, `ARCHITECTURE.md` lo ubica en `domains/property/components/`. Moverlo ahí y actualizar los imports de room images para que apunten a `@/domains/property/components/ImageUploader`. Si el agente considera que esto crea un acoplamiento incorrecto entre dominios, **REPORTAR** pero seguir con la ubicación indicada.

**NOTA sobre PropertyMap/PropertyMapWrapper**: `PropertyMapWrapper` importa `PropertyMap` con ruta relativa (`./PropertyMap`). Al moverlos juntos a `domains/property/components/`, la ruta relativa se mantiene igual — no hay que cambiarla.

#### A3 — `src/domains/room/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/dashboard/BedPicker.tsx` | `domains/room/components/BedPicker.tsx` | `app/dashboard/properties/[id]/edit/PropertyEditForm.tsx`, `app/dashboard/properties/new/page.tsx`, `app/dashboard/properties/[id]/rooms/new/page.tsx` |
| `components/dashboard/ServicesChecklist.tsx` | `domains/room/components/ServicesChecklist.tsx` | `app/dashboard/properties/[id]/edit/PropertyEditForm.tsx`, `app/dashboard/properties/new/page.tsx`, `app/dashboard/properties/[id]/rooms/new/page.tsx` |
| `components/dashboard/DeleteRoomButton.tsx` | `domains/room/components/DeleteRoomButton.tsx` | `app/dashboard/properties/[id]/rooms/page.tsx` |
| `components/dashboard/DeleteRoomModal.tsx` | `domains/room/components/DeleteRoomModal.tsx` | Verificar — probablemente por DeleteRoomButton |

**DUPLICADOS A ELIMINAR**: Existen copias idénticas de `BedPicker.tsx` y `ServicesChecklist.tsx` en `src/app/dashboard/properties/[id]/rooms/new/`. Estas copias NO son importadas por nadie (las páginas importan desde `@/components/dashboard/`). **Eliminar** estos 2 archivos duplicados:
- `src/app/dashboard/properties/[id]/rooms/new/BedPicker.tsx` ← ELIMINAR
- `src/app/dashboard/properties/[id]/rooms/new/ServicesChecklist.tsx` ← ELIMINAR

#### A4 — `src/domains/review/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/sections/GuestReviews.tsx` | `domains/review/components/GuestReviews.tsx` | `app/page.tsx` |
| `components/dashboard/ImportReviewModal.tsx` | `domains/review/components/ImportReviewModal.tsx` | `app/dashboard/reviews/ReviewsClient.tsx` |

#### A5 — `src/domains/notification/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/dashboard/NotificationPanel.tsx` | `domains/notification/components/NotificationPanel.tsx` | `components/dashboard/DashboardTopbar.tsx` (que se moverá a shared) |
| `components/dashboard/NotificationPreferences.tsx` | `domains/notification/components/NotificationPreferences.tsx` | Verificar |
| `components/dashboard/PushSubscribeButton.tsx` | `domains/notification/components/PushSubscribeButton.tsx` | Verificar |

**NOTA**: `DashboardTopbar.tsx` importa `NotificationPanel` desde `@/components/dashboard/NotificationPanel`. Después de mover ambos, `DashboardTopbar` (que irá a `shared/components/layout/`) deberá importar desde `@/domains/notification/components/NotificationPanel`.

#### A6 — `src/domains/analytics/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/dashboard/StatCard.tsx` | `domains/analytics/components/StatCard.tsx` | `app/dashboard/page.tsx` |

---

### PARTE B — Componentes compartidos (de `src/components/` → `src/shared/components/`)

#### B1 — `src/shared/components/layout/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/layout/Navbar.tsx` | `shared/components/layout/Navbar.tsx` | `app/cookies/page.tsx`, `app/login/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx` |
| `components/layout/Footer.tsx` | `shared/components/layout/Footer.tsx` | `app/cookies/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx` |
| `components/layout/MenuLanguageSheet.tsx` | `shared/components/layout/MenuLanguageSheet.tsx` | Verificar — probablemente por Navbar |
| `components/dashboard/DashboardLayout.tsx` | `shared/components/layout/DashboardLayout.tsx` | `app/dashboard/layout.tsx` |
| `components/dashboard/DashboardSidebar.tsx` | `shared/components/layout/DashboardSidebar.tsx` | Verificar — probablemente por DashboardLayout |
| `components/dashboard/DashboardTopbar.tsx` | `shared/components/layout/DashboardTopbar.tsx` | Verificar — probablemente por DashboardLayout |

#### B2 — `src/shared/components/ui/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/ui/ToggleSwitch.tsx` | `shared/components/ui/ToggleSwitch.tsx` | `app/dashboard/properties/[id]/edit/PropertyEditForm.tsx`, `app/dashboard/properties/new/page.tsx` |
| `components/CookieBanner.tsx` | `shared/components/ui/CookieBanner.tsx` | `app/layout.tsx` |
| `components/TawkChat.tsx` | `shared/components/ui/TawkChat.tsx` | `app/layout.tsx` |

#### B3 — `src/shared/components/marketing/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/sections/Hero.tsx` | `shared/components/marketing/Hero.tsx` | `app/page.tsx` |
| `components/sections/AboutUs.tsx` | `shared/components/marketing/AboutUs.tsx` | `app/about/page.tsx` |
| `components/sections/FeaturedProperties.tsx` | `shared/components/marketing/FeaturedProperties.tsx` | `app/page.tsx` |
| `components/sections/WhyBookDirect.tsx` | `shared/components/marketing/WhyBookDirect.tsx` | `app/page.tsx` |
| `components/sections/HelpFaq.tsx` | `shared/components/marketing/HelpFaq.tsx` | `app/faq/page.tsx` |
| `components/sections/TrustBadges.tsx` | `shared/components/marketing/TrustBadges.tsx` | `app/page.tsx` |
| `components/booking/SearchCard.tsx` | `shared/components/marketing/SearchCard.tsx` | `app/page.tsx` |
| `components/booking/SearchDatesModal.tsx` | `shared/components/marketing/SearchDatesModal.tsx` | Verificar — probablemente por SearchCard |
| `components/booking/GuestSelectionModal.tsx` | `shared/components/marketing/GuestSelectionModal.tsx` | Verificar — probablemente por SearchCard |
| `components/public/SearchResultsModal.tsx` | `shared/components/marketing/SearchResultsModal.tsx` | `components/booking/SearchCard.tsx` (que se moverá junto) |

**NOTA sobre SearchCard**: Este componente importa `SearchResultsModal` con un dynamic import y ruta absoluta (`@/components/public/SearchResultsModal`). También importa `type SearchProperty` del mismo archivo. Después de mover ambos a `shared/components/marketing/`, actualizar ambos imports en SearchCard.

#### B4 — `src/shared/components/auth/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/auth/LoginScreen.tsx` | `shared/components/auth/LoginScreen.tsx` | `app/login/page.tsx` |

#### B5 — `src/shared/providers/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `components/providers.tsx` | `shared/providers/Providers.tsx` | `app/layout.tsx` |

**NOTA**: El nombre del archivo cambia de `providers.tsx` a `Providers.tsx` (PascalCase, es un componente). Verificar que el export sea compatible (`export { Providers }` o `export default`).

---

### PARTE C — Client components en `src/app/` → dominios

Estos componentes actualmente viven junto a su `page.tsx` con imports relativos (`./ComponentName`). Moverlos a sus dominios correspondientes y actualizar los imports a rutas absolutas.

#### C1 — `src/domains/booking/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `app/confirmacion/PendingPolling.tsx` | `domains/booking/components/PendingPolling.tsx` | `app/confirmacion/page.tsx` → cambiar `'./PendingPolling'` a `'@/domains/booking/components/PendingPolling'` |
| `app/dashboard/reservations/ReservationsTable.tsx` | `domains/booking/components/ReservationsTable.tsx` | `app/dashboard/reservations/page.tsx` → cambiar `'./ReservationsTable'` a `'@/domains/booking/components/ReservationsTable'` |
| `app/dashboard/reservations/SearchFilters.tsx` | `domains/booking/components/SearchFilters.tsx` | `app/dashboard/reservations/page.tsx` → cambiar `'./SearchFilters'` a `'@/domains/booking/components/SearchFilters'` |

#### C2 — `src/domains/property/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `app/property/[slug]/PropertyDetailsClient.tsx` | `domains/property/components/PropertyDetailsClient.tsx` | `app/property/[slug]/page.tsx` → cambiar `'./PropertyDetailsClient'` a `'@/domains/property/components/PropertyDetailsClient'` |
| `app/dashboard/properties/[id]/edit/PropertyEditForm.tsx` | `domains/property/components/PropertyEditForm.tsx` | `app/dashboard/properties/[id]/edit/page.tsx` → cambiar `'./PropertyEditForm'` a `'@/domains/property/components/PropertyEditForm'` |
| `app/dashboard/properties/[id]/images/ImagesClient.tsx` | `domains/property/components/ImagesClient.tsx` | `app/dashboard/properties/[id]/images/page.tsx` → cambiar `'./ImagesClient'` a `'@/domains/property/components/ImagesClient'` |
| `app/dashboard/properties/[id]/access/AccessForm.tsx` | `domains/property/components/AccessForm.tsx` | `app/dashboard/properties/[id]/access/page.tsx` → cambiar `'./AccessForm'` a `'@/domains/property/components/AccessForm'` |

#### C3 — `src/domains/room/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `app/dashboard/properties/[id]/rooms/[roomId]/edit/RoomEditForm.tsx` | `domains/room/components/RoomEditForm.tsx` | `app/dashboard/properties/[id]/rooms/[roomId]/edit/page.tsx` → cambiar `'./RoomEditForm'` a `'@/domains/room/components/RoomEditForm'` |

#### C4 — `src/domains/pricing/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `app/dashboard/properties/[id]/pricing/PricingClient.tsx` | `domains/pricing/components/PricingClient.tsx` | `app/dashboard/properties/[id]/pricing/page.tsx` → cambiar `'./PricingClient'` a `'@/domains/pricing/components/PricingClient'` |
| `app/dashboard/coupons/CouponsClient.tsx` | `domains/pricing/components/CouponsClient.tsx` | `app/dashboard/coupons/page.tsx` → cambiar `'./CouponsClient'` a `'@/domains/pricing/components/CouponsClient'` |

#### C5 — `src/domains/review/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `app/dashboard/reviews/ReviewsClient.tsx` | `domains/review/components/ReviewsClient.tsx` | `app/dashboard/reviews/page.tsx` → cambiar `'./ReviewsClient'` a `'@/domains/review/components/ReviewsClient'` |

#### C6 — `src/domains/calendar/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `app/dashboard/calendar/CalendarClient.tsx` | `domains/calendar/components/CalendarClient.tsx` | `app/dashboard/calendar/page.tsx` → cambiar `'./CalendarClient'` a `'@/domains/calendar/components/CalendarClient'` |
| `app/dashboard/properties/[id]/ical/ICalClient.tsx` | `domains/calendar/components/ICalClient.tsx` | `app/dashboard/properties/[id]/ical/page.tsx` → cambiar `'./ICalClient'` a `'@/domains/calendar/components/ICalClient'` |

#### C7 — `src/domains/analytics/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `app/dashboard/analytics/AnalyticsClient.tsx` | `domains/analytics/components/AnalyticsClient.tsx` | `app/dashboard/analytics/page.tsx` → cambiar `'./AnalyticsClient'` a `'@/domains/analytics/components/AnalyticsClient'` |
| `app/dashboard/SparklineSection.tsx` | `domains/analytics/components/SparklineSection.tsx` | `app/dashboard/page.tsx` → cambiar `'./SparklineSection'` a `'@/domains/analytics/components/SparklineSection'` |

#### C8 — `src/domains/notification/components/`

| Archivo actual | Destino | Importado por |
|---|---|---|
| `app/dashboard/notifications/NotificationsClient.tsx` | `domains/notification/components/NotificationsClient.tsx` | `app/dashboard/notifications/page.tsx` → cambiar `'./NotificationsClient'` a `'@/domains/notification/components/NotificationsClient'` |

#### Archivos en `app/` que NO se mueven (se quedan co-localizados):

Estos son componentes hyper-específicos de una sola página sin lógica de dominio reutilizable:
- `app/cookies/CookiePreferencesReset.tsx` — solo lo usa `cookies/page.tsx`
- `app/dashboard/settings/SettingsClient.tsx` — solo lo usa `settings/page.tsx`
- `app/dashboard/clients/ClientsClient.tsx` — solo lo usa `clients/page.tsx`

**Si el agente considera que alguno de estos SÍ pertenece a un dominio, REPORTAR pero NO moverlo.**

---

### PARTE D — Actualización de imports internos entre componentes movidos

Algunos componentes que se mueven importan OTROS componentes que también se mueven. Estos imports internos deben actualizarse DESPUÉS de mover todos los archivos.

Casos conocidos:
1. `DashboardTopbar.tsx` (→ `shared/components/layout/`) importa `NotificationPanel` (→ `domains/notification/components/`). Actualizar: `@/domains/notification/components/NotificationPanel`
2. `SearchCard.tsx` (→ `shared/components/marketing/`) importa `SearchResultsModal` con dynamic import (→ `shared/components/marketing/`). Actualizar a ruta relativa `./SearchResultsModal` o absoluta `@/shared/components/marketing/SearchResultsModal`
3. `SearchCard.tsx` importa `type SearchProperty` de `SearchResultsModal`. Actualizar la misma ruta.
4. `PropertyMapWrapper.tsx` importa `PropertyMap` con ruta relativa `./PropertyMap`. Ambos se mueven juntos → la ruta relativa se mantiene.

**INSTRUCCIÓN**: Después de mover todos los archivos, ejecutar `grep -rn "from '@/components/" src/` para encontrar CUALQUIER import roto que apunte a la carpeta antigua. Deben ser CERO resultados. Si hay resultados, son imports no mapeados — **REPORTAR** cada uno antes de corregirlo.

---

### PARTE E — Eliminar `src/components/`

Una vez que TODOS los componentes estén movidos y TODOS los imports actualizados:
1. Verificar que `src/components/` esté completamente vacía
2. Eliminar la carpeta `src/components/`
3. Si quedan archivos sin mover, **REPORTAR** — no eliminar la carpeta hasta que esté vacía

---

### PARTE F — Verificaciones

1. `grep -rn "from '@/components/" src/` → **CERO** resultados
2. `find src/components -type f 2>/dev/null` → carpeta no existe o vacía
3. `tsc --noEmit` → compila sin errores
4. Verificar que los duplicados fueron eliminados:
   - `src/app/dashboard/properties/[id]/rooms/new/BedPicker.tsx` NO existe
   - `src/app/dashboard/properties/[id]/rooms/new/ServicesChecklist.tsx` NO existe
5. Contar archivos por ubicación:
   - `find src/domains/*/components -type f | wc -l` → debería ser ~46 (dominio components)
   - `find src/shared/components -type f | wc -l` → debería ser ~16 (shared components)

**Si algún grep devuelve resultados no esperados, REPORTAR con archivo y línea.**

---

### PARTE G — Actualizar HEARTBEAT.md

- Actualizar la sección "UI Components" para reflejar la nueva ubicación
- Cambiar la categorización de "Stitch/Layout", "Dashboard", "UI primitives", "Feature" a la nueva estructura por dominios
- Agregar nota en "Architecture Migration Status": "Fase 3 completada: componentes co-localizados por dominio. src/components/ eliminada."
- Actualizar fecha de `Last updated`

---

## RESTRICCIONES EXPLÍCITAS

- **NO modificar** la lógica interna de ningún componente
- **NO renombrar** componentes (solo mover archivos)
- **NO cambiar** props, exports, o la interfaz pública de ningún componente
- **NO crear** componentes nuevos (algunos que lista ARCHITECTURE.md no existen aún — ignorarlos)
- **NO crear** barrel exports (`index.ts`) en las carpetas de componentes
- **NO mover** los 3 archivos excluidos de `app/` (CookiePreferencesReset, SettingsClient, ClientsClient)
- Si un componente movido tiene imports de dynamic (`next/dynamic`) con ruta de string, actualizar esa ruta también
- Si un componente movido importa desde `@/domains/` con ruta que ya es correcta, NO tocarlo
- Procesar los movimientos en este orden: Parte A primero, luego B, luego C, luego D (imports internos). Esto evita romper imports intermedios

---

## VALIDATION GATE

- [ ] `tsc --noEmit` pasa sin errores
- [ ] `grep -rn "from '@/components/" src/` devuelve 0 resultados
- [ ] `src/components/` no existe
- [ ] Los 2 archivos duplicados en `rooms/new/` eliminados
- [ ] `HEARTBEAT.md` actualizado
- [ ] Plugin `frontend-design` ejecutado si hay cambios de UI (en este caso NO hay — solo movimientos)
