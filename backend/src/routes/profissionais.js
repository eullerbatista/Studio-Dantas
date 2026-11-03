import express from "express"
import { checkRole } from "../middleware/auth.js"
import {
  atualizarProfissional,
  criarProfissional,
  listarEquipe,
  listarProfissionaisDoServico,
  removerProfissional,
} from "../controllers/index.js"

const router = express.Router()

// Público: quem realiza o serviço (?servico_id=3), para a cliente escolher ao agendar
router.get("/", listarProfissionaisDoServico)

// Painel: equipe e serviços de cada uma
router.get("/equipe", checkRole("profissional"), listarEquipe)

// Só a proprietária adiciona, altera e remove profissionais
router.post("/", checkRole("admin"), criarProfissional)
router.put("/:id", checkRole("admin"), atualizarProfissional)
router.delete("/:id", checkRole("admin"), removerProfissional)

export default router
