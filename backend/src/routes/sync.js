import express from "express"
import { supabase } from "../config/supabase.js"
import { calendar, CALENDAR_ID, TIMEZONE } from "../googleCalendar.js"
import { checkRole } from "../middleware/auth.js"
import { DURACAO_PADRAO_MINUTOS } from "../services/disponibilidade.js"

const router = express.Router()

/**
 * Recria no Google Calendar os agendamentos futuros que sumiram de lá (apenas admin)
 * Exemplo: GET /api/calendar/sync
 */
router.get("/", checkRole("admin"), async (req, res) => {
  try {
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(new Date(now).setMonth(now.getMonth() + 3)).toISOString()

    const googleEvents = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      maxResults: 2500,
    })

    const googleEventIds = new Set(googleEvents.data.items.map(e => e.id))

    const { data: agendamentos, error } = await supabase
      .from("agendamentos")
      .select("id, data_hora, status, observacoes, google_event_id, clientes(nome, telefone), servicos(nome, duracao_minutos)")
      .gte("data_hora", timeMin)
      .lt("data_hora", timeMax)
      .or("status.is.null,status.neq.cancelado")

    if (error) throw error

    const updates = []

    for (const ag of agendamentos) {
      if (ag.google_event_id && googleEventIds.has(ag.google_event_id)) continue

      const inicio = new Date(ag.data_hora)
      const minutos = ag.servicos?.duracao_minutos || DURACAO_PADRAO_MINUTOS
      const fim = new Date(inicio.getTime() + minutos * 60000)

      const createdEvent = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
          summary: `${ag.status === "confirmado" ? "" : "[A confirmar] "}${ag.servicos?.nome || "Serviço"} - ${ag.clientes?.nome || "Cliente"}`,
          description: `Cliente: ${ag.clientes?.nome} - Telefone: ${ag.clientes?.telefone}\n${ag.observacoes || ""}`.trim(),
          start: { dateTime: inicio.toISOString(), timeZone: TIMEZONE },
          end: { dateTime: fim.toISOString(), timeZone: TIMEZONE },
        },
      })

      await supabase
        .from("agendamentos")
        .update({ google_event_id: createdEvent.data.id })
        .eq("id", ag.id)

      updates.push({ id: ag.id, action: ag.google_event_id ? "recreated" : "created" })
    }

    res.json({
      msg: "Sincronização concluída",
      totalAgendamentos: agendamentos.length,
      totalEventosGoogle: googleEvents.data.items.length,
      updates,
    })
  } catch (err) {
    console.error("Erro na sincronização:", err)
    res.status(500).json({ error: "Erro ao sincronizar agendamentos" })
  }
})

export default router
