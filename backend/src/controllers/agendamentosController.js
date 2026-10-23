// src/controllers/agendamentosController.js
import { supabase } from "../config/supabase.js"
import { calendar, CALENDAR_ID, TIMEZONE, zonedTimeToUtc, utcToZonedParts } from "../googleCalendar.js"
import {
  DURACAO_PADRAO_MINUTOS,
  HORARIOS,
  dataValida,
  horariosDisponiveis,
} from "../services/disponibilidade.js"

export const STATUS = ["pendente", "confirmado", "cancelado"]

function montarEvento({ servico, cliente, inicio, observacoes, status }) {
  const minutos = servico.duracao_minutos || DURACAO_PADRAO_MINUTOS
  const fim = new Date(inicio.getTime() + minutos * 60000)
  const prefixo = status === "confirmado" ? "" : "[A confirmar] "

  return {
    summary: `${prefixo}${servico.nome} - ${cliente.nome}`,
    description: `Cliente: ${cliente.nome} - Telefone: ${cliente.telefone}\n${observacoes || ""}`.trim(),
    start: { dateTime: inicio.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: fim.toISOString(), timeZone: TIMEZONE },
  }
}

async function buscarServico(servicoId) {
  const { data, error } = await supabase
    .from("servicos")
    .select("id, nome, duracao_minutos, ativo, preco")
    .eq("id", servicoId)
    .maybeSingle()

  if (error) throw error
  return data
}

// Criar agendamento (cliente autenticado; admin pode informar cliente_id)
export async function criarAgendamento(req, res) {
  const { servico_id, data, horario, observacoes } = req.body || {}
  const user = req.user
  const clienteId = user.role === "admin" ? req.body?.cliente_id : user.id

  if (!clienteId || !servico_id || !dataValida(data) || !HORARIOS.includes(horario)) {
    return res.status(400).json({ error: "Informe serviço, data e um horário válido" })
  }

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id, nome, telefone")
    .eq("id", clienteId)
    .maybeSingle()

  if (clienteError) throw clienteError
  if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" })

  const servico = await buscarServico(servico_id)
  if (!servico || servico.ativo === false) {
    return res.status(404).json({ error: "Serviço não encontrado" })
  }

  // Confere novamente no servidor se o horário continua livre
  const livres = await horariosDisponiveis(data, servico.duracao_minutos || DURACAO_PADRAO_MINUTOS)
  if (!livres.includes(horario)) {
    return res.status(409).json({ error: "Este horário não está mais disponível" })
  }

  const inicio = zonedTimeToUtc(data, horario)

  const { data: agendamento, error } = await supabase
    .from("agendamentos")
    .insert([{
      cliente_id: cliente.id,
      servico_id: servico.id,
      data_hora: inicio.toISOString(),
      // a proprietária confirma pelo painel; o que ela mesma marca já nasce confirmado
      status: user.role === "admin" ? "confirmado" : "pendente",
      observacoes: observacoes || null,
      valor: servico.preco ?? null, // preço do dia, não muda se o serviço for reajustado
    }])
    .select()
    .single()

  if (error?.code === "23505") {
    return res.status(409).json({ error: "Este horário não está mais disponível" })
  }
  if (error) throw error

  // Cria o evento na agenda da proprietária; se falhar, desfaz o agendamento
  let eventId
  try {
    const created = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: montarEvento({ servico, cliente, inicio, observacoes, status: agendamento.status }),
    })
    eventId = created.data.id
  } catch (err) {
    console.error("Erro ao criar evento no Google Calendar:", err)
    await supabase.from("agendamentos").delete().eq("id", agendamento.id)
    return res.status(502).json({ error: "Não foi possível registrar na agenda. Tente novamente." })
  }

  const { error: updateError } = await supabase
    .from("agendamentos")
    .update({ google_event_id: eventId })
    .eq("id", agendamento.id)

  if (updateError) console.error("Erro ao salvar google_event_id:", updateError.message)

  res.status(201).json({ ...agendamento, google_event_id: eventId, servicos: { nome: servico.nome } })
}

// Listar todos os agendamentos (admin)
export async function listarAgendamentos(req, res) {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("id, servico_id, data_hora, status, observacoes, google_event_id, cliente_id, valor, clientes(nome, telefone), servicos(nome, duracao_minutos, preco)")
    .order("data_hora", { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// Listar agendamentos do cliente autenticado
export async function listarAgendamentosDoCliente(clienteId) {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("id, servico_id, data_hora, status, observacoes, servicos(nome)")
    .eq("cliente_id", clienteId)
    .order("data_hora", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// Atualizar agendamento (admin): { data, horario, servico_id, status, observacoes }
export async function atualizarAgendamento(req, res) {
  const { id } = req.params
  const body = req.body || {}

  if (body.status !== undefined && !STATUS.includes(body.status)) {
    return res.status(400).json({ error: "Status inválido" })
  }

  const { data: atual, error: fetchError } = await supabase
    .from("agendamentos")
    .select("id, servico_id, data_hora, status, observacoes, valor, google_event_id, clientes(nome, telefone)")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!atual) return res.status(404).json({ error: "Agendamento não encontrado" })

  const servico = await buscarServico(body.servico_id || atual.servico_id)
  if (!servico) return res.status(404).json({ error: "Serviço não encontrado" })

  const atuais = utcToZonedParts(new Date(atual.data_hora))
  const data = body.data || atuais.data
  const horario = body.horario || atuais.horario

  if (!dataValida(data) || !/^\d{2}:\d{2}$/.test(horario)) {
    return res.status(400).json({ error: "Data ou horário inválido" })
  }

  const inicio = zonedTimeToUtc(data, horario)
  const status = body.status || atual.status || "pendente"
  const mudouHorario = inicio.getTime() !== new Date(atual.data_hora).getTime()
  const reativando = atual.status === "cancelado" && status !== "cancelado"

  if (status !== "cancelado" && (mudouHorario || servico.id !== atual.servico_id || reativando)) {
    const livres = await horariosDisponiveis(data, servico.duracao_minutos || DURACAO_PADRAO_MINUTOS, atual.id)
    if (!livres.includes(horario)) {
      return res.status(409).json({ error: "Este horário não está disponível" })
    }
  }

  const observacoes = body.observacoes ?? atual.observacoes
  // Trocou o serviço: passa a valer o preço do novo; senão mantém o valor combinado
  const valor = servico.id !== atual.servico_id ? servico.preco ?? null : atual.valor

  const { data: atualizado, error } = await supabase
    .from("agendamentos")
    .update({ servico_id: servico.id, data_hora: inicio.toISOString(), observacoes, status, valor })
    .eq("id", id)
    .select()
    .single()

  if (error?.code === "23505") return res.status(409).json({ error: "Este horário não está disponível" })
  if (error) return res.status(400).json({ error: error.message })

  // Mantém a agenda do Google igual ao banco
  let googleEventId = atual.google_event_id
  try {
    if (status === "cancelado") {
      if (googleEventId) {
        await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: googleEventId }).catch(err => {
          if (![404, 410].includes(err.code)) throw err
        })
        googleEventId = null
      }
    } else {
      const requestBody = montarEvento({ servico, cliente: atual.clientes, inicio, observacoes, status })
      if (googleEventId) {
        await calendar.events.patch({ calendarId: CALENDAR_ID, eventId: googleEventId, requestBody })
      } else {
        const created = await calendar.events.insert({ calendarId: CALENDAR_ID, requestBody })
        googleEventId = created.data.id
      }
    }
  } catch (err) {
    console.error("Erro ao atualizar evento no Google Calendar:", err)
    return res.status(502).json({ error: "Agendamento salvo, mas a agenda do Google não foi atualizada" })
  }

  if (googleEventId !== atual.google_event_id) {
    await supabase.from("agendamentos").update({ google_event_id: googleEventId }).eq("id", id)
  }

  res.json({ ...atualizado, google_event_id: googleEventId })
}

// Deletar agendamento (admin)
export async function deletarAgendamento(req, res) {
  const { id } = req.params

  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select("id, google_event_id")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!agendamento) return res.status(404).json({ error: "Agendamento não encontrado" })

  if (agendamento.google_event_id) {
    try {
      await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: agendamento.google_event_id })
    } catch (err) {
      // 404/410: o evento já foi removido direto no Google
      if (![404, 410].includes(err.code)) {
        console.error("Erro ao remover evento do Google Calendar:", err)
        return res.status(502).json({ error: "Não foi possível remover o evento da agenda" })
      }
    }
  }

  const { error: deleteError } = await supabase.from("agendamentos").delete().eq("id", id)
  if (deleteError) return res.status(400).json({ error: deleteError.message })

  res.json({ msg: "Agendamento deletado com sucesso" })
}
