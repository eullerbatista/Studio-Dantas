// src/controllers/agendamentosController.js
import { supabase } from "../config/supabase.js"
import { TIMEZONE, zonedTimeToUtc, utcToZonedParts } from "../googleCalendar.js"
import {
  DURACAO_PADRAO_MINUTOS,
  HORARIOS,
  dataValida,
  horariosDisponiveis,
} from "../services/disponibilidade.js"
import {
  acessoRevogado,
  agendaDe,
  agendaDoEvento,
  buscarProfissional,
  buscarProfissionalComInativas,
  desconectarAgenda,
  garantirProprietaria,
  realizaServico,
} from "../services/profissionais.js"

export const STATUS = ["pendente", "confirmado", "cancelado"]

// naAgendaDela: false quando o evento de uma funcionária fica na agenda da proprietária
function montarEvento({ servico, cliente, inicio, observacoes, status, profissional, naAgendaDela }) {
  const minutos = servico.duracao_minutos || DURACAO_PADRAO_MINUTOS
  const fim = new Date(inicio.getTime() + minutos * 60000)
  const prefixo = status === "confirmado" ? "" : "[A confirmar] "
  const comQuem = !naAgendaDela && !profissional.proprietaria ? ` · ${profissional.nome}` : ""

  return {
    summary: `${prefixo}${servico.nome} - ${cliente.nome}${comQuem}`,
    description: [
      `Cliente: ${cliente.nome} - Telefone: ${cliente.telefone}`,
      `Profissional: ${profissional.nome}`,
      observacoes || "",
    ].join("\n").trim(),
    start: { dateTime: inicio.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: fim.toISOString(), timeZone: TIMEZONE },
  }
}

// Cria o evento na agenda da profissional; se ela revogou o acesso, usa a da proprietária
export async function criarEvento(profissional, dados) {
  const agenda = agendaDe(profissional)
  try {
    const created = await agenda.calendar.events.insert({
      calendarId: agenda.calendarId,
      requestBody: montarEvento({ ...dados, profissional, naAgendaDela: agenda.propria }),
    })
    return { eventId: created.data.id, propria: agenda.propria }
  } catch (err) {
    if (profissional.proprietaria || !agenda.propria || !acessoRevogado(err)) throw err
    await desconectarAgenda(profissional)
    return criarEvento(profissional, dados)
  }
}

async function removerEvento(profissional, eventId, eventoNaAgendaPropria) {
  if (!eventId) return
  // Agenda dela desconectada: não há mais como apagar o evento de lá
  const agenda = agendaDoEvento(profissional, eventoNaAgendaPropria)
  if (!agenda) return
  try {
    await agenda.calendar.events.delete({ calendarId: agenda.calendarId, eventId })
  } catch (err) {
    // 404/410: o evento já foi removido direto no Google
    if (![404, 410].includes(err.code) && !acessoRevogado(err)) throw err
  }
}

// Funcionária só mexe nos agendamentos dela; a proprietária (admin) em todos
function podeAlterar(user, agendamento) {
  return user.role === "admin" || agendamento.profissional_id === user.profissional_id
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

// Criar agendamento: a cliente escolhe a profissional; a equipe pode informar cliente_id
export async function criarAgendamento(req, res) {
  const { servico_id, data, horario, observacoes } = req.body || {}
  const user = req.user
  const clienteId = user.role === "client" ? user.id : req.body?.cliente_id
  // Funcionária agenda só para si; a proprietária escolhe (sem escolha, ela mesma)
  const profissionalId = user.role === "profissional" ? user.profissional_id : req.body?.profissional_id

  if (!clienteId || !servico_id || !dataValida(data) || !HORARIOS.includes(horario)) {
    return res.status(400).json({ error: "Informe serviço, data e um horário válido" })
  }
  if (user.role === "client" && !profissionalId) {
    return res.status(400).json({ error: "Escolha a profissional" })
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

  const profissional = await buscarProfissional(profissionalId)
  if (!profissional) return res.status(404).json({ error: "Profissional não encontrada" })
  if (!(await realizaServico(profissional.id, servico.id))) {
    return res.status(400).json({ error: `${profissional.nome} não realiza este serviço` })
  }

  // Confere novamente no servidor se o horário continua livre para ela
  const livres = await horariosDisponiveis(data, servico.duracao_minutos || DURACAO_PADRAO_MINUTOS, profissional)
  if (!livres.includes(horario)) {
    return res.status(409).json({ error: "Este horário não está mais disponível" })
  }

  const inicio = zonedTimeToUtc(data, horario)

  const { data: agendamento, error } = await supabase
    .from("agendamentos")
    .insert([{
      cliente_id: cliente.id,
      servico_id: servico.id,
      profissional_id: profissional.id,
      data_hora: inicio.toISOString(),
      // a equipe confirma pelo painel; o que ela mesma marca já nasce confirmado
      status: user.role === "client" ? "pendente" : "confirmado",
      observacoes: observacoes || null,
      valor: servico.preco ?? null, // preço do dia, não muda se o serviço for reajustado
    }])
    .select()
    .single()

  if (error?.code === "23505") {
    return res.status(409).json({ error: "Este horário não está mais disponível" })
  }
  if (error) throw error

  // Cria o evento na agenda da profissional; se falhar, desfaz o agendamento
  let evento
  try {
    evento = await criarEvento(profissional, { servico, cliente, inicio, observacoes, status: agendamento.status })
  } catch (err) {
    console.error("Erro ao criar evento no Google Calendar:", err)
    await supabase.from("agendamentos").delete().eq("id", agendamento.id)
    return res.status(502).json({ error: "Não foi possível registrar na agenda. Tente novamente." })
  }

  const { error: updateError } = await supabase
    .from("agendamentos")
    .update({ google_event_id: evento.eventId, evento_agenda_propria: evento.propria })
    .eq("id", agendamento.id)

  if (updateError) console.error("Erro ao salvar google_event_id:", updateError.message)

  res.status(201).json({
    ...agendamento,
    google_event_id: evento.eventId,
    servicos: { nome: servico.nome },
    profissionais: { nome: profissional.nome },
  })
}

// Listar todos os agendamentos (equipe: todas veem a agenda do studio)
export async function listarAgendamentos(req, res) {
  await garantirProprietaria() // agendamentos antigos passam a ser dela

  const { data, error } = await supabase
    .from("agendamentos")
    .select("id, servico_id, profissional_id, data_hora, status, observacoes, google_event_id, cliente_id, valor, clientes(nome, telefone), servicos(nome, duracao_minutos, preco), profissionais(nome)")
    .order("data_hora", { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// Listar agendamentos do cliente autenticado
export async function listarAgendamentosDoCliente(clienteId) {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("id, servico_id, data_hora, status, observacoes, servicos(nome), profissionais(nome)")
    .eq("cliente_id", clienteId)
    .order("data_hora", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// Atualizar agendamento (equipe): { data, horario, servico_id, profissional_id, status, observacoes }
export async function atualizarAgendamento(req, res) {
  const { id } = req.params
  const body = req.body || {}
  const user = req.user

  if (body.status !== undefined && !STATUS.includes(body.status)) {
    return res.status(400).json({ error: "Status inválido" })
  }

  const { data: atual, error: fetchError } = await supabase
    .from("agendamentos")
    .select("id, servico_id, profissional_id, data_hora, status, observacoes, valor, google_event_id, evento_agenda_propria, clientes(nome, telefone)")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!atual) return res.status(404).json({ error: "Agendamento não encontrado" })
  if (!podeAlterar(user, atual)) {
    return res.status(403).json({ error: "Você só pode alterar os seus agendamentos" })
  }

  const profissionalAtual = await buscarProfissionalComInativas(atual.profissional_id)
  const novoProfissionalId = Number(body.profissional_id ?? profissionalAtual.id)
  const mudouProfissional = novoProfissionalId !== profissionalAtual.id
  if (mudouProfissional && user.role !== "admin") {
    return res.status(403).json({ error: "Só a proprietária pode passar o agendamento para outra profissional" })
  }
  const profissional = mudouProfissional ? await buscarProfissional(novoProfissionalId) : profissionalAtual
  if (!profissional) return res.status(404).json({ error: "Profissional não encontrada" })

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
  const mudouServico = servico.id !== atual.servico_id
  const reativando = atual.status === "cancelado" && status !== "cancelado"

  if (status !== "cancelado" && (mudouHorario || mudouServico || mudouProfissional || reativando)) {
    if (!profissional.ativo) {
      return res.status(400).json({ error: "Esta profissional não faz mais parte da equipe. Escolha outra." })
    }
    if ((mudouServico || mudouProfissional) && !(await realizaServico(profissional.id, servico.id))) {
      return res.status(400).json({ error: `${profissional.nome} não realiza este serviço` })
    }
    const duracao = servico.duracao_minutos || DURACAO_PADRAO_MINUTOS
    const livres = await horariosDisponiveis(data, duracao, profissional, atual.id)
    if (!livres.includes(horario)) {
      return res.status(409).json({ error: "Este horário não está disponível" })
    }
  }

  const observacoes = body.observacoes ?? atual.observacoes
  // Trocou o serviço: passa a valer o preço do novo; senão mantém o valor combinado
  const valor = mudouServico ? servico.preco ?? null : atual.valor

  const { data: atualizado, error } = await supabase
    .from("agendamentos")
    .update({
      servico_id: servico.id,
      profissional_id: profissional.id,
      data_hora: inicio.toISOString(),
      observacoes,
      status,
      valor,
    })
    .eq("id", id)
    .select()
    .single()

  if (error?.code === "23505") return res.status(409).json({ error: "Este horário não está disponível" })
  if (error) return res.status(400).json({ error: error.message })

  // Mantém a agenda do Google igual ao banco
  let googleEventId = atual.google_event_id
  let eventoNaAgendaPropria = atual.evento_agenda_propria
  try {
    // Cancelado sai da agenda; trocou de profissional, o evento muda de agenda
    if (status === "cancelado" || mudouProfissional) {
      await removerEvento(profissionalAtual, googleEventId, eventoNaAgendaPropria)
      googleEventId = null
      eventoNaAgendaPropria = false
    }

    if (status !== "cancelado") {
      const dados = { servico, cliente: atual.clientes, inicio, observacoes, status }
      let atualizouNoGoogle = false
      const agenda = googleEventId && agendaDoEvento(profissional, eventoNaAgendaPropria)

      if (agenda) {
        try {
          await agenda.calendar.events.patch({
            calendarId: agenda.calendarId,
            eventId: googleEventId,
            requestBody: montarEvento({ ...dados, profissional, naAgendaDela: eventoNaAgendaPropria }),
          })
          atualizouNoGoogle = true
        } catch (err) {
          // Evento apagado no Google ou agenda desconectada: cria de novo
          if (![404, 410].includes(err.code) && !acessoRevogado(err)) throw err
        }
      }

      if (!atualizouNoGoogle) {
        const evento = await criarEvento(profissional, dados)
        googleEventId = evento.eventId
        eventoNaAgendaPropria = evento.propria
      }
    }
  } catch (err) {
    console.error("Erro ao atualizar evento no Google Calendar:", err)
    return res.status(502).json({ error: "Agendamento salvo, mas a agenda do Google não foi atualizada" })
  }

  if (googleEventId !== atual.google_event_id || eventoNaAgendaPropria !== atual.evento_agenda_propria) {
    await supabase
      .from("agendamentos")
      .update({ google_event_id: googleEventId, evento_agenda_propria: eventoNaAgendaPropria })
      .eq("id", id)
  }

  res.json({ ...atualizado, google_event_id: googleEventId, evento_agenda_propria: eventoNaAgendaPropria })
}

// Deletar agendamento (equipe; funcionária só os dela)
export async function deletarAgendamento(req, res) {
  const { id } = req.params

  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select("id, profissional_id, google_event_id, evento_agenda_propria")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!agendamento) return res.status(404).json({ error: "Agendamento não encontrado" })
  if (!podeAlterar(req.user, agendamento)) {
    return res.status(403).json({ error: "Você só pode excluir os seus agendamentos" })
  }

  try {
    const profissional = await buscarProfissionalComInativas(agendamento.profissional_id)
    await removerEvento(profissional, agendamento.google_event_id, agendamento.evento_agenda_propria)
  } catch (err) {
    console.error("Erro ao remover evento do Google Calendar:", err)
    return res.status(502).json({ error: "Não foi possível remover o evento da agenda" })
  }

  const { error: deleteError } = await supabase.from("agendamentos").delete().eq("id", id)
  if (deleteError) return res.status(400).json({ error: deleteError.message })

  res.json({ msg: "Agendamento deletado com sucesso" })
}
