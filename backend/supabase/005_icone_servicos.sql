-- Rode no SQL Editor do Supabase antes de subir o backend novo.
-- Ícone escolhido no painel para cada serviço: chave de um ícone do site,
-- imagem da galeria (data URL, já reduzida pelo painel), 'nenhum' para não
-- mostrar ícone ou null para o site escolher pelo nome.

alter table public.servicos add column if not exists icone text;
