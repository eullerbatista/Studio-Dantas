import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import jwt from "jsonwebtoken"
import { supabase } from "../config/supabase.js"
import { enviarLinkRedefinicao } from "../email.js"
import { createOAuthClient, setCalendarRefreshToken } from "../googleCalendar.js"

const scrypt = promisify(scryptCallback)

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.send", // e-mail de "esqueci minha senha"
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

const CLIENTE_SESSAO = "60d" // sessão fica salva no aparelho; trocar a senha derruba as demais
const MAX_TENTATIVAS = 5
const BLOQUEIO_MINUTOS = 15
const REDEFINICAO_MINUTOS = 60
const REDEFINICAO_INTERVALO_MINUTOS = 2 // evita disparar vários e-mails seguidos

const COLUNAS_CLIENTE = "id, nome, telefone, email, senha_hash, sessao_versao, tentativas_falhas, bloqueado_ate"
const LINK_INVALIDO = "Link inválido ou expirado. Peça um novo em \"Esqueci minha senha\"."

export function normalizarEmail(email) {
  const valor = String(email || "").trim().toLowerCase()
  if (valor.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) return null
  return valor
}

// Retorna a mensagem de erro, ou null se a senha for aceitável
export function validarSenha(senha) {
  if (typeof senha !== "string" || senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres"
  if (senha.length > 128) return "A senha pode ter no máximo 128 caracteres"
  return null
}

// Hash no formato "scrypt$salt$hash" (scrypt já vem no Node, sem dependência nativa)
export async function gerarHashSenha(senha) {
  const salt = randomBytes(16)
  const hash = await scrypt(senha.normalize("NFKC"), salt, 64)
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`
}

async function conferirSenha(senha, armazenado) {
  const [algoritmo, salt, hash] = String(armazenado || "").split("$")
  if (algoritmo !== "scrypt" || !salt || !hash) return false
  const esperado = Buffer.from(hash, "base64")
  const calculado = await scrypt(String(senha).normalize("NFKC"), Buffer.from(salt, "base64"), esperado.length)
  return timingSafeEqual(calculado, esperado)
}

function hashDoToken(token) {
  return createHash("sha256").update(token).digest("hex")
}

function tokenDoCliente(cliente) {
  const payload = { id: cliente.id, telefone: cliente.telefone, role: "client", v: cliente.sessao_versao }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: CLIENTE_SESSAO })
}

function sessaoDoCliente(cliente) {
  return {
    token: tokenDoCliente(cliente),
    client: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone },
  }
}

async function buscarClientePor(coluna, valor) {
  const consulta = supabase.from("clientes").select(COLUNAS_CLIENTE)
  const filtrada = coluna === "email" ? consulta.ilike("email", valor) : consulta.eq(coluna, valor)
  const { data, error } = await filtrada.limit(1)

  if (error) throw error
  return data[0] || null
}

async function salvarCliente(id, campos) {
  const { data, error } = await supabase
    .from("clientes")
    .update(campos)
    .eq("id", id)
    .select(COLUNAS_CLIENTE)
    .single()

  if (error?.code === "23505") throw new AuthError("Este e-mail já está cadastrado em outra conta", 409)
  if (error) throw error
  return data
}

async function garantirEmailLivre(email, idAtual = null) {
  const outra = await buscarClientePor("email", email)
  if (outra && outra.id !== idAtual) {
    throw new AuthError("Este e-mail já está cadastrado em outra conta", 409)
  }
}

/**
 * Login de cliente em duas etapas:
 * - só telefone: diz o que falta (cadastro, criar senha ou digitar a senha)
 * - telefone + senha: confere e devolve a sessão
 */
export async function loginClient(telefone, senha) {
  const cliente = await buscarClientePor("telefone", telefone)
  if (!cliente) return { needsRegistration: true }
  if (!cliente.senha_hash) return { needsPasswordSetup: true }
  if (!senha) return { needsPassword: true }

  const bloqueadoAte = cliente.bloqueado_ate ? new Date(cliente.bloqueado_ate) : null
  if (bloqueadoAte && bloqueadoAte > new Date()) {
    const minutos = Math.ceil((bloqueadoAte - Date.now()) / 60000)
    throw new AuthError(`Muitas tentativas. Tente novamente em ${minutos} min ou redefina sua senha.`, 429)
  }

  if (!(await conferirSenha(senha, cliente.senha_hash))) {
    const tentativas = cliente.tentativas_falhas + 1
    await salvarCliente(cliente.id, tentativas >= MAX_TENTATIVAS
      ? { tentativas_falhas: 0, bloqueado_ate: new Date(Date.now() + BLOQUEIO_MINUTOS * 60000).toISOString() }
      : { tentativas_falhas: tentativas })
    throw new AuthError("Telefone ou senha incorretos", 400)
  }

  if (cliente.tentativas_falhas || cliente.bloqueado_ate) {
    await salvarCliente(cliente.id, { tentativas_falhas: 0, bloqueado_ate: null })
  }
  return sessaoDoCliente(cliente)
}

// Cadastro de cliente na primeira vez (telefone já confirmado e normalizado)
export async function registerClient({ telefone, nome, email, senha }) {
  if (await buscarClientePor("telefone", telefone)) {
    throw new AuthError("Telefone já cadastrado", 409)
  }
  await garantirEmailLivre(email)

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert([{ telefone, nome, email, senha_hash: await gerarHashSenha(senha) }])
    .select(COLUNAS_CLIENTE)
    .single()

  if (error?.code === "23505") throw new AuthError("Telefone ou e-mail já cadastrado", 409)
  if (error) throw error

  return sessaoDoCliente(cliente)
}

// Cliente cadastrada antes das senhas: informa o e-mail e cria a senha no primeiro login
export async function setupClientPassword({ telefone, email, senha }) {
  const cliente = await buscarClientePor("telefone", telefone)
  if (!cliente) throw new AuthError("Telefone não cadastrado", 404)
  if (cliente.senha_hash) {
    throw new AuthError("Esta conta já tem senha. Entre com ela ou use \"Esqueci minha senha\".", 409)
  }
  await garantirEmailLivre(email, cliente.id)

  const atualizada = await salvarCliente(cliente.id, {
    email,
    senha_hash: await gerarHashSenha(senha),
    sessao_versao: cliente.sessao_versao + 1,
  })
  return sessaoDoCliente(atualizada)
}

/**
 * "Esqueci minha senha": se o e-mail for de uma cliente, envia o link de redefinição.
 * Não revela se o e-mail existe (a rota responde igual nos dois casos).
 */
export async function requestPasswordReset(email) {
  const cliente = await buscarClientePor("email", email)
  if (!cliente) return

  const { data: recentes, error: erroRecentes } = await supabase
    .from("redefinicoes_senha")
    .select("id")
    .eq("cliente_id", cliente.id)
    .gt("criado_em", new Date(Date.now() - REDEFINICAO_INTERVALO_MINUTOS * 60000).toISOString())
    .limit(1)
  if (erroRecentes) throw erroRecentes
  if (recentes.length) return

  const token = randomBytes(32).toString("base64url")
  const { error } = await supabase.from("redefinicoes_senha").insert([{
    cliente_id: cliente.id,
    token_hash: hashDoToken(token),
    expira_em: new Date(Date.now() + REDEFINICAO_MINUTOS * 60000).toISOString(),
  }])
  if (error) throw error

  const frontend = process.env.FRONTEND_URL || "http://localhost:5173"
  await enviarLinkRedefinicao({
    para: cliente.email,
    nome: cliente.nome,
    link: `${frontend}/redefinir-senha?token=${token}`,
  })
}

// Troca a senha pelo link do e-mail, derruba as sessões antigas e já entra
export async function resetClientPassword(token, senha) {
  const { data, error } = await supabase
    .from("redefinicoes_senha")
    .select("id, cliente_id, expira_em, usado_em")
    .eq("token_hash", hashDoToken(String(token || "")))
    .limit(1)
  if (error) throw error

  const pedido = data[0]
  if (!pedido || pedido.usado_em || new Date(pedido.expira_em) < new Date()) {
    throw new AuthError(LINK_INVALIDO, 400)
  }

  // Invalida todos os links pendentes da cliente; se este já tinha sido usado
  // por outra requisição ao mesmo tempo, ele não volta na lista
  const { data: marcados, error: erroUso } = await supabase
    .from("redefinicoes_senha")
    .update({ usado_em: new Date().toISOString() })
    .eq("cliente_id", pedido.cliente_id)
    .is("usado_em", null)
    .select("id")
  if (erroUso) throw erroUso
  if (!marcados.some(m => m.id === pedido.id)) throw new AuthError(LINK_INVALIDO, 400)

  const cliente = await buscarClientePor("id", pedido.cliente_id)
  if (!cliente) throw new AuthError(LINK_INVALIDO, 400)

  const atualizada = await salvarCliente(cliente.id, {
    senha_hash: await gerarHashSenha(senha),
    sessao_versao: cliente.sessao_versao + 1,
    tentativas_falhas: 0,
    bloqueado_ate: null,
  })
  return sessaoDoCliente(atualizada)
}

function lerToken(req) {
  const [tipo, token] = (req.headers.authorization || "").split(" ")
  if (tipo !== "Bearer" || !token) return null
  return jwt.verify(token, process.env.JWT_SECRET)
}

// Sessão de cliente só vale se a senha não foi trocada depois do login
async function sessaoDeClienteValida(decoded) {
  const { data, error } = await supabase
    .from("clientes")
    .select("sessao_versao")
    .eq("id", decoded.id)
    .limit(1)

  if (error) throw error
  return !!data[0] && data[0].sessao_versao === decoded.v
}

// Middleware para verificar role específico (admin sempre tem acesso)
export function checkRole(role) {
  return async (req, res, next) => {
    let decoded
    try {
      decoded = lerToken(req)
    } catch {
      return res.status(401).json({ error: "Token inválido" })
    }
    if (!decoded) {
      return res.status(401).json({ error: "Token não fornecido" })
    }

    if (decoded.role === "client" && !(await sessaoDeClienteValida(decoded))) {
      return res.status(401).json({ error: "Sessão expirada. Entre novamente." })
    }

    if (decoded.role === "admin" || decoded.role === role) {
      req.user = decoded
      return next()
    }

    return res.status(403).json({ error: "Acesso negado" })
  }
}
