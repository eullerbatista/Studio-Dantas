-- Rode no SQL Editor do Supabase antes de subir o backend com login por senha.

-- 1) Clientes: e-mail (para redefinir a senha), senha e controle de sessão/tentativas
alter table public.clientes add column if not exists email text;
alter table public.clientes add column if not exists senha_hash text;
-- Incrementado ao trocar a senha: derruba as sessões abertas em outros aparelhos
alter table public.clientes add column if not exists sessao_versao integer not null default 0;
alter table public.clientes add column if not exists tentativas_falhas integer not null default 0;
alter table public.clientes add column if not exists bloqueado_ate timestamptz;

update public.clientes set email = nullif(lower(trim(email)), '') where email is not null;

-- Um e-mail por cliente (sem diferenciar maiúsculas).
-- Se falhar por duplicidade, veja quem repete:
-- select lower(email), count(*) from clientes where email is not null group by 1 having count(*) > 1;
create unique index if not exists clientes_email_unico
  on public.clientes (lower(email))
  where email is not null;

-- A tabela agora guarda hash de senha: só o backend (service_role) acessa
alter table public.clientes enable row level security;

-- 2) Links de "esqueci minha senha": guarda só o hash do token, com validade e uso único
create table if not exists public.redefinicoes_senha (
  id bigint generated always as identity primary key,
  cliente_id integer not null references public.clientes (id) on delete cascade,
  token_hash text not null unique,
  expira_em timestamptz not null,
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists redefinicoes_senha_cliente on public.redefinicoes_senha (cliente_id, criado_em desc);

alter table public.redefinicoes_senha enable row level security;
