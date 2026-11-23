# Análisis del modelo, CRUD y RLS de BRUMA

## Fuente revisada

- PDF indicado por la persona: `C:\Users\LEGION\Downloads\Modelo, CRUD y RLS (1).pdf` (799,468 bytes, tres páginas). Es una referencia externa al repositorio y se conserva en su ubicación original.
- El PDF presenta una entidad `SOLICITUD_SERVICIO`, una matriz CRUD por rol y recomendaciones de validación/RLS. El diagrama/modelo y la matriz son requisitos; las decisiones de SQL señaladas abajo son implementación y no se atribuyen al PDF.
- No hay copia del PDF dentro del repositorio. Se registran aquí los elementos legibles para que la integración pueda retomarse sin volver a inferirlos.

## Entidad y correspondencia SQL

| Campo en el modelo | Tipo PostgreSQL de origen | Mapeo local preparado | Clave, nulabilidad, valor/regla |
|---|---|---|---|
| `id_solicitud` | No especificado en el PDF | `uuid` | PK; `NOT NULL`; `gen_random_uuid()` en implementación |
| `cliente_id` | No especificado en el PDF | `uuid` | FK a `auth.users(id)`; `NOT NULL`; default `auth.uid()` |
| `nombre_cliente` | No especificado en el PDF | `varchar(120)` | `NOT NULL`; trim no vacío y límite de 120 |
| `contacto` | No especificado en el PDF | `varchar(254)` | `NOT NULL`; email o teléfono validado por constraint |
| `tipo_servicio` | No especificado en el PDF | `varchar(80)` | `NOT NULL`; trim no vacío y límite de 80 |
| `mensaje` | No especificado en el PDF | `text` | `NOT NULL`; trim no vacío y límite de 3000 |
| `fecha_solicitud` | No especificado en el PDF | `timestamptz` | `NOT NULL`; default `now()` |
| `estado` | No especificado en el PDF | `text` con CHECK | `NOT NULL`; default `pendiente`; valores del PDF: `pendiente`, `en proceso`, `aceptada`, `rechazada` |

El PDF no fija tipos SQL, nullabilidad, tamaños, reglas de borrado de FK ni defaults; por eso esos elementos son decisiones de implementación en [la migración local](../../supabase/migrations/20261109000000_create_solicitudes_with_rls.sql). La FK no declara `ON DELETE CASCADE`; el comportamiento PostgreSQL por defecto impide borrar el usuario mientras tenga solicitudes, evitando perder solicitudes silenciosamente. Confirmar si ese comportamiento es el deseado antes de cambiarlo.

## Relaciones y cardinalidad

- Un cliente de Supabase Auth puede tener cero o muchas solicitudes; cada solicitud pertenece a un cliente. Se representa con `solicitudes.cliente_id → auth.users.id`.
- El modelo no requiere tablas intermedias ni otras entidades.
- No se especifica eliminación en cascada en el documento.

## CRUD, acceso y flujo

La matriz CRUD del PDF define el acceso funcional por rol. El CRUD no se interpreta como una autorización para usuarios anónimos.

| Operación | Cliente | Personal BRUMA | Administrador |
|---|---|---|---|
| CREATE | Sí, solo para sí | No | Sí |
| READ | Solo propias | Todas | Todas |
| UPDATE | No | Sí, estado autorizado por el modelo | Sí |
| DELETE | No | No | Sí |

Estos son exactamente los tres roles de BRUMA. Las cuentas A y B del procedimiento son dos usuarios del rol Cliente, no roles separados.

| Referencia del PDF | Entidad | Operación | Acceso indicado | Flujo/archivo React | Verificación actual |
|---|---|---|---|---|---|
| Modelo + matriz CRUD | `SOLICITUD_SERVICIO` / `public.solicitudes` | CREATE | Cliente autenticado para sí; Admin CRUD | `src/components/ContactForm.jsx`, `src/RequestServicePage.jsx` | Código local y cliente Cloud preparado; migración pendiente |
| Matriz CRUD | Solicitudes | READ | Cliente solo propias; Personal BRUMA y Admin según su rol | `src/RequestServicePage.jsx` | RLS local preparada; tabla aún no existe en remoto |
| Matriz CRUD | Solicitudes | UPDATE | Personal solo `estado`; Admin CRUD | `src/RequestServicePage.jsx` | UI y trigger local; sesión/DB real pendiente |
| Matriz CRUD | Solicitudes | DELETE | Solo Admin | `src/RequestServicePage.jsx` | UI y política local preparadas; prueba real pendiente |

La aplicación ya usa Auth de Supabase. Personal/Admin se distingue mediante `app_metadata.bruma_role` (`staff`/`admin`), que debe asignar un operador confiable fuera del navegador. Clientes usan rol por defecto `client`. El modelo CRUD no prescribe una fuente concreta de identidad/claims; usar metadata confiable es una decisión técnica para no permitir que el usuario se otorgue privilegios.

## Correspondencia visual y de flujos

- Solicitud del cliente: el formulario conserva nombre, emprendimiento, servicio, contacto y mensaje. El modelo no incluye `emprendimiento`; actualmente se concatena en `mensaje` con una etiqueta `Emprendimiento:` para no inventar una columna.
- Sesión: `RequestServicePage.jsx` ofrece registro e inicio de sesión para habilitar la identidad que exigen RLS y `auth.uid()`.
- Historial: la vista consulta `public.solicitudes`; RLS filtra las solicitudes de clientes propietarios.
- Personal: ve solicitudes y puede cambiar el estado. La restricción real se implementa en PostgreSQL, no depende del selector React.
- Admin: la vista incluye controles para crear, leer, modificar campos de solicitud y eliminar. Admin puede cambiar el propietario; cliente/personal no pueden.

## Seguridad preparada

- RLS activa en `public.solicitudes`; políticas separadas para SELECT, INSERT, UPDATE y DELETE.
- `solicitudes_select_by_owner_or_staff` (`SELECT`): cliente ve `cliente_id = auth.uid()`; Personal/Admin ven todas por `app_metadata.bruma_role`.
- `solicitudes_insert_by_owner_or_admin` (`INSERT ... WITH CHECK`): cliente autenticado solo inserta su propio ID y estado inicial pendiente; Admin puede crear para cualquier cliente; Personal y anónimo no.
- `solicitudes_update_by_staff_or_admin` (`UPDATE USING` + `WITH CHECK`): permite Personal/Admin; el trigger `solicitudes_staff_status_only` rechaza que Personal modifique columnas distintas de `estado`. Clientes no tienen permiso RLS de update.
- `solicitudes_delete_by_admin` (`DELETE`): solo Administrador; Cliente y Personal carecen de política de borrado.
- INSERT de cliente requiere `cliente_id = auth.uid()` y estado inicial `pendiente`. Default y trigger fuerzan valores generados; `WITH CHECK` rechaza propietario ajeno.
- SELECT de cliente limita a su `cliente_id`; Personal/Admin requiere claim confiable.
- Personal puede actualizar registros pero un trigger rechaza cambios de cualquier columna salvo `estado`; Admin conserva CRUD.
- Anónimo no recibe grants. No se usa `service_role` en React ni en el script de pruebas.
- El PDF incluye el estado `en proceso`; reemplaza la variante anterior `en revisión` en la implementación actual para mantener correspondencia con la fuente de este encargo.

## Diferencias, dudas y bloqueos

1. La ruta literal `../docs/Modelo, CRUD y RLS (1).pdf` no existe relativa a la raíz Git. Se usó el PDF adjuntado con el mismo nombre desde `C:\Users\LEGION\Downloads`; si son documentos distintos, reemplazar el análisis antes de desplegar. El diagrama nombra la entidad `SOLICITUD_SERVICIO`, mientras que el ejemplo RLS del PDF y el código React usan `solicitudes`; se conserva `public.solicitudes` para no romper el flujo existente y coincidir con el ejemplo.
2. No se especifican tipos, longitudes, campos opcionales o política de borrado de cuenta. Las restricciones locales son decisiones conservadoras; confirmar reglas del negocio si se necesitan campos opcionales o límites distintos.
3. La app tiene campo Emprendimiento, pero el modelo no; se conserva dentro del mensaje en lugar de ampliar el esquema.
4. Proyecto Cloud existente: `bruma Project`, ref `qpjkooyqvqpgonbucjzx`, región `us-east-2`, estado `ACTIVE_HEALTHY`; el enlace está verificado y `.env.local` contiene URL y clave pública publishable.
5. El historial remoto no contiene migraciones; la vista previa indica solo la migración local pendiente. La introspección `supabase gen types --linked --schema public` confirma que no existen `solicitudes` ni `solicitud_servicio`. No se aplicó SQL. `db dump` no pudo usarse porque requiere Docker; no se instaló ni se inició.
6. Las pruebas RLS están preparadas para cuatro cuentas (A/B comparten el rol Cliente, más Personal y Admin), pero no son evidencia hasta correr `npm run test:rls`.
