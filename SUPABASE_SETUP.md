# Supabase setup

## Entorno e instalación

- Sistema: Windows 11 x64 (Windows build 26100).
- Proyecto: React 19 con JavaScript/JSX y Vite 8; npm es el gestor de paquetes.
- Node.js: v24.19.0; npm: 11.17.0.
- Supabase CLI: v2.122.0, instalada como dependencia de desarrollo con `npm install --save-dev supabase` según la guía oficial de Supabase.
- SDK: `@supabase/supabase-js`, instalado como dependencia de ejecución.
- Supabase está preparado para Cloud. No se instaló ni ejecutó Docker.
- Roles BRUMA: exactamente tres, Cliente (`client`), Personal (`staff`) y Administrador (`admin`). A y B son cuentas distintas del mismo rol Cliente.

## Matriz CRUD requerida

| Operación | Cliente | Personal BRUMA | Administrador |
|---|---|---|---|
| CREATE | Sí, solo para sí | No | Sí |
| READ | Solo propias | Todas | Todas |
| UPDATE | No | Sí, limitado al estado que define el modelo | Sí |
| DELETE | No | No | Sí |

Personal/Admin se identifica con `app_metadata.bruma_role`, un claim establecido por un canal administrativo confiable. React no permite que un usuario edite este claim; RLS evalúa los claims y la base aplica un trigger para limitar las columnas que Personal puede cambiar.

## Estado de CLI y cuenta

- `npx supabase init` terminó correctamente y creó `supabase/config.toml`.
- La sesión está autenticada y `npx.cmd supabase whoami` reconoce la cuenta.
- La CLI mostró primero listas vacías; la persona indicó que creó el proyecto desde el Dashboard y entregó el ref. Se reutilizó ese proyecto, no se creó otro.
- `npx.cmd supabase projects list` confirma `bruma Project`, ref `qpjkooyqvqpgonbucjzx`, región `us-east-2`, estado `ACTIVE_HEALTHY`, `linked: true`.

## Estado actual del trabajo

- **Implementación local:** cliente SDK, formulario, vistas CRUD y migración SQL preparados; `.env.local` contiene URL y clave pública publishable del proyecto (ignorado por Git); build y endpoint Auth HTTP pasaron.
- **Proyecto remoto:** enlazado al proyecto existente `qpjkooyqvqpgonbucjzx`.
- **Esquema remoto:** el historial de migraciones está vacío y `supabase gen types --linked --schema public` no encuentra `solicitudes` ni `solicitud_servicio`.
- **Migración:** presente en `supabase/migrations/`; `npx.cmd supabase db push --dry-run --linked` anuncia únicamente `20261109000000_create_solicitudes_with_rls.sql`. No se ejecutó el push real; queda pendiente de revisión y aprobación explícita del cambio SQL.
- **Pruebas remotas:** pendientes. El script requiere sesiones reales de Cliente A, Cliente B, Personal y Admin; A/B son cuentas del mismo rol, no roles distintos.
- **Roles BRUMA:** exactamente Cliente (`client`), Personal (`staff`) y Administrador (`admin`); no existe un cuarto rol.

## Configuración del cliente

Archivos preparados:

- `.env.example`: nombres de las variables requeridas, sin credenciales.
- `.gitignore`: excluye los archivos `.env*` y conserva `.env.example` versionable.
- `src/lib/supabaseClient.js`: inicializa un único cliente solo cuando existen ambas variables; sin configuración, la página muestra un aviso y no crashea.
- `supabase/config.toml`: configuración local creada por la CLI.
- `supabase/migrations/20261109000000_create_solicitudes_with_rls.sql`: tabla, validaciones y políticas CRUD según la matriz del PDF; todavía no aplicada a Cloud.
- `scripts/verify-rls.mjs`: pruebas con sesiones reales A, B, personal y administrador; pendientes de ejecutar cuando exista un proyecto y las cuentas.
- `.docs/supabase-integration/ANALISIS.md` y `CHECKLIST.md`: correspondencia con el PDF y estado de ejecución actual.
- `SUPABASE_RLS_TEST_PLAN.md`: preparación y casos de seguridad por rol.

Crea `.env.local` a partir de `.env.example` y completa los valores desde **Project Settings → API** o el panel **Connect** de tu proyecto:

```dotenv
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

En el estado actual, `.env.local` ya fue creado localmente con los valores públicos del proyecto `qpjkooyqvqpgonbucjzx`; sus valores no se muestran ni se versionan.

Usa únicamente la clave pública `publishable` en el navegador. Nunca incluyas `sb_secret_...`, `service_role` ni tokens de acceso de la CLI en variables `VITE_*`, en el código o en Git. `.env.local` está ignorado por Git.

Para el despliegue en GitHub Pages, configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` como variables de repositorio de GitHub Actions y expórtalas al paso `npm run build`. No añadas una clave secreta ni el token CLI al workflow.

El cliente se importa en `RequestServicePage.jsx`; sin variables locales, la página muestra un aviso de configuración y no inicializa Auth ni envía solicitudes.

## Comandos útiles

Desde la raíz del proyecto:

```powershell
npx.cmd supabase --version
npx.cmd supabase login
npx.cmd supabase orgs list
npx.cmd supabase projects list
npx.cmd supabase link --project-ref <PROJECT_REF>
npm run build
```

En esta máquina PowerShell bloquea `npx.ps1`; se verificó Supabase CLI mediante `npx.cmd`. Las listas estaban vacías antes de que la usuaria creara el proyecto existente desde el Dashboard; actualmente la CLI lo muestra y lo tiene enlazado.

No ejecutar `supabase start`; este proyecto se prepara para Supabase Cloud y no requiere Docker.

## Pendiente

1. Revisar/aprobar la migración y aplicar manualmente con `npx.cmd supabase db push --linked`; luego verificar con `npx.cmd supabase migration list --linked`.
2. Añadir URL y publishable key al archivo local `.env.local` y como variables de GitHub Actions si se habilita Cloud en Pages.
3. Crear cuentas independientes A, B, Personal y Admin. A/B son dos cuentas del rol Cliente. Asignar claims en `app_metadata` por canal confiable fuera de React.
4. Copiar `.env.rls-test.example` a `.env.rls-test` y completar credenciales localmente; ejecutar `npm run test:rls` con sesiones reales.
5. Repetir `npm run build` y cerrar el checklist solo con evidencia remota.

No se creó un proyecto duplicado y no se aplicó ninguna migración remota.

Durante la revisión, `supabase db dump --dry-run` imprimió una contraseña temporal del rol de inicio de sesión que gestiona el CLI. No se copió a archivos ni se repetirá. Supabase documenta que estos roles temporales caducan en pocos cientos de segundos; no es la clave `service_role` ni la contraseña principal de la base de datos. Para evitar exponerla, no volver a imprimir el script dry-run de `db dump`. [Referencia oficial de Supabase](https://supabase.com/kb/troubleshooting/permission-denied-when-deleting-the-cli_login_postgres-role-808bae).

## Verificación actual

- `npx supabase --version`: correcto (`2.122.0`).
- `npm ls supabase @supabase/supabase-js --depth=0`: correcto.
- `node --check src/lib/supabaseClient.js`: correcto.
- `npm run build`: correcto.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- `npm audit`: reporta 2 vulnerabilidades altas en dependencias de desarrollo existentes (`vite` y `source-map-js`). No se ejecutó `npm audit fix` para evitar actualizar la herramienta de build fuera del alcance de esta preparación.
- Login: correcto (`supabase whoami` reconoce la cuenta).
- `projects list`: correcto; proyecto existente aparece como `linked: true`.
- `migration list --linked`: conexión correcta; no hay migraciones remotas aplicadas.
- `db push --dry-run --linked`: correcto; anuncia solo `20261109000000_create_solicitudes_with_rls.sql`; no se aplicó.
- `gen types --linked --schema public`: correcto; no encontró las tablas del modelo en el esquema remoto.
- `GET /auth/v1/settings` con la clave pública de `.env.local`: HTTP 200.
- `db dump --linked --schema public --file ...`: no disponible; CLI informa que requiere Docker/Podman. No se instalaron ni ejecutaron.
- `supabase db push` real y `npm run test:rls`: pendientes de aprobación/esquema y cuentas de prueba.
