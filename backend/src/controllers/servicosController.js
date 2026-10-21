import { supabase } from "../config/supabase.js"

export const CATEGORIAS = ["maos-e-pes", "cabelos", "olhos-e-sobrancelhas"]

// Valida e normaliza os campos editáveis de um serviço
function lerServico(body = {}) {
  const nome = String(body.nome || "").trim()
  const descricao = String(body.descricao || "").trim() || null
  const categoria = body.categoria
  const duracao_minutos = Number(body.duracao_minutos)
  const preco = body.preco === "" || body.preco == null ? null : Number(body.preco)

  if (!nome) return { error: "Informe o nome do serviço" }
  if (!CATEGORIAS.includes(categoria)) return { error: "Categoria inválida" }
  if (!Number.isInteger(duracao_minutos) || duracao_minutos < 5 || duracao_minutos > 600) {
    return { error: "Duração deve ser em minutos, entre 5 e 600" }
  }
  if (preco !== null && (!Number.isFinite(preco) || preco < 0)) return { error: "Preço inválido" }

  return { servico: { nome, descricao, categoria, duracao_minutos, preco } }
}

export async function criarServico(req, res) {
  const { servico, error: erroValidacao } = lerServico(req.body)
  if (erroValidacao) return res.status(400).json({ error: erroValidacao })

  const { data, error } = await supabase
    .from("servicos")
    .insert([{ ...servico, ativo: true }])
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
}

export async function atualizarServico(req, res) {
  const { servico, error: erroValidacao } = lerServico(req.body)
  if (erroValidacao) return res.status(400).json({ error: erroValidacao })

  const { data, error } = await supabase
    .from("servicos")
    .update(servico)
    .eq("id", req.params.id)
    .select()
    .maybeSingle()

  if (error) return res.status(400).json({ error: error.message })
  if (!data) return res.status(404).json({ error: "Serviço não encontrado" })
  res.json(data)
}

// Lista serviços ativos; aceita ?categoria=maos-e-pes
export async function listarServicos(req, res) {
  let query = supabase.from("servicos").select("*").eq("ativo", true).order("nome")
  if (req.query.categoria) query = query.eq("categoria", req.query.categoria)

  const { data, error } = await query
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// Painel da admin: todos os serviços, ativos primeiro
export async function listarTodosServicos(req, res) {
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .order("ativo", { ascending: false })
    .order("nome")

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

async function definirAtivo(req, res, ativo) {
  const { data, error } = await supabase
    .from("servicos")
    .update({ ativo })
    .eq("id", req.params.id)
    .select()
    .maybeSingle()

  if (error) return res.status(400).json({ error: error.message })
  if (!data) return res.status(404).json({ error: "Serviço não encontrado" })
  res.json(data)
}

// Desativa em vez de apagar, para não quebrar agendamentos antigos
export async function desativarServico(req, res) {
  return definirAtivo(req, res, false)
}

export async function reativarServico(req, res) {
  return definirAtivo(req, res, true)
}
