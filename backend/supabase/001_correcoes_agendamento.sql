-- Rode no SQL Editor do Supabase antes de subir o backend novo.
-- Escrito para o schema atual (ids integer, admins.google_tokens jsonb, clientes.telefone UNIQUE).

-- 1) Admins: o backend salva { refresh_token } em admins.google_tokens.
--    Sem policies, só o backend (service_role) consegue ler essa tabela:
alter table public.admins enable row level security;

-- 2) Agendamentos: data/hora com fuso
-- Dados antigos foram gravados como horário local de São Paulo
alter table public.agendamentos
  alter column data_hora type timestamptz using data_hora at time zone 'America/Sao_Paulo';

alter table public.agendamentos alter column status set default 'confirmado';

-- Impede dois agendamentos ativos começando no mesmo horário
create unique index if not exists agendamentos_horario_unico
  on public.agendamentos (data_hora)
  where status is distinct from 'cancelado';

-- 3) Clientes: telefone normalizado (só dígitos com 55); a constraint UNIQUE já existe.
-- Se falhar por duplicidade, junte os clientes antes:
-- select regexp_replace(telefone, '\D', '', 'g'), count(*) from clientes group by 1 having count(*) > 1;
update public.clientes
  set telefone = case
    when length(regexp_replace(telefone, '\D', '', 'g')) in (10, 11)
      then '55' || regexp_replace(telefone, '\D', '', 'g')
    else regexp_replace(telefone, '\D', '', 'g')
  end
  where telefone is not null;

-- 4) Serviços: colunas usadas pelo site
alter table public.servicos add column if not exists categoria text;
alter table public.servicos add column if not exists descricao text;
alter table public.servicos add column if not exists ativo boolean not null default true;
