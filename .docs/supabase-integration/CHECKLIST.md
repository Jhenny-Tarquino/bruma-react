# Integración Supabase de BRUMA — checklist

## Descubrimiento y modelo

- [x] Revisar el proyecto y validar el PDF. Evidencia: `react-app` es React 19/Vite 8 con `@supabase/supabase-js`; la ruta indicada `../docs/Modelo, CRUD y RLS (1).pdf` no existe desde la raíz Git, pero el PDF homónimo adjuntado está en `C:\Users\LEGION\Downloads\Modelo, CRUD y RLS (1).pdf` (799,468 bytes) y fue extraído/revisado visualmente en el trabajo anterior.
- [x] Documentar el modelo y su correspondencia con la aplicación. Evidencia: [ANALISIS.md](./ANALISIS.md), incluye decisiones separadas de los datos del PDF.

## Supabase Cloud y esquema

- [x] Identificar y enlazar el proyecto remoto mediante CLI. Evidencia: `npx.cmd supabase projects list` muestra `bruma Project`, ref `qpjkooyqvqpgonbucjzx`, estado `ACTIVE_HEALTHY`, `linked: true`; `supabase/.temp/project-ref` coincide. No se creó otro proyecto.
- [ ] Aplicar y verificar migraciones y permisos. `migration list --linked` muestra el historial remoto vacío; `db push --dry-run --linked` anuncia solo `20261109000000_create_solicitudes_with_rls.sql`; `supabase gen types --linked --schema public` confirma que ambas tablas (`solicitudes`, `solicitud_servicio`) están ausentes. No ejecuté `db push`; falta revisión/aprobación del SQL y luego aplicar/verificar en Cloud.

## Aplicación

- [x] Configurar el SDK y las variables de entorno. Evidencia: `src/lib/supabaseClient.js`, `.env.example`, `.gitignore`, `.env.local` (ignorado por Git); `GET /auth/v1/settings` con la clave pública devolvió HTTP 200.
- [ ] Integrar y comprobar cada operación CRUD requerida.

  Entidad `SOLICITUD_SERVICIO` / tabla de implementación `public.solicitudes`:

  | Operación | Cliente | Personal BRUMA | Administrador |
  |---|---|---|---|
  | CREATE | Sí, propio | No | Sí |
  | READ | Solo propios | Todas | Todas |
  | UPDATE | No | Sí, estado | Sí |
  | DELETE | No | No | Sí |

  Hay exactamente tres roles BRUMA. A y B son dos cuentas de Cliente para probar aislamiento.

  - [ ] Cliente — CREATE. Código: `ContactForm.jsx` inserta sin enviar propietario; la BD lo deriva con `auth.uid()`. No comprobado contra Cloud.
  - [ ] Cliente — READ propio. Código: `RequestServicePage.jsx`; política RLS del propietario. No comprobado contra Cloud.
  - [ ] Cliente — UPDATE. No permitido por la matriz; política ausente prevista. Denegación pendiente de prueba remota.
  - [ ] Cliente — DELETE. No permitido por la matriz; política ausente prevista. Denegación pendiente de prueba remota.
  - [ ] Personal BRUMA — READ. Código/política preparados con claim confiable `app_metadata.bruma_role = staff`. Prueba remota pendiente.
  - [ ] Personal BRUMA — UPDATE solo `estado`. UI y trigger preparados; permiso por columna/política no comprobados en Cloud.
  - [ ] Personal BRUMA — CREATE/DELETE. No permitido por la matriz. Denegación pendiente de prueba remota.
  - [ ] Admin — CREATE/READ/UPDATE/DELETE. Políticas SQL previstas; el cliente incluye creación, lectura, edición y eliminación. Pruebas con cuenta real pendientes.

- [ ] Verificar persistencia, permisos y CRUD de Cloud. Pendiente: migración no aplicada; faltan cuentas reales A/B/Personal/Admin. No se simulan resultados.
- [x] Documentar la ejecución y los pendientes. Evidencia: [SUPABASE_SETUP.md](../../SUPABASE_SETUP.md), [SUPABASE_RLS_TEST_PLAN.md](../../SUPABASE_RLS_TEST_PLAN.md), este checklist y [ANALISIS.md](./ANALISIS.md).

## Verificación local

- [x] Compilación local. Evidencia: `npm.cmd run build` terminó correctamente en Vite 8.3.1 (87 módulos).
- [ ] Lint. No hay script `lint` en `package.json`; no aplica con la configuración actual.
- [ ] Pruebas CRUD/RLS contra Cloud. No ejecutadas: el esquema aún no se aplicó y faltan cuentas/credenciales reales de prueba.
- [x] Sintaxis de scripts y cliente. Evidencia: `node --check scripts/verify-rls.mjs` y `node --check src/lib/supabaseClient.js` pasaron.
- [x] Servidor local y recursos principales. Evidencia: Vite en `http://127.0.0.1:5173/`; HTTP 200 para `/`, `/solicitar-servicio.html` y módulos de `RequestServicePage.jsx`/`ContactForm.jsx`.
- [x] `git diff --check` y revisión de secretos. Evidencia: `git diff --check` sin errores; `.env.local` contiene solo URL/clave pública y está ignorado por Git; `.env.rls-test` no existe y su ejemplo no contiene valores.

## Siguiente acción para retomar

Revisar el SQL de [la migración](../../supabase/migrations/20261109000000_create_solicitudes_with_rls.sql) y el resumen de cambios presentado en esta revisión. Tras aprobación explícita, aplicar con `npx.cmd supabase db push --linked`, verificar con `npx.cmd supabase migration list --linked`, preparar cuentas reales A/B (dos clientes), Personal y Admin, y ejecutar `npm run test:rls`. No volver a crear la organización, el proyecto, `supabase init` ni una migración duplicada.
