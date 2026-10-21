-- Opcional: cadastra os serviços que estavam fixos no frontend.
-- Ajuste duracao_minutos e preco antes de rodar.
insert into public.servicos (nome, descricao, categoria, duracao_minutos, preco, ativo)
select v.nome, v.descricao, v.categoria, v.duracao_minutos, v.preco, true
from (values
  ('Manicure Tradicional', 'Cuidado completo para unhas das mãos.', 'maos-e-pes', 60, null::real),
  ('Pedicure Tradicional', 'Tratamento estético e saúde dos pés.', 'maos-e-pes', 60, null),
  ('Spa dos Pés', 'Hidratação profunda e relaxamento.', 'maos-e-pes', 60, null),
  ('Alongamento de Unhas', 'Aplicação de técnicas modernas para alongar unhas.', 'maos-e-pes', 60, null),
  ('Esmaltação em Gel', 'Durabilidade e brilho intenso para suas unhas.', 'maos-e-pes', 60, null),
  ('Escova', 'Finalização com escova modeladora.', 'cabelos', 60, null),
  ('Corte de cabelo', 'Corte moderno e estilizado.', 'cabelos', 60, null),
  ('Tintura', 'Coloração e técnicas de tintura.', 'cabelos', 60, null),
  ('Progressiva', 'Alisamento duradouro com progressiva.', 'cabelos', 60, null),
  ('Selante', 'Tratamento para selar e proteger os fios.', 'cabelos', 60, null),
  ('Design de Sobrancelhas', 'Modelagem personalizada para realçar o olhar.', 'olhos-e-sobrancelhas', 60, null),
  ('Henna', 'Coloração natural para sobrancelhas.', 'olhos-e-sobrancelhas', 60, null),
  ('Extensão de Cílios', 'Alongamento e volume para cílios perfeitos.', 'olhos-e-sobrancelhas', 60, null)
) as v(nome, descricao, categoria, duracao_minutos, preco)
where not exists (select 1 from public.servicos s where s.nome = v.nome);
