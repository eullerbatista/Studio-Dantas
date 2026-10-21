import { supabase } from "../config/supabase.js"
import { calendar, CALENDAR_ID, TIMEZONE, zonedTimeToUtc } from "../googleCalendar.js"

// Horário de funcionamento (no fuso do salão): o serviço precisa terminar até o fechamento
export const ABERTURA = "08:00"
export const FECHAMENTO = "18:00"
export const INTERVALO_MINUTOS = 60

// Almoço: nenhum serviço pode ocupar esse intervalo
export const ALMOCO = { inicio: "12:00", fim: "13:00" }

// Dias de folga (0 = domingo, 1 = segunda, ... 6 = sábado)
export const DIAS_FECHADOS = [0, 1]

export function diaFechado(dateStr) {
  return DIAS_FECHADOS.includes(new Date(`${dateStr}T12:00:00Z`).getUTCDay())
}

const paraMinutos = hora => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5))
const paraHora = minutos =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`

// Horários de início oferecidos: 08:00, 08:30, ... 17:30
export const HORARIOS = []
for (let m = paraMinutos(ABERTURA); m < paraMinutos(FECHAMENTO); m += INTERVALO_MINUTOS) {
  HORARIOS.push(paraHora(m))
}

export const DURACAO_PADRAO_MINUTOS = 60

const STATUS_QUE_NAO_OCUPAM = ["cancelado"]

function proximoDia(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function dataValida(dateStr) {
  return typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
}

/**
 * Intervalos ocupados no dia: eventos do Google Calendar (inclusive eventos de dia
 * inteiro, como folgas) e agendamentos do banco (caso algum não esteja no Google).
 */
async function intervalosOcupados(dateStr, ignorarAgendamentoId = null) {
  const inicioDia = zonedTimeToUtc(dateStr, "00:00")
  const fimDia = zonedTimeToUtc(proximoDia(dateStr), "00:00")

  const events = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: inicioDia.toISOString(),
    timeMax: fimDia.toISOString(),
    timeZone: TIMEZONE,
    singleEvents: true,
    maxResults: 250,
  })

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("id, data_hora, status, google_event_id, servicos(duracao_minutos)")
    .gte("data_hora", inicioDia.toISOString())
    .lt("data_hora", fimDia.toISOString())

  if (error) throw error

  const ocupados = []
  let ignorarEventId = null

  for (const ag of agendamentos) {
    if (ag.id === ignorarAgendamentoId) {
      ignorarEventId = ag.google_event_id
      continue
    }
    if (STATUS_QUE_NAO_OCUPAM.includes(ag.status)) continue
    const start = new Date(ag.data_hora)
    const minutos = ag.servicos?.duracao_minutos || DURACAO_PADRAO_MINUTOS
    ocupados.push({ start, end: new Date(start.getTime() + minutos * 60000) })
  }

  for (const e of events.data.items || []) {
    if (e.status === "cancelled" || e.id === ignorarEventId) continue
    if (e.start?.dateTime) {
      ocupados.push({ start: new Date(e.start.dateTime), end: new Date(e.end.dateTime) })
    } else if (e.start?.date) {
      // Evento de dia inteiro bloqueia o(s) dia(s) inteiro(s)
      ocupados.push({
        start: zonedTimeToUtc(e.start.date, "00:00"),
        end: zonedTimeToUtc(e.end.date, "00:00"),
      })
    }
  }

  return ocupados
}

/**
 * Lista os horários livres de um dia para um serviço com a duração informada.
 */
export async function horariosDisponiveis(dateStr, duracaoMinutos, ignorarAgendamentoId = null) {
  if (diaFechado(dateStr)) return []

  const ocupados = await intervalosOcupados(dateStr, ignorarAgendamentoId)
  const agora = new Date()

  return HORARIOS.filter(hora => {
    const inicioMin = paraMinutos(hora)
    const fimMin = inicioMin + duracaoMinutos
    if (fimMin > paraMinutos(FECHAMENTO)) return false
    if (inicioMin < paraMinutos(ALMOCO.fim) && fimMin > paraMinutos(ALMOCO.inicio)) return false
    const start = zonedTimeToUtc(dateStr, hora)
    const end = new Date(start.getTime() + duracaoMinutos * 60000)
    if (start <= agora) return false
    return !ocupados.some(o => start < o.end && end > o.start)
  })
}
