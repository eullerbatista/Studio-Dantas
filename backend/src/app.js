import "./loadEnv.js"
import express from "express"
import cors from "cors"

import availabilityRoutes from "./routes/availability.js"
import { checkRole } from "./middleware/auth.js"
import agendamentosRouter from "./routes/agendamentos.js"
import authRouter from "./routes/authRoutes.js"
import clientesRouter from "./routes/clientes.js"
import eventsRouter from "./routes/events.js"
import servicosRouter from "./routes/servicos.js"
import syncRouter from "./routes/sync.js"
import { loadStoredRefreshToken } from "./googleCalendar.js"

const app = express()

// Middlewares globais primeiro
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }))
app.use(express.json())

// Rotas de autenticação
app.use("/api/auth", authRouter)

// Rotas Calendar
app.use("/api/calendar/availability", availabilityRoutes)
app.use("/api/calendar/sync", syncRouter)
app.use("/api/calendar/events", eventsRouter)

// Rotas de agendamento, serviços e clientes
app.use("/api/agendamentos", agendamentosRouter)
app.use("/api/servicos", servicosRouter)
app.use("/api/clientes", clientesRouter)

// Rotas admin
app.get("/api/admin/dashboard", checkRole("admin"), (req, res) => {
  res.json({ message: "Bem-vinda ao painel da administradora!", user: req.user })
})

app.get("/api/admin/relatorios", checkRole("admin"), async (req, res) => {
  try {
    const relatorio = {
      totalAgendamentos: 120,
      totalClientes: 45,
      servicosMaisPopulares: [
        { nome: "Extensão de cílios", quantidade: 60 },
        { nome: "Manicure", quantidade: 40 },
        { nome: "Sobrancelha", quantidade: 20 },
      ],
    }
    res.json(relatorio)
  } catch (err) {
    console.error("Erro ao gerar relatório:", err)
    res.status(500).json({ error: "Erro ao gerar relatório" })
  }
})

// Erros não tratados nas rotas (Express 5 repassa os erros de funções async)
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err)
  res.status(500).json({ error: "Erro inesperado no servidor" })
})

await loadStoredRefreshToken()

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
