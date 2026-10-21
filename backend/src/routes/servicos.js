import express from "express"
import { checkRole } from "../middleware/auth.js"
import {
  atualizarServico,
  criarServico,
  desativarServico,
  listarServicos,
  listarTodosServicos,
  reativarServico
} from "../controllers/index.js"

const router = express.Router()

router.get("/", listarServicos)
router.get("/todos", checkRole("admin"), listarTodosServicos)
router.post("/", checkRole("admin"), criarServico)
router.put("/:id", checkRole("admin"), atualizarServico)
router.delete("/:id", checkRole("admin"), desativarServico)
router.post("/:id/reativar", checkRole("admin"), reativarServico)

export default router
