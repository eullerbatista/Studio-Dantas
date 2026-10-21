import jwt from "jsonwebtoken"
import { supabase } from "../config/supabase.js"
import { createOAuthClient, setCalendarRefreshToken } from "../googleCalendar.js"

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar",
]

function adminEmail() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
}

// Gera URL de login do Google (apenas para admin)
export function getAuthUrl() {
  // "state" assinado protege o callback contra requisições forjadas
  const state = jwt.sign({ purpose: "google-oauth" }, process.env.JWT_SECRET, { expiresIn: "10m" })

  return createOAuthClient().generateAuthUrl({
    access_type: "offline", // garante refresh_token
    prompt: "consent",      // força o Google a enviar refresh_token
    scope: GOOGLE_SCOPES,
    login_hint: adminEmail() || undefined,
    state,
  })
}

export class AuthError extends Error {
  constructor(message, status = 403) {
    super(message)
    this.status = status
  }
}

// Guarda apenas o refresh token (o access token expira em 1h e é renovado sozinho)
async function salvarRefreshToken(refreshToken) {
  const google_tokens = { refresh_token: refreshToken }

  const { data: existentes, error: selectError } = await supabase
    .from("admins")
    .select("id")
    .ilike("email", adminEmail())
    .limit(1)

  const { error } = selectError
    ? { error: selectError }
    : existentes.length
      ? await supabase.from("admins").update({ google_tokens }).eq("id", existentes[0].id)
      : await supabase.from("admins").insert([{ email: adminEmail(), google_tokens }])

  if (error) console.error("Erro ao salvar refresh token da admin:", error.message)
}

/**
 * Troca o código do Google por tokens, confirma que quem entrou é a proprietária
 * (ADMIN_EMAIL) e devolve o JWT de admin.
 */
export async function loginAdmin(code, state) {
  try {
    const decoded = jwt.verify(state || "", process.env.JWT_SECRET)
    if (decoded.purpose !== "google-oauth") throw new Error()
  } catch {
    throw new AuthError("Sessão de login inválida ou expirada. Tente novamente.", 400)
  }

  if (!adminEmail()) {
    throw new AuthError("ADMIN_EMAIL não configurado no servidor", 500)
  }

  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  const { email, email_verified } = ticket.getPayload()

  if (!email_verified || email.toLowerCase() !== adminEmail()) {
    throw new AuthError("Esta conta Google não tem acesso ao painel")
  }

  if (tokens.refresh_token) {
    setCalendarRefreshToken(tokens.refresh_token)

    await salvarRefreshToken(tokens.refresh_token)
  }

  return jwt.sign({ role: "admin", email: adminEmail() }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

/**
 * Normaliza telefone para apenas dígitos com DDI 55.
 * Ex.: "(14) 99999-9999" -> "5514999999999". Retorna null se inválido.
 */
export function normalizarTelefone(telefone) {
  let digitos = String(telefone || "").replace(/\D/g, "")
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`
  if (!/^55\d{10,11}$/.test(digitos)) return null
  return digitos
}

function tokenDoCliente(cliente) {
  const payload = { id: cliente.id, telefone: cliente.telefone, role: "client" }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" })
}

function dadosPublicosDoCliente(cliente) {
  return { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }
}

async function buscarClientePorTelefone(telefone) {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, telefone")
    .eq("telefone", telefone)
    .limit(1)

  if (error) throw error
  return data[0] || null
}

// Login de cliente: se o telefone já existe, entra; senão pede cadastro
export async function loginClient(telefone) {
  const cliente = await buscarClientePorTelefone(telefone)
  if (!cliente) return { needsRegistration: true }
  return { token: tokenDoCliente(cliente), client: dadosPublicosDoCliente(cliente) }
}

// Cadastro de cliente na primeira vez (telefone já confirmado e normalizado)
export async function registerClient(telefone, nome) {
  if (await buscarClientePorTelefone(telefone)) {
    throw new AuthError("Telefone já cadastrado", 409)
  }

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert([{ telefone, nome }])
    .select("id, nome, telefone")
    .single()

  if (error?.code === "23505") throw new AuthError("Telefone já cadastrado", 409)
  if (error) throw error

  return { token: tokenDoCliente(cliente), client: dadosPublicosDoCliente(cliente) }
}

function lerToken(req) {
  const [tipo, token] = (req.headers.authorization || "").split(" ")
  if (tipo !== "Bearer" || !token) return null
  return jwt.verify(token, process.env.JWT_SECRET)
}

// Middleware para verificar role específico (admin sempre tem acesso)
export function checkRole(role) {
  return (req, res, next) => {
    let decoded
    try {
      decoded = lerToken(req)
    } catch {
      return res.status(401).json({ error: "Token inválido" })
    }
    if (!decoded) {
      return res.status(401).json({ error: "Token não fornecido" })
    }

    if (decoded.role === "admin" || decoded.role === role) {
      req.user = decoded
      return next()
    }

    return res.status(403).json({ error: "Acesso negado" })
  }
}
