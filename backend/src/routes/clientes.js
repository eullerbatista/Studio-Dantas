import express from "express";
import {
  criarCliente,
  listarClientes,
  atualizarCliente,
  deletarCliente
} from "../controllers/index.js";
import { checkRole } from "../middleware/auth.js";

const router = express.Router();

// Cliente se cadastra pelo login (POST /api/auth/client/register);
// a equipe cadastra quem agendou pessoalmente
router.post("/", checkRole("profissional"), criarCliente);

// Listar clientes -> equipe
router.get("/", checkRole("profissional"), listarClientes);

// Atualizar cliente -> apenas admin
router.put("/:id", checkRole("admin"), atualizarCliente);

// Deletar cliente -> apenas admin
router.delete("/:id", checkRole("admin"), deletarCliente);

export default router;
