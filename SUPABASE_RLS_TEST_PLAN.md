# Pruebas de seguridad RLS para solicitudes BRUMA

## Modelo aplicado desde el PDF

La migración local usa la entidad `solicitudes` y sus campos documentados: `id_solicitud`, `cliente_id`, `nombre_cliente`, `contacto`, `tipo_servicio`, `mensaje`, `fecha_solicitud` y `estado`. Los estados son los del PDF: `pendiente`, `en proceso`, `aceptada` y `rechazada`.

Los roles se leen del claim confiable `app_metadata.bruma_role` con valores `client`, `staff` y `admin`. Los usuarios no pueden asignarse permisos desde el frontend. Solo personal administrativo de confianza debe establecer ese claim; tras cambiarlo, hay que iniciar sesión de nuevo para renovar el JWT.

## Estado de ejecución

Este procedimiento no se ha ejecutado contra una base real. El proyecto existente `bruma Project` (`qpjkooyqvqpgonbucjzx`) está enlazado, pero el historial remoto no tiene migraciones y la introspección indica que no existen `public.solicitudes` ni `public.solicitud_servicio`. La migración no se ha aplicado y no se presentan resultados simulados. Falta revisar/aprobar la migración antes de aplicarla.

## Preparar cuentas reales

1. Crear usuarios Auth de prueba independientes: A, B, Personal y Admin.
2. Dejar A y B con rol cliente (sin `app_metadata.bruma_role` o con valor `client`).
3. Asignar `app_metadata.bruma_role = "staff"` al usuario de personal usando un canal administrativo de confianza, nunca desde React.
4. Asignar `app_metadata.bruma_role = "admin"` a la cuenta Admin usando un canal administrativo de confianza.
5. En `.env.rls-test` local —ignorado por Git— configurar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, email/password para A, B, Personal y Admin.
6. No usar `service_role` ni un token administrativo como clave de cliente.

## Ejecutar las pruebas

Desde la raíz del proyecto, después de vincular Cloud, aplicar la migración y confirmar las cuentas:

```powershell
npm run test:rls
```

El script `scripts/verify-rls.mjs` inicia sesiones separadas con `signInWithPassword` para A, B, Personal y Admin; usa la clave `publishable` y ejecuta operaciones reales mediante Supabase JS. No establece claims manualmente ni utiliza una sesión que omita RLS.

El script crea datos de prueba identificados por UUID, valida permisos de cada rol y al final elimina las filas temporales con la sesión Admin. Si la ejecución se interrumpe antes de la limpieza, revisar y borrar únicamente los registros con `[PRUEBA RLS <runId>]` mediante Admin.

## Casos y resultados esperados

| Caso con sesión real | Resultado esperado |
|---|---|
| A inserta sin `cliente_id` | Permitido; el valor devuelto por la base debe ser el `auth.uid()` de A. |
| B inserta sin `cliente_id` | Permitido; el valor devuelto por la base debe ser el `auth.uid()` de B. |
| A consulta su fila | Permitido. |
| B consulta su fila | Permitido. |
| A consulta el ID de la fila de B | Consulta sin error y cero filas visibles por RLS. |
| B consulta el ID de la fila de A | Consulta sin error y cero filas visibles por RLS. |
| A inserta explícitamente `cliente_id` de B | Rechazado por `WITH CHECK` de RLS. |
| B inserta explícitamente `cliente_id` de A | Rechazado por `WITH CHECK` de RLS. |
| A o B envía nombre con espacios o contacto inválido | Rechazado por constraints de la base de datos. |
| A o B actualiza `estado` | Rechazado por falta de política de UPDATE para clientes. |
| A o B elimina solicitud | Rechazado por falta de política DELETE para clientes. |
| Personal consulta filas de A y B | Permitido. |
| Personal cambia `estado` | Permitido si el valor cumple la constraint. |
| Personal cambia `nombre_cliente`, `contacto`, `tipo_servicio`, `mensaje`, `fecha_solicitud`, `cliente_id` o `id_solicitud` | Rechazado por el trigger de base de datos; los valores deben seguir intactos. |
| Admin crea, consulta, modifica y elimina | Permitido por las políticas Admin; el script verifica las cuatro operaciones. |

Al ejecutarlo, conservar las líneas `PASS` y el identificador del run. La ejecución solo se considera aprobada si todos los casos terminan y el script concluye sin error.

## Migración

La política efectiva prevista está en `supabase/migrations/20261109000000_create_solicitudes_with_rls.sql`. Define políticas separadas para SELECT, INSERT, UPDATE y DELETE, defaults para propietario/fecha/estado, constraints de contenido y un trigger que restringe las columnas que puede cambiar el personal. La cuenta regular no obtiene política UPDATE ni DELETE. No está aplicada en Cloud hasta resolver el acceso a una organización.
