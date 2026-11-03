import express from "express"
import { checkRole } from "../middleware/auth.js"
import {
  criarAgendamento,
  listarAgendamentos,
  listarAgendamentosDoCliente,
  atualizarAgendamento,
  deletarAgendamento
} from "../controllers/index.js"

const router = express.Router()

/**
 * Regras:
 * - Admin (proprietária): pode realizar qualquer ação em qualquer agendamento.
 * - Profissional: vê todos, cria para si e altera/exclui só os dela (conferido no controller).
 * - Cliente: pode criar agendamento (POST) e listar os próprios (GET /me).
 */

// Criar agendamento -> clientes autenticados ou equipe
router.post("/", checkRole(["client", "profissional"]), criarAgendamento)

// Listar todos os agendamentos -> equipe
router.get("/", checkRole("profissional"), listarAgendamentos)

// Listar agendamentos do cliente autenticado
router.get("/me", checkRole("client"), async (req, res) => {
  try {
    const agendamentos = await listarAgendamentosDoCliente(req.user.id)
    res.json(agendamentos)
  } catch (err) {
    console.error("Erro ao listar agendamentos do cliente:", err)
    res.status(500).json({ error: "Erro inesperado no servidor" })
  }
})

// Atualizar e deletar -> equipe (funcionária só os dela)
router.put("/:id", checkRole("profissional"), atualizarAgendamento)
router.delete("/:id", checkRole("profissional"), deletarAgendamento)

export default router
