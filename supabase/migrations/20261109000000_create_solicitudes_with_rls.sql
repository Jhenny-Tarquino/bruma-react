begin;

create table public.solicitudes (
  id_solicitud uuid primary key default gen_random_uuid(),
  cliente_id uuid not null default auth.uid() references auth.users (id),
  nombre_cliente varchar(120) not null,
  contacto varchar(254) not null,
  tipo_servicio varchar(80) not null,
  mensaje text not null,
  fecha_solicitud timestamptz not null default now(),
  estado text not null default 'pendiente',
  constraint solicitudes_nombre_cliente_not_blank
    check (nombre_cliente ~ '[^[:space:]]'),
  constraint solicitudes_contacto_valid
    check (
      length(btrim(contacto)) between 3 and 254
      and (
        btrim(contacto) ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
        or btrim(contacto) ~ '^\+?[0-9][0-9 ()-]{6,19}$'
      )
    ),
  constraint solicitudes_tipo_servicio_not_blank
    check (tipo_servicio ~ '[^[:space:]]'),
  constraint solicitudes_mensaje_not_blank
    check (mensaje ~ '[^[:space:]]'),
  constraint solicitudes_estado_valid
    check (estado in ('pendiente', 'en proceso', 'aceptada', 'rechazada'))
);

create index solicitudes_cliente_id_idx on public.solicitudes (cliente_id);
create index solicitudes_estado_idx on public.solicitudes (estado);

alter table public.solicitudes enable row level security;

revoke all on table public.solicitudes from public, anon, authenticated;
grant select, insert, update, delete on table public.solicitudes to authenticated;

create policy solicitudes_select_by_owner_or_staff
  on public.solicitudes
  for select
  to authenticated
  using (
    cliente_id = (select auth.uid())
    or (select (auth.jwt() -> 'app_metadata' ->> 'bruma_role')) in ('staff', 'admin')
  );

create policy solicitudes_insert_by_owner_or_admin
  on public.solicitudes
  for insert
  to authenticated
  with check (
    (
      (select auth.uid()) is not null
      and cliente_id = (select auth.uid())
      and estado = 'pendiente'
      and coalesce((select (auth.jwt() -> 'app_metadata' ->> 'bruma_role')), 'client') = 'client'
    )
    or (select (auth.jwt() -> 'app_metadata' ->> 'bruma_role')) = 'admin'
  );

create policy solicitudes_update_by_staff_or_admin
  on public.solicitudes
  for update
  to authenticated
  using ((select (auth.jwt() -> 'app_metadata' ->> 'bruma_role')) in ('staff', 'admin'))
  with check ((select (auth.jwt() -> 'app_metadata' ->> 'bruma_role')) in ('staff', 'admin'));

create policy solicitudes_delete_by_admin
  on public.solicitudes
  for delete
  to authenticated
  using ((select (auth.jwt() -> 'app_metadata' ->> 'bruma_role')) = 'admin');

create function public.guard_solicitudes_client_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bruma_role text := (auth.jwt() -> 'app_metadata' ->> 'bruma_role');
begin
  if coalesce(bruma_role, 'client') = 'client' then
    if new.cliente_id is distinct from auth.uid() then
      raise exception 'La solicitud debe pertenecer al usuario autenticado'
        using errcode = '42501';
    end if;
    if new.estado is distinct from 'pendiente' then
      raise exception 'El cliente no puede asignar el estado de una solicitud'
        using errcode = '42501';
    end if;

    new.id_solicitud := gen_random_uuid();
    new.fecha_solicitud := now();
  elsif bruma_role = 'staff' then
    raise exception 'Personal BRUMA no puede crear solicitudes'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_solicitudes_client_insert() from public, anon, authenticated;

create trigger solicitudes_owner_and_status_on_insert
  before insert on public.solicitudes
  for each row
  execute function public.guard_solicitudes_client_insert();

create function public.guard_solicitudes_staff_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bruma_role text := (auth.jwt() -> 'app_metadata' ->> 'bruma_role');
begin
  if bruma_role = 'staff' and (
    new.id_solicitud is distinct from old.id_solicitud
    or new.cliente_id is distinct from old.cliente_id
    or new.nombre_cliente is distinct from old.nombre_cliente
    or new.contacto is distinct from old.contacto
    or new.tipo_servicio is distinct from old.tipo_servicio
    or new.mensaje is distinct from old.mensaje
    or new.fecha_solicitud is distinct from old.fecha_solicitud
  ) then
    raise exception 'Personal BRUMA solo puede actualizar el estado de una solicitud'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_solicitudes_staff_update() from public, anon, authenticated;

create trigger solicitudes_staff_status_only
  before update of id_solicitud, cliente_id, nombre_cliente, contacto, tipo_servicio, mensaje, fecha_solicitud
  on public.solicitudes
  for each row
  execute function public.guard_solicitudes_staff_update();

comment on table public.solicitudes is
  'BRUMA service requests. Authenticated users own their rows; staff may only change estado.';
comment on column public.solicitudes.cliente_id is
  'Defaults to auth.uid(); insert RLS prevents clients from assigning a different owner.';
comment on column public.solicitudes.estado is
  'Allowed values: pendiente, en proceso, aceptada, rechazada.';

commit;
