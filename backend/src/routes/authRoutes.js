import express from "express"
import {
  AuthError,
  getAuthUrl,
  loginAdmin,
  loginClient,
  normalizarTelefone,
  registerClient,
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
 * Login de cliente via telefone
 * Endpoint: POST /api/auth/client/login  { telefone }
 * Resposta: { token, client } ou { needsRegistration: true }
 */
router.post("/client/login", async (req, res) => {
  const telefone = normalizarTelefone(req.body?.telefone)
  if (!telefone) {
    return res.status(400).json({ error: "Informe um telefone válido com DDD" })
  }

  try {
    res.json(await loginClient(telefone))
  } catch (err) {
    responderErro(res, err, "Erro no login do cliente:")
  }
})

/**
 * Cadastro de cliente na primeira vez
 * Endpoint: POST /api/auth/client/register  { telefone, telefoneConfirmacao, nome }
 */
router.post("/client/register", async (req, res) => {
  const telefone = normalizarTelefone(req.body?.telefone)
  const confirmacao = normalizarTelefone(req.body?.telefoneConfirmacao)
  const nome = String(req.body?.nome || "").trim()

  if (!telefone) {
    return res.status(400).json({ error: "Informe um telefone válido com DDD" })
  }
  if (telefone !== confirmacao) {
    return res.status(400).json({ error: "Os telefones informados não conferem" })
  }
  if (nome.length < 2 || nome.length > 100) {
    return res.status(400).json({ error: "Informe seu nome" })
  }

  try {
    res.status(201).json(await registerClient(telefone, nome))
  } catch (err) {
    responderErro(res, err, "Erro no cadastro do cliente:")
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
