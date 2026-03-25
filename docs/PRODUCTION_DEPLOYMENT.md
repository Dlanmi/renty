# Producción en Vercel (GitHub + Supabase)

Este documento describe el flujo recomendado para `arriendos`:

- GitHub privado con PRs obligatorios
- Vercel con Preview (PR) + Production (`main`)
- Supabase separado por entorno (`staging` y `prod`)

## 1) Preparar repositorio Git y GitHub

1. Inicializa Git en local y crea rama principal:
   - `git init`
   - `git checkout -b main`
2. Crea un repositorio **privado** en GitHub.
3. Agrega remoto y sube `main`.
4. Configura protección de rama `main`:
   - Pull request obligatorio.
   - Al menos 1 aprobación.
   - Bloquear pushes directos.
   - Checks obligatorios: workflow `CI`.
5. Activa:
   - Secret scanning.
   - Push protection.
   - Dependabot security updates.

## 2) Qué no subir al repo

- `.env.local` o cualquier `.env` con secretos reales.
- `.vercel`, `.next`, `node_modules`.
- `playwright-report`, `test-results`, `coverage`.
- Dumps, scripts temporales o archivos con credenciales.

Usa `.env.example` como contrato público de variables.

## 3) Supabase por entorno

Crear dos proyectos:

- `arriendos-staging` (Preview)
- `arriendos-prod` (Production)

Ejecutar SQL en ambos, en este orden:

1. `supabase/001_listings.sql`
2. `supabase/002_admin_foundation.sql`
3. `supabase/003_legacy_backfill.sql`
4. `supabase/004_quality_guards.sql`
5. `supabase/005_validate_quality_guards.sql` (solo cuando datos legacy estén completos)

Validar:

- RLS activo en `listings`, `listing_photos`, `listing_pois`, `listing_audit_logs`.
- Bucket `listing-images` público (fase actual).
- Usuario admin creado en Auth + rol en `public.profiles`.

## 4) Vercel

1. Importar el repo desde GitHub.
2. Framework: Next.js (autodetectado).
3. Build command: `npm run build`.
4. Install command: `npm ci`.
5. Preview deployments para PRs.
6. Production deployments solo desde `main`.

Variables en Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Reglas:

- Preview usa Supabase `staging`.
- Production usa Supabase `prod`.

## 5) Seguridad aplicada en la app

- `remotePatterns` de Next.js con allowlist explícita (sin wildcard `**`).
- Validación server-side para nuevas fotos:
  - Máximo 10 archivos por request.
  - Máximo 8MB por archivo.
  - Solo `jpeg/png/webp/avif`.
  - Validación por extensión, MIME y firma binaria.
- Headers de seguridad:
  - `Strict-Transport-Security` (solo producción)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy`
- Rate limiting defensivo en `/admin/login` por IP+email.
- Cookie de refresh admin eliminada (no estaba siendo usada).

## 6) SEO en Preview

- En previews se aplica `noindex,nofollow` en metadata.
- `robots.txt` en preview bloquea todo (`Disallow: /`).

## 7) CI/CD estricto

Workflow `.github/workflows/ci.yml` ejecuta:

1. `npm ci`
2. `npm run lint`
3. `npm run test:unit`
4. `npm run test:e2e`
5. `npm run build`

Secrets requeridos en GitHub Actions para CI (staging):

- `CI_NEXT_PUBLIC_SUPABASE_URL`
- `CI_NEXT_PUBLIC_SUPABASE_ANON_KEY`

Configura branch protection para exigir `CI` antes de merge.

## 8) Checklist de go-live

Automático:

- Lint OK
- Unit OK
- E2E OK
- Build OK

Manual en Preview:

- Home lista activos.
- Detalle abre bien + CTA WhatsApp.
- Login admin funciona.
- Crear/editar inmueble + fotos funciona.
- `draft` no visible público.
- `active` visible en home/detalle/sitemap.
- Logout limpia sesión.
- `robots.txt` y `sitemap.xml` correctos.

Manual post-deploy en Production:

- Smoke de rutas críticas.
- Revisar logs Vercel + Supabase primera hora.
- Monitorear errores 5xx y latencia.

## 9) Rollback

1. Rollback inmediato desde Vercel al deployment estable anterior.
2. Si hay incidente de datos, aplicar plan de reversa SQL documentado por migración.

## 10) Nota sobre credenciales de DB

La app usa `@supabase/supabase-js` sobre HTTPS y no `DATABASE_URL` directa en runtime de Vercel.
Si en el futuro agregas conexión Postgres directa desde serverless, usar:

- Pooler de Supabase
- `sslmode=require`
- Credenciales solo server-side
