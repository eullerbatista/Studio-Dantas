import { google } from "googleapis"
import { supabase } from "./config/supabase.js"

export const TIMEZONE = process.env.TIMEZONE || "America/Sao_Paulo"
export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary"

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

// Cliente único usado pelo servidor para acessar a agenda da proprietária
const calendarAuth = createOAuthClient()

if (process.env.GOOGLE_REFRESH_TOKEN) {
  calendarAuth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
}

export const calendar = google.calendar({ version: "v3", auth: calendarAuth })

export function setCalendarRefreshToken(refreshToken) {
  calendarAuth.setCredentials({ refresh_token: refreshToken })
}

// O refresh token salvo no banco (último login da admin) tem prioridade sobre o .env
export async function loadStoredRefreshToken() {
  const { data, error } = await supabase
    .from("admins")
    .select("google_tokens")
    .ilike("email", (process.env.ADMIN_EMAIL || "").trim())
    .limit(1)

  if (error) {
    console.warn("Não foi possível ler o refresh token do banco:", error.message)
    return
  }
  const refreshToken = data[0]?.google_tokens?.refresh_token
  if (refreshToken) {
    setCalendarRefreshToken(refreshToken)
    console.log("Refresh token do Google carregado do banco")
  }
}

// Diferença (em minutos) entre o horário local do fuso e UTC naquele instante
function offsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const v = Object.fromEntries(parts.map(p => [p.type, Number(p.value)]))
  const asUTC = Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second)
  return (asUTC - date.getTime()) / 60000
}

/**
 * Converte "2026-10-20" + "09:00" no fuso do salão para um Date (instante UTC),
 * independente do fuso do servidor.
 */
export function zonedTimeToUtc(dateStr, timeStr, timeZone = TIMEZONE) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const [h, mi] = timeStr.split(":").map(Number)
  const guess = Date.UTC(y, m - 1, d, h, mi)
  return new Date(guess - offsetMinutes(new Date(guess), timeZone) * 60000)
}

// Data (YYYY-MM-DD) e hora (HH:MM) de um instante, no fuso do salão
export function utcToZonedParts(date, timeZone = TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date)
  const v = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return { data: `${v.year}-${v.month}-${v.day}`, horario: `${v.hour}:${v.minute}` }
}
