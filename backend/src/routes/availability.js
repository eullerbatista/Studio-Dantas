import express from "express"
import { supabase } from "../config/supabase.js"
import { DURACAO_PADRAO_MINUTOS, dataValida, diaFechado, horariosDisponiveis } from "../services/disponibilidade.js"

const router = express.Router()

/**
 * Retorna horários disponíveis em uma data para um serviço
 * Exemplo: GET /api/calendar/availability?date=2026-10-20&servico_id=<uuid>
 */
router.get("/", async (req, res) => {
  const { date, servico_id } = req.query
  if (!dataValida(date)) {
    return res.status(400).json({ error: "Data é obrigatória (YYYY-MM-DD)" })
  }

  let duracao = DURACAO_PADRAO_MINUTOS
  if (servico_id) {
    const { data: servico, error } = await supabase
      .from("servicos")
      .select("duracao_minutos")
      .eq("id", servico_id)
      .maybeSingle()

    if (error) throw error
    if (!servico) return res.status(404).json({ error: "Serviço não encontrado" })
    duracao = servico.duracao_minutos || DURACAO_PADRAO_MINUTOS
  }

  try {
    res.json({ horarios: await horariosDisponiveis(date, duracao), fechado: diaFechado(date) })
  } catch (err) {
    console.error("Erro ao buscar disponibilidade:", err)
    res.status(500).json({ error: "Erro ao buscar disponibilidade" })
  }
})

export default router
