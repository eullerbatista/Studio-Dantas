import { supabase } from "../config/supabase.js"
import { calendar, CALENDAR_ID, TIMEZONE, zonedTimeToUtc } from "../googleCalendar.js"
import { acessoRevogado, agendaDe, desconectarAgenda } from "./profissionais.js"

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

async function eventosDoDia(calendar, calendarId, inicioDia, fimDia) {
  const events = await calendar.events.list({
    calendarId,
    timeMin: inicioDia.toISOString(),
    timeMax: fimDia.toISOString(),
    timeZone: TIMEZONE,
    singleEvents: true,
    maxResults: 250,
  })
  return (events.data.items || []).filter(e => e.status !== "cancelled")
}

function intervaloDoEvento(e) {
  if (e.start?.dateTime) return { start: new Date(e.start.dateTime), end: new Date(e.end.dateTime) }
  // Evento de dia inteiro bloqueia o(s) dia(s) inteiro(s)
  return { start: zonedTimeToUtc(e.start.date, "00:00"), end: zonedTimeToUtc(e.end.date, "00:00") }
}

/**
 * Intervalos ocupados no dia para uma profissional:
 * - os agendamentos dela no banco;
 * - na agenda da proprietária, eventos de dia inteiro (folga, feriado) fecham para todas
 *   e os demais compromissos bloqueiam só a proprietária;
 * - na Agenda Google da própria funcionária (se conectada), qualquer compromisso dela.
 * Eventos criados pelo site são ignorados no Google: já contam pelo banco.
 */
async function intervalosOcupados(dateStr, profissional, ignorarAgendamentoId = null) {
  const inicioDia = zonedTimeToUtc(dateStr, "00:00")
  const fimDia = zonedTimeToUtc(proximoDia(dateStr), "00:00")

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("id, data_hora, status, google_event_id, profissional_id, servicos(duracao_minutos)")
    .gte("data_hora", inicioDia.toISOString())
    .lt("data_hora", fimDia.toISOString())

  if (error) throw error

  const ocupados = []
  const eventosDoSite = new Set()

  for (const ag of agendamentos) {
    if (ag.google_event_id) eventosDoSite.add(ag.google_event_id)
    if (ag.id === ignorarAgendamentoId) continue
    if (STATUS_QUE_NAO_OCUPAM.includes(ag.status)) continue
    if (ag.profissional_id !== profissional.id) continue
    const start = new Date(ag.data_hora)
    const minutos = ag.servicos?.duracao_minutos || DURACAO_PADRAO_MINUTOS
    ocupados.push({ start, end: new Date(start.getTime() + minutos * 60000) })
  }

  for (const e of await eventosDoDia(calendar, CALENDAR_ID, inicioDia, fimDia)) {
    if (eventosDoSite.has(e.id)) continue
    if (e.start?.date || profissional.proprietaria) ocupados.push(intervaloDoEvento(e))
  }

  const agenda = agendaDe(profissional)
  if (!profissional.proprietaria && agenda.propria) {
    try {
      for (const e of await eventosDoDia(agenda.calendar, agenda.calendarId, inicioDia, fimDia)) {
        if (!eventosDoSite.has(e.id)) ocupados.push(intervaloDoEvento(e))
      }
    } catch (err) {
      // Sem acesso à agenda dela: segue só com o banco e a agenda da proprietária
      if (acessoRevogado(err)) await desconectarAgenda(profissional)
      else console.error(`Erro ao ler a agenda de ${profissional.nome}:`, err.message)
    }
  }

  return ocupados
}

/**
 * Lista os horários livres de uma profissional num dia, para um serviço com a duração informada.
 */
export async function horariosDisponiveis(dateStr, duracaoMinutos, profissional, ignorarAgendamentoId = null) {
  if (diaFechado(dateStr)) return []

  const ocupados = await intervalosOcupados(dateStr, profissional, ignorarAgendamentoId)
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
