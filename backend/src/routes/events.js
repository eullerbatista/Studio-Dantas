import express from "express"
import { calendar, CALENDAR_ID } from "../googleCalendar.js"
import { checkRole } from "../middleware/auth.js"

const router = express.Router()

/**
 * Lista os eventos do Google Calendar (apenas admin)
 * Exemplo: GET /api/calendar/events
 */
router.get("/", checkRole("admin"), async (req, res) => {
  try {
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(now.setMonth(now.getMonth() + 3)).toISOString() // próximos 3 meses

    const events = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    })

    const listaEventos = events.data.items.map(e => ({
      id: e.id,
      resumo: e.summary,
      descricao: e.description,
      inicio: e.start.dateTime || e.start.date,
      fim: e.end.dateTime || e.end.date,
    }))

    res.json({ eventos: listaEventos })
  } catch (err) {
    console.error("Erro ao listar eventos:", err)
    res.status(500).json({ error: "Erro ao listar eventos do Google Calendar" })
  }
})

export default router
