-- Rode no SQL Editor do Supabase antes de subir o backend novo.
-- Guarda no agendamento o valor cobrado, para que mudanças futuras no preço
-- do serviço não alterem os relatórios de meses anteriores.

alter table public.agendamentos add column if not exists valor numeric(10, 2);

-- Agendamentos já existentes ficam com o preço atual do serviço
update public.agendamentos a
  set valor = s.preco
  from public.servicos s
  where s.id = a.servico_id
    and a.valor is null;
