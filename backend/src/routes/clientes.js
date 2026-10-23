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
// admin cadastra quem agendou pessoalmente
router.post("/", checkRole("admin"), criarCliente);

// Listar clientes -> apenas admin
router.get("/", checkRole("admin"), listarClientes);

// Atualizar cliente -> apenas admin
router.put("/:id", checkRole("admin"), atualizarCliente);

// Deletar cliente -> apenas admin
router.delete("/:id", checkRole("admin"), deletarCliente);

export default router;
