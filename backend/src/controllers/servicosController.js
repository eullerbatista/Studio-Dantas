import { supabase } from "../config/supabase.js"
import { garantirProprietaria } from "../services/profissionais.js"

export const CATEGORIAS = ["maos-e-pes", "cabelos", "olhos-e-sobrancelhas"]

// Ícone do site pela chave, ou imagem da galeria já reduzida pelo painel (data URL, até ~110 KB)
const CHAVE_ICONE = /^[a-z0-9-]{1,40}$/
const IMAGEM_GALERIA = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/
const TAMANHO_MAXIMO_IMAGEM = 150000

function iconeValido(icone) {
  if (CHAVE_ICONE.test(icone)) return true
  return icone.length <= TAMANHO_MAXIMO_IMAGEM && IMAGEM_GALERIA.test(icone)
}

// Valida e normaliza os campos editáveis de um serviço
function lerServico(body = {}) {
  const nome = String(body.nome || "").trim()
  const descricao = String(body.descricao || "").trim() || null
  const categoria = body.categoria
  const duracao_minutos = Number(body.duracao_minutos)
  const preco = body.preco === "" || body.preco == null ? null : Number(body.preco)
  // Chave de um ícone do site, imagem da galeria, "nenhum" ou null (o site escolhe pelo nome do serviço)
  const icone = body.icone === "" || body.icone == null ? null : String(body.icone)

  if (!nome) return { error: "Informe o nome do serviço" }
  if (!CATEGORIAS.includes(categoria)) return { error: "Categoria inválida" }
  if (!Number.isInteger(duracao_minutos) || duracao_minutos < 5 || duracao_minutos > 600) {
    return { error: "Duração deve ser em minutos, entre 5 e 600" }
  }
  if (preco !== null && (!Number.isFinite(preco) || preco < 0)) return { error: "Preço inválido" }
  if (icone !== null && !iconeValido(icone)) return { error: "Ícone inválido ou imagem muito grande" }

  // Opcional: quem realiza o serviço (ids das profissionais)
  const profissionais = Array.isArray(body.profissionais) ? [...new Set(body.profissionais.map(Number))] : null
  if (profissionais?.some(id => !Number.isInteger(id) || id <= 0)) return { error: "Profissionais inválidas" }

  return { servico: { nome, descricao, categoria, duracao_minutos, preco, icone }, profissionais }
}

// Troca quem realiza o serviço pela nova lista
async function salvarProfissionais(servicoId, profissionais) {
  if (!profissionais) return
  const { error: erroApagar } = await supabase.from("profissionais_servicos").delete().eq("servico_id", servicoId)
  if (erroApagar) throw erroApagar
  if (!profissionais.length) return
  const { error } = await supabase
    .from("profissionais_servicos")
    .insert(profissionais.map(profissional_id => ({ profissional_id, servico_id: servicoId })))
  if (error) throw error
}

// "profissionais_servicos" vira só a lista de ids
function comProfissionais({ profissionais_servicos, ...servico }) {
  return { ...servico, profissionais: (profissionais_servicos || []).map(v => v.profissional_id) }
}

export async function criarServico(req, res) {
  const { servico, profissionais, error: erroValidacao } = lerServico(req.body)
  if (erroValidacao) return res.status(400).json({ error: erroValidacao })

  const { data, error } = await supabase
    .from("servicos")
    .insert([{ ...servico, ativo: true }])
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  // Sem escolha, o serviço novo fica com a proprietária
  const quem = profissionais ?? [(await garantirProprietaria()).id]
  await salvarProfissionais(data.id, quem)
  res.status(201).json({ ...data, profissionais: quem })
}

export async function atualizarServico(req, res) {
  const { servico, profissionais, error: erroValidacao } = lerServico(req.body)
  if (erroValidacao) return res.status(400).json({ error: erroValidacao })

  const { data, error } = await supabase
    .from("servicos")
    .update(servico)
    .eq("id", req.params.id)
    .select()
    .maybeSingle()

  if (error) return res.status(400).json({ error: error.message })
  if (!data) return res.status(404).json({ error: "Serviço não encontrado" })
  await salvarProfissionais(data.id, profissionais)
  res.json(profissionais ? { ...data, profissionais } : data)
}

// Lista serviços ativos; aceita ?categoria=maos-e-pes
export async function listarServicos(req, res) {
  let query = supabase.from("servicos").select("*").eq("ativo", true).order("nome")
  if (req.query.categoria) query = query.eq("categoria", req.query.categoria)

  const { data, error } = await query
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// Painel: todos os serviços, ativos primeiro, com quem realiza cada um
export async function listarTodosServicos(req, res) {
  await garantirProprietaria()

  const { data, error } = await supabase
    .from("servicos")
    .select("*, profissionais_servicos(profissional_id)")
    .order("ativo", { ascending: false })
    .order("nome")

  if (error) return res.status(400).json({ error: error.message })
  res.json(data.map(comProfissionais))
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
