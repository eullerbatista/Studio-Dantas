import { supabase } from "../config/supabase.js"
import { normalizarEmail } from "../middleware/auth.js"
import { emailDaProprietaria, esquecerProprietariaEmCache, garantirProprietaria } from "../services/profissionais.js"

// Valida o que a proprietária preencheu: nome, e-mail Google e serviços que ela realiza
function lerProfissional(body = {}) {
  const nome = String(body.nome || "").trim()
  const email = normalizarEmail(body.email)
  const servicos = Array.isArray(body.servicos) ? [...new Set(body.servicos.map(Number))] : null

  if (nome.length < 2 || nome.length > 100) return { error: "Informe o nome da profissional" }
  if (!email) return { error: "Informe o e-mail Google da profissional" }
  if (!servicos || servicos.some(id => !Number.isInteger(id) || id <= 0)) return { error: "Serviços inválidos" }

  return { profissional: { nome, email }, servicos }
}

// Troca a lista de serviços da profissional pela nova
async function salvarServicos(profissionalId, servicos) {
  const { error: erroApagar } = await supabase
    .from("profissionais_servicos")
    .delete()
    .eq("profissional_id", profissionalId)
  if (erroApagar) throw erroApagar

  if (!servicos.length) return
  const { error } = await supabase
    .from("profissionais_servicos")
    .insert(servicos.map(servico_id => ({ profissional_id: profissionalId, servico_id })))
  if (error) throw error
}

async function buscarPorEmail(email) {
  const { data, error } = await supabase
    .from("profissionais")
    .select("id, ativo, proprietaria")
    .ilike("email", email)
    .limit(1)
  if (error) throw error
  return data[0] || null
}

// Página de agendamento: profissionais que realizam o serviço (só id e nome)
export async function listarProfissionaisDoServico(req, res) {
  await garantirProprietaria()

  const { servico_id } = req.query
  let query = supabase
    .from("profissionais")
    .select("id, nome, proprietaria, profissionais_servicos!inner(servico_id)")
    .eq("ativo", true)
    .order("proprietaria", { ascending: false })
    .order("nome")
  if (servico_id) query = query.eq("profissionais_servicos.servico_id", servico_id)

  const { data, error } = await query
  if (error) return res.status(400).json({ error: error.message })
  res.json(data.map(p => ({ id: p.id, nome: p.nome })))
}

// Painel: equipe com os serviços de cada uma e se a Agenda Google já está conectada
export async function listarEquipe(req, res) {
  await garantirProprietaria()

  const { data, error } = await supabase
    .from("profissionais")
    .select("id, nome, email, proprietaria, google_refresh_token, profissionais_servicos(servico_id)")
    .eq("ativo", true)
    .order("proprietaria", { ascending: false })
    .order("nome")

  if (error) return res.status(400).json({ error: error.message })
  const admin = req.user.role === "admin"
  res.json(data.map(p => ({
    id: p.id,
    nome: p.nome,
    // E-mail só para a proprietária, que administra a equipe
    email: admin ? p.email : undefined,
    proprietaria: p.proprietaria,
    agenda_conectada: p.proprietaria || !!p.google_refresh_token,
    servicos: p.profissionais_servicos.map(v => v.servico_id),
  })))
}

// Proprietária adiciona uma funcionária (quem já foi removida volta com o mesmo cadastro)
export async function criarProfissional(req, res) {
  const { profissional, servicos, error: erroValidacao } = lerProfissional(req.body)
  if (erroValidacao) return res.status(400).json({ error: erroValidacao })
  if (profissional.email === emailDaProprietaria()) {
    return res.status(400).json({ error: "Este é o e-mail da proprietária" })
  }

  const existente = await buscarPorEmail(profissional.email)
  if (existente?.ativo) return res.status(409).json({ error: "Já existe uma profissional com este e-mail" })

  const { data, error } = existente
    ? await supabase
      .from("profissionais")
      .update({ ...profissional, ativo: true, google_refresh_token: null })
      .eq("id", existente.id)
      .select("id")
      .single()
    : await supabase.from("profissionais").insert([profissional]).select("id").single()

  if (error?.code === "23505") return res.status(409).json({ error: "Já existe uma profissional com este e-mail" })
  if (error) return res.status(400).json({ error: error.message })

  await salvarServicos(data.id, servicos)
  res.status(201).json({ id: data.id })
}

// Nome, e-mail e serviços; o e-mail da proprietária vem do servidor (ADMIN_EMAIL)
export async function atualizarProfissional(req, res) {
  const { data: atual, error: erroBusca } = await supabase
    .from("profissionais")
    .select("id, email, proprietaria")
    .eq("id", req.params.id)
    .eq("ativo", true)
    .maybeSingle()
  if (erroBusca) throw erroBusca
  if (!atual) return res.status(404).json({ error: "Profissional não encontrada" })

  const corpo = atual.proprietaria ? { ...req.body, email: atual.email } : req.body
  const { profissional, servicos, error: erroValidacao } = lerProfissional(corpo)
  if (erroValidacao) return res.status(400).json({ error: erroValidacao })

  const trocouEmail = profissional.email !== atual.email.toLowerCase()
  if (trocouEmail) {
    if (profissional.email === emailDaProprietaria()) {
      return res.status(400).json({ error: "Este é o e-mail da proprietária" })
    }
    const outra = await buscarPorEmail(profissional.email)
    if (outra && outra.id !== atual.id) {
      return res.status(409).json({ error: "Já existe uma profissional com este e-mail" })
    }
  }

  // Outra conta Google: a agenda conectada era da conta antiga
  const campos = trocouEmail ? { ...profissional, google_refresh_token: null } : profissional
  const { error } = await supabase.from("profissionais").update(campos).eq("id", atual.id)
  if (error?.code === "23505") return res.status(409).json({ error: "Já existe uma profissional com este e-mail" })
  if (error) return res.status(400).json({ error: error.message })

  await salvarServicos(atual.id, servicos)
  if (atual.proprietaria) esquecerProprietariaEmCache()
  res.json({ id: atual.id })
}

// Remove da equipe sem apagar o histórico; antes, os agendamentos futuros dela precisam ser resolvidos
export async function removerProfissional(req, res) {
  const { data: profissional, error: erroBusca } = await supabase
    .from("profissionais")
    .select("id, nome, proprietaria")
    .eq("id", req.params.id)
    .eq("ativo", true)
    .maybeSingle()
  if (erroBusca) throw erroBusca
  if (!profissional) return res.status(404).json({ error: "Profissional não encontrada" })
  if (profissional.proprietaria) return res.status(400).json({ error: "A proprietária não pode ser removida" })

  const { count, error: erroFuturos } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("profissional_id", profissional.id)
    .gte("data_hora", new Date().toISOString())
    .or("status.is.null,status.neq.cancelado")
  if (erroFuturos) throw erroFuturos
  if (count) {
    return res.status(409).json({
      error: `${profissional.nome} tem ${count} agendamento(s) futuro(s). Passe para outra profissional ou cancele antes de remover.`,
    })
  }

  const { error } = await supabase
    .from("profissionais")
    .update({ ativo: false, google_refresh_token: null })
    .eq("id", profissional.id)
  if (error) return res.status(400).json({ error: error.message })

  await salvarServicos(profissional.id, [])
  res.json({ id: profissional.id })
}
