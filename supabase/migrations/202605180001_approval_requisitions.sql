create extension if not exists pgcrypto;

do $$
begin
  create type purchase_requisition_status as enum (
    'AGUARDANDO_APROVACAO',
    'APROVADA',
    'REPROVADA',
    'AJUSTE_SOLICITADO',
    'PEDIDO_FECHADO',
    'CANCELADA'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type purchase_requisition_decision_action as enum (
    'APROVAR',
    'REPROVAR',
    'SOLICITAR_AJUSTE'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists purchase_requisitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  requester_name text not null,
  department text not null,
  urgency text not null check (urgency in ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE')),
  status purchase_requisition_status not null default 'AGUARDANDO_APROVACAO',
  justification text,
  total_value numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_requisition_items (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid not null references purchase_requisitions(id) on delete cascade,
  part_name text not null,
  brand text,
  supplier_name text,
  quantity numeric(12, 2) not null,
  unit_price numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists purchase_requisition_decisions (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid not null references purchase_requisitions(id) on delete cascade,
  action purchase_requisition_decision_action not null,
  comment text,
  decided_by text not null default 'Responsável',
  decided_at timestamptz not null default now()
);

create index if not exists idx_purchase_requisitions_status
  on purchase_requisitions(status);

create index if not exists idx_purchase_requisition_items_requisition_id
  on purchase_requisition_items(requisition_id);

create index if not exists idx_purchase_requisition_decisions_requisition_id_decided_at
  on purchase_requisition_decisions(requisition_id, decided_at desc);

create or replace function set_purchase_requisition_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_purchase_requisitions_updated_at on purchase_requisitions;
create trigger trg_purchase_requisitions_updated_at
before update on purchase_requisitions
for each row
execute function set_purchase_requisition_updated_at();

create or replace function decide_purchase_requisition(
  p_requisition_id uuid,
  p_action text,
  p_comment text default null,
  p_decided_by text default 'Responsável'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_status purchase_requisition_status;
  v_decision purchase_requisition_decisions;
  v_requisition purchase_requisitions;
begin
  if p_action = 'APROVAR' then
    v_new_status := 'APROVADA';
  elsif p_action = 'REPROVAR' then
    v_new_status := 'REPROVADA';
  elsif p_action = 'SOLICITAR_AJUSTE' then
    v_new_status := 'AJUSTE_SOLICITADO';
  else
    raise exception 'Acao de aprovacao invalida: %', p_action;
  end if;

  if p_action in ('REPROVAR', 'SOLICITAR_AJUSTE')
    and nullif(trim(coalesce(p_comment, '')), '') is null then
    raise exception 'Comentario obrigatorio para reprovar ou solicitar ajuste.';
  end if;

  update purchase_requisitions
     set status = v_new_status
   where id = p_requisition_id
   returning * into v_requisition;

  if not found then
    raise exception 'Requisicao nao encontrada: %', p_requisition_id;
  end if;

  insert into purchase_requisition_decisions (
    requisition_id,
    action,
    comment,
    decided_by,
    decided_at
  )
  values (
    p_requisition_id,
    p_action::purchase_requisition_decision_action,
    nullif(trim(coalesce(p_comment, '')), ''),
    coalesce(nullif(trim(p_decided_by), ''), 'Responsável'),
    now()
  )
  returning * into v_decision;

  return jsonb_build_object(
    'requisition', to_jsonb(v_requisition),
    'decision', to_jsonb(v_decision)
  );
end;
$$;

insert into purchase_requisitions (
  id,
  code,
  requester_name,
  department,
  urgency,
  status,
  justification,
  total_value,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000001',
  'REQ-00001',
  'João Manutenção',
  'Manutenção',
  'URGENTE',
  'AGUARDANDO_APROVACAO',
  'Freios comprometidos no veículo leve 03. Risco de segurança. Escolhido Auto Peças Central por entrega imediata e sem frete.',
  446.00,
  now(),
  now()
)
on conflict (code) do update
set requester_name = excluded.requester_name,
    department = excluded.department,
    urgency = excluded.urgency,
    justification = excluded.justification,
    total_value = excluded.total_value,
    updated_at = purchase_requisitions.updated_at;

insert into purchase_requisition_items (
  id,
  requisition_id,
  part_name,
  brand,
  supplier_name,
  quantity,
  unit_price,
  total_price
)
select
  seed_items.id::uuid,
  seed_requisition.requisition_id,
  seed_items.part_name,
  seed_items.brand,
  seed_items.supplier_name,
  seed_items.quantity,
  seed_items.unit_price,
  seed_items.total_price
from (
  values
  (
    '00000000-0000-0000-0000-000000000101',
    'Pastilha de freio dianteira',
    'Fras-le',
    'Auto Peças Central',
    2,
    195.00,
    390.00
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Fluido de freio DOT4',
    'Bosch',
    'Auto Peças Central',
    2,
    28.00,
    56.00
  )
) as seed_items(id, part_name, brand, supplier_name, quantity, unit_price, total_price)
cross join (
  select id as requisition_id
  from purchase_requisitions
  where code = 'REQ-00001'
) as seed_requisition
on conflict (id) do update
set requisition_id = excluded.requisition_id,
    part_name = excluded.part_name,
    brand = excluded.brand,
    supplier_name = excluded.supplier_name,
    quantity = excluded.quantity,
    unit_price = excluded.unit_price,
    total_price = excluded.total_price;
