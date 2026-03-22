# Arriendos Verbenal

Plataforma web para publicar y buscar arriendos en Bogotá con contacto directo por WhatsApp.

## Stack

- Next.js 15 (App Router, Server Components)
- React 18 + TypeScript
- Tailwind CSS
- Supabase (tabla `public.listings`)

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+
- Proyecto Supabase con la tabla `listings`

## Variables de entorno

Crear `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
# opcional: hosts adicionales para next/image (CSV)
# NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS=cdn.ejemplo.com
```

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Panel Admin

- Login: `/admin/login`
- Dashboard: `/admin`
- Inmuebles: `/admin/listings`

Para poder ingresar:

1. Crea un usuario en Supabase Auth.
2. Asígnale rol en `public.profiles` (admin/editor).
3. Inicia sesión en `/admin/login` con ese correo y contraseña.

Desde el panel puedes:

- Crear y editar inmuebles con campos completos (incluye `area_m2` y contexto residencial).
- Gestionar estado (`draft`, `active`, `rented`, etc).
- Cargar múltiples fotos al bucket `listing-images`.
- Marcar portada y eliminar fotos existentes.
- Administrar puntos cercanos (`listing_pois`) tipo parque/transporte/supermercado, etc.

## Scripts

```bash
npm run dev     # desarrollo
npm run lint    # eslint + rules de Next
npm run test    # tests unitarios
npm run test:e2e
npm run build   # build de producción
npm run start   # correr build en local
```

## Producción (Vercel + GitHub + Supabase)

Guía completa de despliegue y hardening:

- [`docs/PRODUCTION_DEPLOYMENT.md`](./docs/PRODUCTION_DEPLOYMENT.md)

Incluye:

- Estrategia Preview + Production en Vercel
- Dos proyectos Supabase (staging/prod)
- CI/CD estricto en GitHub Actions
- Headers de seguridad y rate limiting de login admin
- Checklist de go-live y rollback

## Estructura del proyecto

```txt
app/
  page.tsx                 # Home (SSR + resultados filtrables en cliente)
  listing/[id]/page.tsx    # Detalle de inmueble
components/
  search/                  # Search pill + tabs + estado de filtros
  listing/                 # Card, grid, specs, gallery, CTA WhatsApp
  ui/                      # Button, Icon, Chip, Card
lib/
  data/listings.ts         # Acceso a Supabase
  domain/                  # Tipos y formateadores
  supabase/server.ts       # Cliente Supabase server-side
supabase/
  001_listings.sql         # Setup completo (tabla, índices, RLS, seed)
```

## Base de datos (Supabase)

Ejecuta estos scripts en este orden en SQL Editor:

1. [`supabase/001_listings.sql`](./supabase/001_listings.sql)
2. [`supabase/002_admin_foundation.sql`](./supabase/002_admin_foundation.sql)
3. [`supabase/003_legacy_backfill.sql`](./supabase/003_legacy_backfill.sql) (recomendado para datos antiguos)
4. [`supabase/004_quality_guards.sql`](./supabase/004_quality_guards.sql) (recomendado para blindaje de calidad sin bloquear legacy)
5. [`supabase/005_validate_quality_guards.sql`](./supabase/005_validate_quality_guards.sql) (ejecutar cuando los datos legacy ya esten completos)

El script `001` crea:

- Crear `public.listings`
- Crear índices
- Configurar `updated_at` automático
- Activar RLS con lectura pública
- Crear bucket público `listing-images`
- Insertar datos de ejemplo

El script `002` agrega:

- Fundación de panel admin (`public.profiles` + helper `is_admin_or_editor()`)
- Nuevos campos de `listings` (incluye `area_m2`, estado y contexto residencial)
- Tablas `public.listing_photos`, `public.listing_pois`, `public.listing_audit_logs`
- Políticas RLS para lectura pública de activos y escritura solo admin/editor

El script `003` ajusta datos legacy:

- Completa campos faltantes de habitaciones (`room_bathroom_private`, `kitchen_access`, `cohabitants_count`)
- Normaliza `listing_kind` en registros antiguos
- Completa timestamps `published_at`/`rented_at` cuando faltan

El script `004` agrega guardas de calidad en DB:

- Exige `area_m2` para apartamento/casa/apartaestudio
- Exige `room_bathroom_private` y `kitchen_access` para habitaciones
- Exige `cohabitants_count` para habitacion compartida

`004` crea estas guardas como `NOT VALID`, por lo que no rompe datos antiguos.
`005` valida las guardas cuando ya no existan filas legacy incompletas.

Después de crear tu primer usuario en Supabase Auth, asígnalo como admin:

```sql
insert into public.profiles (id, role, full_name)
values ('TU_AUTH_USER_UUID', 'admin', 'Tu nombre')
on conflict (id) do update
set role = excluded.role, full_name = excluded.full_name;
```

## Decisiones actuales

- Solo se muestran inmuebles `status = 'active'`
- `revalidate = 60` en home y detalle
- Filtros en cliente (barrio, precio máximo, habitaciones mínimas)
- Contacto por enlace de WhatsApp prellenado

## Próximos pasos recomendados

- Agregar tests unitarios para filtros y formateadores
- Agregar E2E para flujo home -> detalle -> contacto
- Mantener actualización continua de dependencias (Dependabot)
