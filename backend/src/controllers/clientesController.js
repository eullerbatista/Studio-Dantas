import { supabase } from "../config/supabase.js"
import { gerarHashSenha, normalizarEmail, normalizarTelefone, validarSenha } from "../middleware/auth.js"

const COLUNAS = "id, nome, telefone, email"

/**
 * Valida o que a proprietária preencheu. E-mail e senha são opcionais: ela pode
 * cadastrá-los para quem tem dificuldade com o site (vazio = sem e-mail / manter a senha).
 */
async function lerDadosCliente(body) {
  const nome = String(body?.nome || "").trim()
  const telefone = normalizarTelefone(body?.telefone)
  const emailDigitado = String(body?.email || "").trim()
  const email = emailDigitado ? normalizarEmail(emailDigitado) : null
  const senha = body?.senha || ""

  if (nome.length < 2 || nome.length > 100) return { erro: "Informe o nome da cliente" }
  if (!telefone) return { erro: "Informe um telefone válido com DDD" }
  if (emailDigitado && !email) return { erro: "Informe um e-mail válido" }
  if (senha && validarSenha(senha)) return { erro: validarSenha(senha) }

  const campos = { nome, telefone, email }
  if (senha) campos.senha_hash = await gerarHashSenha(senha)
  return { campos }
}

function erroDeDuplicado(error) {
  return error.message?.includes("email")
    ? "Este e-mail já está cadastrado para outra cliente"
    : "Este telefone já está cadastrado para outra cliente"
}

// Admin cadastra uma cliente que agendou pessoalmente. Sem senha, no primeiro
// login pelo site ela informa o e-mail e cria a senha (needsPasswordSetup)
export async function criarCliente(req, res) {
  const { campos, erro } = await lerDadosCliente(req.body)
  if (erro) return res.status(400).json({ error: erro })

  const { data, error } = await supabase
    .from("clientes")
    .insert([campos])
    .select(COLUNAS)
    .single()

  if (error?.code === "23505") return res.status(409).json({ error: erroDeDuplicado(error) })
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
}

export async function listarClientes(req, res) {
  // Nunca "*": a tabela guarda o hash da senha
  const { data, error } = await supabase.from("clientes").select(COLUNAS)
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// Admin altera nome, telefone, e-mail e, se preencher, a senha
export async function atualizarCliente(req, res) {
  const { campos, erro } = await lerDadosCliente(req.body)
  if (erro) return res.status(400).json({ error: erro })

  if (campos.senha_hash) {
    const { data: atual, error: fetchError } = await supabase
      .from("clientes")
      .select("sessao_versao")
      .eq("id", req.params.id)
      .maybeSingle()

    if (fetchError) return res.status(400).json({ error: fetchError.message })
    if (!atual) return res.status(404).json({ error: "Cliente não encontrada" })
    // Senha nova derruba as sessões abertas e desfaz um bloqueio por tentativas
    Object.assign(campos, { sessao_versao: atual.sessao_versao + 1, tentativas_falhas: 0, bloqueado_ate: null })
  }

  const { data, error } = await supabase
    .from("clientes")
    .update(campos)
    .eq("id", req.params.id)
    .select(COLUNAS)
    .maybeSingle()

  if (error?.code === "23505") return res.status(409).json({ error: erroDeDuplicado(error) })
  if (error) return res.status(400).json({ error: error.message })
  if (!data) return res.status(404).json({ error: "Cliente não encontrada" })
  res.json(data)
}

export async function deletarCliente(req, res) {
  const { id } = req.params
  const { data, error } = await supabase.from("clientes").delete().eq("id", id)

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}
