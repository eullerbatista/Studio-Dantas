import express from "express"
import { supabase } from "../config/supabase.js"
import { checkRole } from "../middleware/auth.js"
import { criarEvento } from "../controllers/agendamentosController.js"
import { acessoRevogado, agendaDoEvento, buscarProfissionalComInativas } from "../services/profissionais.js"

const router = express.Router()

async function eventoExiste(profissional, ag) {
  if (!ag.google_event_id) return false
  const agenda = agendaDoEvento(profissional, ag.evento_agenda_propria)
  if (!agenda) return false
  try {
    const { data } = await agenda.calendar.events.get({ calendarId: agenda.calendarId, eventId: ag.google_event_id })
    return data.status !== "cancelled"
  } catch (err) {
    if ([404, 410].includes(err.code) || acessoRevogado(err)) return false
    throw err
  }
}

/**
 * Recria no Google Calendar (na agenda de cada profissional) os agendamentos futuros
 * que sumiram de lá (apenas admin)
 * Exemplo: GET /api/calendar/sync
 */
router.get("/", checkRole("admin"), async (req, res) => {
  try {
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(new Date(now).setMonth(now.getMonth() + 3)).toISOString()

    const { data: agendamentos, error } = await supabase
      .from("agendamentos")
      .select("id, data_hora, status, observacoes, google_event_id, evento_agenda_propria, profissional_id, clientes(nome, telefone), servicos(nome, duracao_minutos)")
      .gte("data_hora", timeMin)
      .lt("data_hora", timeMax)
      .or("status.is.null,status.neq.cancelado")

    if (error) throw error

    const profissionais = new Map()
    const updates = []

    for (const ag of agendamentos) {
      if (!profissionais.has(ag.profissional_id)) {
        profissionais.set(ag.profissional_id, await buscarProfissionalComInativas(ag.profissional_id))
      }
      const profissional = profissionais.get(ag.profissional_id)
      if (await eventoExiste(profissional, ag)) continue

      const evento = await criarEvento(profissional, {
        servico: { nome: ag.servicos?.nome || "Serviço", duracao_minutos: ag.servicos?.duracao_minutos },
        cliente: { nome: ag.clientes?.nome || "Cliente", telefone: ag.clientes?.telefone },
        inicio: new Date(ag.data_hora),
        observacoes: ag.observacoes,
        status: ag.status,
      })

      await supabase
        .from("agendamentos")
        .update({ google_event_id: evento.eventId, evento_agenda_propria: evento.propria })
        .eq("id", ag.id)

      updates.push({ id: ag.id, action: ag.google_event_id ? "recreated" : "created" })
    }

    res.json({
      msg: "Sincronização concluída",
      totalAgendamentos: agendamentos.length,
      updates,
    })
  } catch (err) {
    console.error("Erro na sincronização:", err)
    res.status(500).json({ error: "Erro ao sincronizar agendamentos" })
  }
})

export default router
