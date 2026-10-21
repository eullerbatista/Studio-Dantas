import express from "express";
import {
  listarClientes,
  atualizarCliente,
  deletarCliente
} from "../controllers/index.js";
import { checkRole } from "../middleware/auth.js";

const router = express.Router();

// Cadastro de cliente é feito pelo login (POST /api/auth/client/register)

// Listar clientes -> apenas admin
router.get("/", checkRole("admin"), listarClientes);

// Atualizar cliente -> apenas admin
router.put("/:id", checkRole("admin"), atualizarCliente);

// Deletar cliente -> apenas admin
router.delete("/:id", checkRole("admin"), deletarCliente);

export default router;
