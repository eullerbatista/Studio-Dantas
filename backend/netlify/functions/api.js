// Função do Netlify: atende todas as rotas /api/* com a mesma API do servidor local
import serverless from "serverless-http"
import app from "../../src/api.js"
import { loadStoredRefreshToken } from "../../src/googleCalendar.js"

const servidor = serverless(app)

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
