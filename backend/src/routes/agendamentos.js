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
 * - Admin: pode realizar qualquer ação (POST, GET, PUT, DELETE).
 * - Cliente: pode criar agendamento (POST) e listar os próprios (GET /me).
 */

// Criar agendamento -> clientes autenticados OU admin
router.post("/", checkRole("client"), criarAgendamento)

// Listar todos os agendamentos -> apenas admin
router.get("/", checkRole("admin"), listarAgendamentos)

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

// Atualizar agendamento -> apenas admin
router.put("/:id", checkRole("admin"), atualizarAgendamento)

// Deletar agendamento -> apenas admin
router.delete("/:id", checkRole("admin"), deletarAgendamento)

export default router
