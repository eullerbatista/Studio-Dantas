import express from "express"
import {
  AuthError,
  getAuthUrl,
  loginAdmin,
  loginClient,
  normalizarEmail,
  normalizarTelefone,
  registerClient,
  requestPasswordReset,
  resetClientPassword,
  setupClientPassword,
  validarSenha,
} from "../middleware/auth.js"

const router = express.Router()

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

function responderErro(res, err, contexto) {
  if (err instanceof AuthError) {
    return res.status(err.status).json({ error: err.message })
  }
  console.error(contexto, err)
  return res.status(500).json({ error: "Erro inesperado no servidor" })
}

/**
 * Login de cliente via telefone e senha
 * Endpoint: POST /api/auth/client/login  { telefone, senha? }
 * Resposta: { token, client } ou { needsRegistration | needsPasswordSetup | needsPassword: true }
 */
router.post("/client/login", async (req, res) => {
  const telefone = normalizarTelefone(req.body?.telefone)
  if (!telefone) {
    return res.status(400).json({ error: "Informe um telefone válido com DDD" })
  }
  const senha = typeof req.body?.senha === "string" ? req.body.senha : ""

  try {
    res.json(await loginClient(telefone, senha))
  } catch (err) {
    responderErro(res, err, "Erro no login do cliente:")
  }
})

/**
 * Cadastro de cliente na primeira vez
 * Endpoint: POST /api/auth/client/register  { telefone, telefoneConfirmacao, nome, email, senha }
 */
router.post("/client/register", async (req, res) => {
  const telefone = normalizarTelefone(req.body?.telefone)
  const confirmacao = normalizarTelefone(req.body?.telefoneConfirmacao)
  const nome = String(req.body?.nome || "").trim()
  const email = normalizarEmail(req.body?.email)
  const erroSenha = validarSenha(req.body?.senha)

  if (!telefone) {
    return res.status(400).json({ error: "Informe um telefone válido com DDD" })
  }
  if (telefone !== confirmacao) {
    return res.status(400).json({ error: "Os telefones informados não conferem" })
  }
  if (nome.length < 2 || nome.length > 100) {
    return res.status(400).json({ error: "Informe seu nome" })
  }
  if (!email) {
    return res.status(400).json({ error: "Informe um e-mail válido" })
  }
  if (erroSenha) {
    return res.status(400).json({ error: erroSenha })
  }

  try {
    res.status(201).json(await registerClient({ telefone, nome, email, senha: req.body.senha }))
  } catch (err) {
    responderErro(res, err, "Erro no cadastro do cliente:")
  }
})

/**
 * Cliente cadastrada antes das senhas cria a sua no primeiro login
 * Endpoint: POST /api/auth/client/setup-password  { telefone, email, senha }
 */
router.post("/client/setup-password", async (req, res) => {
  const telefone = normalizarTelefone(req.body?.telefone)
  const email = normalizarEmail(req.body?.email)
  const erroSenha = validarSenha(req.body?.senha)

  if (!telefone) {
    return res.status(400).json({ error: "Informe um telefone válido com DDD" })
  }
  if (!email) {
    return res.status(400).json({ error: "Informe um e-mail válido" })
  }
  if (erroSenha) {
    return res.status(400).json({ error: erroSenha })
  }

  try {
    res.json(await setupClientPassword({ telefone, email, senha: req.body.senha }))
  } catch (err) {
    responderErro(res, err, "Erro ao criar senha do cliente:")
  }
})

/**
 * Esqueci minha senha: envia o link de redefinição para o e-mail cadastrado
 * Endpoint: POST /api/auth/client/forgot-password  { email }
 * Responde igual exista ou não o e-mail, para não revelar quem é cliente
 */
router.post("/client/forgot-password", async (req, res) => {
  const email = normalizarEmail(req.body?.email)
  if (!email) {
    return res.status(400).json({ error: "Informe um e-mail válido" })
  }

  try {
    await requestPasswordReset(email)
  } catch (err) {
    // Falha no envio não é exposta (revelaria que o e-mail existe)
    console.error("Erro ao enviar redefinição de senha:", err)
  }
  res.json({ message: "Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha." })
})

/**
 * Nova senha pelo link do e-mail
 * Endpoint: POST /api/auth/client/reset-password  { token, senha }
 * Resposta: { token, client } (já entra na conta)
 */
router.post("/client/reset-password", async (req, res) => {
  const erroSenha = validarSenha(req.body?.senha)
  if (!req.body?.token) {
    return res.status(400).json({ error: "Link inválido" })
  }
  if (erroSenha) {
    return res.status(400).json({ error: erroSenha })
  }

  try {
    res.json(await resetClientPassword(req.body.token, req.body.senha))
  } catch (err) {
    responderErro(res, err, "Erro ao redefinir senha do cliente:")
  }
})

/**
 * Login de admin via Google OAuth
 * Endpoint: GET /api/auth/google
 */
router.get("/google", (req, res) => {
  res.redirect(getAuthUrl())
})

/**
 * Callback do Google OAuth (GOOGLE_REDIRECT_URI)
 * Endpoint: GET /api/auth/google/callback
 * Redireciona para o frontend com o token no fragmento da URL
 */
router.get("/google/callback", async (req, res) => {
  const { code, state, error } = req.query

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/admin?erro=${encodeURIComponent("Login cancelado")}`)
  }

  try {
    const token = await loginAdmin(code, state)
    res.redirect(`${FRONTEND_URL}/admin/callback#token=${encodeURIComponent(token)}`)
  } catch (err) {
    if (!(err instanceof AuthError)) console.error("Erro no callback do Google:", err)
    const mensagem = err instanceof AuthError ? err.message : "Erro ao entrar com Google"
    res.redirect(`${FRONTEND_URL}/admin?erro=${encodeURIComponent(mensagem)}`)
  }
})

export default router
