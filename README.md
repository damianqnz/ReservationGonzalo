# ReservationGonzalo

Plataforma de reservas directas para alojamiento de corta estancia en Lisboa, Portugal. Diseñada para que propietarios de Alojamento Local (AL) gestionen reservas, pagos y huéspedes sin depender de plataformas intermediarias como Airbnb.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript 5 (strict) |
| Base de datos | PostgreSQL 16 + Prisma ORM 6 |
| Autenticación | NextAuth v5 — Credentials + Google OAuth |
| Pagos | Stripe (PaymentIntents + Webhooks) |
| Email | Resend + React Email |
| Imágenes | Cloudinary |
| Estilos | Tailwind CSS 4 |
| Validación | Zod 4 + React Hook Form |
| Deploy | Vercel |

## Funcionalidades

**Portal público**
- Listado y detalle de propiedades con galería, mapa y descripción
- Widget de reservas con disponibilidad en tiempo real
- Precios dinámicos: temporada, fines de semana, estancias largas (≥7 noches)
- Checkout completo con Stripe Elements
- Portal del huésped para consultar y gestionar reservas por código de confirmación

**Dashboard del propietario**
- CRUD completo de propiedades y habitaciones
- Calendario de reservas con bloqueos manuales
- Gestión de reseñas (aprobar, rechazar, responder, importar externas)
- Sistema de cupones con 7 tipos de validación
- Analytics: revenue, ocupación, look-to-book ratio, desglose por nacionalidad
- Sincronización iCal bidireccional (exportar + importar calendarios externos)
- Notificaciones en tiempo real con push notifications (Web Push API)
- Exportación de clientes a CSV

**Infraestructura**
- 11 servicios de negocio, 48 endpoints de API, 35+ páginas
- Webhook de Stripe con verificación de firma e idempotencia
- 7 plantillas de email transaccional (confirmación, recordatorio, cancelación, etc.)
- Cron jobs: expiración de reservas pendientes, recordatorios, resumen mensual
- Rate limiting en endpoints públicos
- Autenticación con bcrypt (rounds=12) y sesiones JWT

## Requisitos previos

- Node.js ≥ 20
- Docker (para PostgreSQL local)
- Cuenta de Stripe (modo test para desarrollo)
- Cuenta de Resend (para emails)
- Cuenta de Cloudinary (para imágenes)

## Instalación

```bash
git clone https://github.com/damianqnz/ReservationGonzalo.git
cd ReservationGonzalo
npm install
```

Copia el archivo de variables de entorno y completa los valores:

```bash
cp .env.example .env.local
```

Levanta la base de datos y aplica las migraciones:

```bash
docker compose up -d
npx prisma migrate dev
npx prisma db seed
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Variables de entorno

```env
# Base de datos
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (opcional en desarrollo)
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

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run lint         # ESLint
npm run tech-stack   # Actualiza TECH_STACK.md con versiones actuales

npx prisma studio    # Interfaz visual de la base de datos (puerto 5555)
npx prisma migrate dev    # Aplica migraciones pendientes
npx prisma generate       # Regenera el cliente tras cambios en el schema

# Para testing de webhooks de Stripe en local:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Arquitectura

El proyecto sigue una estructura orientada a dominio. La lógica de negocio reside exclusivamente en `src/lib/services/`, las rutas de API actúan como controladores delgados, y todo acceso a base de datos pasa por el singleton de Prisma en `src/lib/db.ts`.

```
src/
├── app/
│   ├── api/          # 48 endpoints organizados por dominio
│   ├── dashboard/    # Panel del propietario (autenticado)
│   ├── portal/       # Portal del huésped
│   └── ...           # Páginas públicas
├── components/       # Componentes React (Server por defecto)
├── lib/
│   ├── services/     # 11 servicios de negocio
│   ├── db.ts         # Prisma singleton
│   └── auth.ts       # NextAuth config
└── types/            # Tipos TypeScript compartidos
```

## Contexto del negocio

- **Mercado**: Portugal — EUR, IVA 6% en alojamiento
- **Idiomas**: Portugués (PT), Español (ES), Inglés (EN)
- **Marco legal**: Alojamento Local (AL)
- **Zona horaria**: `Europe/Lisbon` (UTC+0 / UTC+1 DST)
- **Modelo**: Sin comisiones de plataforma — pago directo al propietario vía Stripe
