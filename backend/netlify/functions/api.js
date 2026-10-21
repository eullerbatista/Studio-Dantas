// Função do Netlify: atende todas as rotas /api/* com a mesma API do servidor local
import serverless from "serverless-http"
import app from "../../src/api.js"
import { loadStoredRefreshToken } from "../../src/googleCalendar.js"

// O serverless-http entrega req.body como Buffer, e o express.json() (Express 5)
// não processa um corpo que já existe: convertemos o JSON aqui
function lerCorpoJson(req) {
  if (!Buffer.isBuffer(req.body)) return
  const texto = req.body.toString("utf8")
  req.body = undefined
  if (!texto || !/json/i.test(req.headers["content-type"] || "")) return
  try {
    req.body = JSON.parse(texto)
  } catch {
    // JSON inválido: a rota responde 400 como faria sem corpo
  }
}

const servidor = serverless(app, { request: lerCorpoJson })

// Carrega a autorização da agenda uma vez por instância da função
const pronto = loadStoredRefreshToken()

export async function handler(event, context) {
  await pronto

  // Pelo redirecionamento do netlify.toml a rota pode chegar como /.netlify/functions/api/...
  if (event.path?.startsWith("/.netlify/functions/api")) {
    event.path = event.path.replace("/.netlify/functions/api", "/api")
  }

  return servidor(event, context)
}
