import { google } from "googleapis"
import { supabase } from "../config/supabase.js"
import { calendar as agendaDaProprietaria, CALENDAR_ID, createOAuthClient } from "../googleCalendar.js"

export const COLUNAS_PROFISSIONAL = "id, nome, email, proprietaria, ativo, google_refresh_token"

export function emailDaProprietaria() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
}

let proprietariaEmCache = null

/**
 * A proprietária também atende. Na primeira vez cria o cadastro dela com todos os
 * serviços e passa para ela os agendamentos feitos antes de existir a equipe.
 */
export async function garantirProprietaria() {
  if (proprietariaEmCache) return proprietariaEmCache

  const { data, error } = await supabase
    .from("profissionais")
    .select(COLUNAS_PROFISSIONAL)
    .eq("proprietaria", true)
    .limit(1)
  if (error) throw error

  let proprietaria = data[0]
  if (!proprietaria) {
    const { data: criada, error: erroCriar } = await supabase
      .from("profissionais")
      .insert([{ nome: "Proprietária", email: emailDaProprietaria(), proprietaria: true }])
      .select(COLUNAS_PROFISSIONAL)
      .single()
    // Outra requisição criou ao mesmo tempo
    if (erroCriar?.code === "23505") return garantirProprietaria()
    if (erroCriar) throw erroCriar
    proprietaria = criada

    const { data: servicos, error: erroServicos } = await supabase.from("servicos").select("id")
    if (erroServicos) throw erroServicos
    if (servicos.length) {
      const { error: erroVinculo } = await supabase
        .from("profissionais_servicos")
        .insert(servicos.map(s => ({ profissional_id: proprietaria.id, servico_id: s.id })))
      if (erroVinculo) throw erroVinculo
    }
  }

  // Agendamentos de antes da equipe (ou sem profissional) ficam com a proprietária
  const { error: erroAntigos } = await supabase
    .from("agendamentos")
    .update({ profissional_id: proprietaria.id })
    .is("profissional_id", null)
  if (erroAntigos) throw erroAntigos

  proprietariaEmCache = proprietaria
  return proprietaria
}

export function esquecerProprietariaEmCache() {
  proprietariaEmCache = null
}

// Profissional ativa pelo id; sem id, a proprietária
export async function buscarProfissional(id) {
  if (id == null || id === "") return garantirProprietaria()

  const { data, error } = await supabase
    .from("profissionais")
    .select(COLUNAS_PROFISSIONAL)
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle()
  if (error) throw error
  return data
}

// Mesmo removida da equipe: usada para mexer nos agendamentos antigos dela
export async function buscarProfissionalComInativas(id) {
  if (id == null) return garantirProprietaria()

  const { data, error } = await supabase
    .from("profissionais")
    .select(COLUNAS_PROFISSIONAL)
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function realizaServico(profissionalId, servicoId) {
  const { data, error } = await supabase
    .from("profissionais_servicos")
    .select("profissional_id")
    .eq("profissional_id", profissionalId)
    .eq("servico_id", servicoId)
    .limit(1)
  if (error) throw error
  return data.length > 0
}

/**
 * Agenda Google de uma profissional. Quem ainda não entrou no painel (sem token)
 * usa a agenda da proprietária, com o nome dela no evento.
 */
export function agendaDe(profissional) {
  if (!profissional.proprietaria && profissional.google_refresh_token) {
    const auth = createOAuthClient()
    auth.setCredentials({ refresh_token: profissional.google_refresh_token })
    return { calendar: google.calendar({ version: "v3", auth }), calendarId: "primary", propria: true }
  }
  return { calendar: agendaDaProprietaria, calendarId: CALENDAR_ID, propria: !!profissional.proprietaria }
}

// Agenda onde está o evento de um agendamento (null: não dá mais para acessar)
export function agendaDoEvento(profissional, eventoNaAgendaPropria) {
  if (!eventoNaAgendaPropria || profissional?.proprietaria) {
    return { calendar: agendaDaProprietaria, calendarId: CALENDAR_ID }
  }
  if (!profissional?.google_refresh_token) return null
  return agendaDe(profissional)
}

// Acesso revogado pela profissional: volta a usar a agenda da proprietária
export function acessoRevogado(err) {
  return err?.response?.data?.error === "invalid_grant" || err?.message === "invalid_grant"
}

export async function desconectarAgenda(profissional) {
  const { error } = await supabase
    .from("profissionais")
    .update({ google_refresh_token: null })
    .eq("id", profissional.id)
  if (error) console.error("Erro ao desconectar agenda da profissional:", error.message)
  profissional.google_refresh_token = null
}
