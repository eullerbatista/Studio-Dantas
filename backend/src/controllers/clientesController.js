import { supabase } from "../config/supabase.js"
import { normalizarTelefone } from "../middleware/auth.js"

// Admin cadastra uma cliente que agendou pessoalmente. Fica sem senha: no primeiro
// login pelo site ela informa o e-mail e cria a senha (needsPasswordSetup)
export async function criarCliente(req, res) {
  const nome = String(req.body?.nome || "").trim()
  const telefone = normalizarTelefone(req.body?.telefone)

  if (nome.length < 2 || nome.length > 100) {
    return res.status(400).json({ error: "Informe o nome da cliente" })
  }
  if (!telefone) {
    return res.status(400).json({ error: "Informe um telefone válido com DDD" })
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert([{ nome, telefone }])
    .select("id, nome, telefone, email")
    .single()

  if (error?.code === "23505") {
    return res.status(409).json({ error: "Este telefone já está cadastrado para outra cliente" })
  }
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
}

export async function listarClientes(req, res) {
  // Nunca "*": a tabela guarda o hash da senha
  const { data, error } = await supabase.from("clientes").select("id, nome, telefone, email")
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// Admin altera nome e/ou telefone; o telefone segue a mesma regra do cadastro
export async function atualizarCliente(req, res) {
  const nome = String(req.body?.nome || "").trim()
  const telefone = normalizarTelefone(req.body?.telefone)

  if (nome.length < 2 || nome.length > 100) {
    return res.status(400).json({ error: "Informe o nome da cliente" })
  }
  if (!telefone) {
    return res.status(400).json({ error: "Informe um telefone válido com DDD" })
  }

  const { data, error } = await supabase
    .from("clientes")
    .update({ nome, telefone })
    .eq("id", req.params.id)
    .select("id, nome, telefone")
    .maybeSingle()

  if (error?.code === "23505") {
    return res.status(409).json({ error: "Este telefone já está cadastrado para outra cliente" })
  }
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
