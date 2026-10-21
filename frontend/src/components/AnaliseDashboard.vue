<template>
  <div class="analise">
    <!-- Filtros -->
    <div class="filtros">
      <label>
        Agrupar por
        <select v-model="agrupamento">
          <option value="dia">Dia</option>
          <option value="semana">Semana</option>
          <option value="mes">Mês</option>
        </select>
      </label>
      <label>
        De
        <input v-model="de" type="date" :max="ate" />
      </label>
      <label>
        Até
        <input v-model="ate" type="date" :min="de" />
      </label>
      <label>
        Cliente
        <select v-model="clienteId">
          <option value="">Todas</option>
          <option v-for="c in clientesOrdenadas" :key="c.id" :value="String(c.id)">{{ c.nome }}</option>
        </select>
      </label>
      <label>
        Status
        <select v-model="filtroStatus">
          <option value="confirmado">Somente confirmados</option>
          <option value="ativos">Confirmados e pendentes</option>
        </select>
      </label>
    </div>

    <!-- Indicadores -->
    <div class="indicadores">
      <div class="indicador">
        <span class="rotulo">Serviços</span>
        <strong>{{ filtrados.length }}</strong>
      </div>
      <div class="indicador">
        <span class="rotulo">Faturamento</span>
        <strong>{{ moeda(totalFaturamento) }}</strong>
      </div>
      <div class="indicador">
        <span class="rotulo">Ticket médio</span>
        <strong>{{ moeda(filtrados.length ? totalFaturamento / filtrados.length : 0) }}</strong>
      </div>
      <div class="indicador">
        <span class="rotulo">Clientes atendidas</span>
        <strong>{{ totalClientes }}</strong>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="graficos">
      <GraficoBarras :titulo="`Serviços por ${NOMES_AGRUPAMENTO[agrupamento]}`" :pontos="pontosServicos" :formatar="inteiro" />
      <GraficoBarras :titulo="`Faturamento por ${NOMES_AGRUPAMENTO[agrupamento]}`" :pontos="pontosFaturamento" :formatar="moeda" />
    </div>

    <!-- Planilha -->
    <div class="cabecalho-planilha">
      <h3>Planilha por {{ NOMES_AGRUPAMENTO[agrupamento] }}</h3>
      <div class="botoes">
        <button @click="baixarResumo">Baixar planilha (resumo)</button>
        <button @click="baixarDetalhada">Baixar planilha (detalhada)</button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Período</th>
          <th class="num">Serviços</th>
          <th class="num">Faturamento</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in linhasComMovimento" :key="l.chave">
          <td data-label="Período">{{ l.rotuloCompleto }}</td>
          <td data-label="Serviços" class="num">{{ l.servicos }}</td>
          <td data-label="Faturamento" class="num">{{ moeda(l.faturamento) }}</td>
        </tr>
        <tr v-if="!linhasComMovimento.length">
          <td colspan="3" class="sem-dados">Nenhum serviço no período</td>
        </tr>
      </tbody>
      <tfoot v-if="linhasComMovimento.length">
        <tr>
          <td data-label="Total">Total</td>
          <td data-label="Serviços" class="num">{{ filtrados.length }}</td>
          <td data-label="Faturamento" class="num">{{ moeda(totalFaturamento) }}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Ranking de clientes (só quando não há cliente filtrada) -->
    <template v-if="!clienteId && rankingClientes.length">
      <h3>Clientes no período</h3>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th class="num">Serviços</th>
            <th class="num">Faturamento</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rankingClientes" :key="r.id">
            <td data-label="Cliente">{{ r.nome }}</td>
            <td data-label="Serviços" class="num">{{ r.servicos }}</td>
            <td data-label="Faturamento" class="num">{{ moeda(r.faturamento) }}</td>
            <td class="acoes"><button @click="clienteId = String(r.id)">Ver só ela</button></td>
          </tr>
        </tbody>
      </table>
    </template>

    <p class="nota">
      O faturamento usa o valor registrado em cada agendamento. Agendamentos cancelados não entram na conta.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import GraficoBarras, { type PontoGrafico } from './GraficoBarras.vue'
import { formatarTelefone } from '../utils/telefone'

type Agrupamento = 'dia' | 'semana' | 'mes'

const props = defineProps<{
  agendamentos: any[]
  clientes: any[]
}>()

const TZ = 'America/Sao_Paulo'
const NOMES_AGRUPAMENTO: Record<Agrupamento, string> = { dia: 'dia', semana: 'semana', mes: 'mês' }
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Data (AAAA-MM-DD) no fuso do salão
function diaLocal(data: string | Date) {
  return new Date(data).toLocaleDateString('en-CA', { timeZone: TZ })
}

function somarDias(dia: string, dias: number) {
  const d = new Date(`${dia}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

// Dia -> chave do período (semana começa na segunda)
function chavePeriodo(dia: string, agrup: Agrupamento) {
  if (agrup === 'dia') return dia
  if (agrup === 'mes') return dia.slice(0, 7)
  const diaDaSemana = (new Date(`${dia}T00:00:00Z`).getUTCDay() + 6) % 7
  return somarDias(dia, -diaDaSemana)
}

function proximoPeriodo(chave: string, agrup: Agrupamento) {
  if (agrup === 'dia') return somarDias(chave, 1)
  if (agrup === 'semana') return somarDias(chave, 7)
  const [ano = 0, mes = 0] = chave.split('-').map(Number)
  return mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, '0')}`
}

function rotulos(chave: string, agrup: Agrupamento) {
  const [ano = '', mes = '', dia = ''] = chave.split('-')
  if (agrup === 'mes') {
    const nome = MESES[Number(mes) - 1]
    return { rotulo: `${nome}/${ano.slice(2)}`, rotuloCompleto: `${nome}/${ano}` }
  }
  const curto = `${dia}/${mes}`
  if (agrup === 'dia') return { rotulo: curto, rotuloCompleto: `${curto}/${ano}` }
  const [anoFim, mesFim, diaFim] = somarDias(chave, 6).split('-')
  return { rotulo: curto, rotuloCompleto: `${curto} a ${diaFim}/${mesFim}/${anoFim}` }
}

const hoje = diaLocal(new Date())

const agrupamento = ref<Agrupamento>('mes')
const de = ref(`${chavePeriodo(somarDias(hoje, -150), 'mes')}-01`)
const ate = ref(hoje)
const clienteId = ref('')
const filtroStatus = ref<'confirmado' | 'ativos'>('confirmado')

const clientesOrdenadas = computed(() =>
  [...props.clientes].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')),
)

// Valor gravado no agendamento; o preço atual do serviço só cobre registros sem valor
function valor(ag: any) {
  return Number(ag.valor ?? ag.servicos?.preco) || 0
}

const filtrados = computed(() =>
  props.agendamentos
    .filter((ag) => {
      if (ag.status === 'cancelado') return false
      if (filtroStatus.value === 'confirmado' && ag.status !== 'confirmado') return false
      if (clienteId.value && String(ag.cliente_id) !== clienteId.value) return false
      const dia = diaLocal(ag.data_hora)
      return (!de.value || dia >= de.value) && (!ate.value || dia <= ate.value)
    })
    .sort((a, b) => a.data_hora.localeCompare(b.data_hora)),
)

const totalFaturamento = computed(() => filtrados.value.reduce((soma, ag) => soma + valor(ag), 0))
const totalClientes = computed(() => new Set(filtrados.value.map((ag) => ag.cliente_id)).size)

// Todos os períodos do intervalo, inclusive os sem movimento (aparecem como zero no gráfico)
const linhas = computed(() => {
  const agrup = agrupamento.value
  const mapa = new Map<string, { servicos: number; faturamento: number }>()

  if (de.value && ate.value && de.value <= ate.value) {
    const ultima = chavePeriodo(ate.value, agrup)
    for (let c = chavePeriodo(de.value, agrup); c <= ultima; c = proximoPeriodo(c, agrup)) {
      mapa.set(c, { servicos: 0, faturamento: 0 })
    }
  }

  for (const ag of filtrados.value) {
    const chave = chavePeriodo(diaLocal(ag.data_hora), agrup)
    const linha = mapa.get(chave) ?? { servicos: 0, faturamento: 0 }
    linha.servicos += 1
    linha.faturamento += valor(ag)
    mapa.set(chave, linha)
  }

  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, l]) => ({ chave, ...rotulos(chave, agrup), ...l }))
})

const linhasComMovimento = computed(() => linhas.value.filter((l) => l.servicos > 0))

const pontosServicos = computed<PontoGrafico[]>(() =>
  linhas.value.map((l) => ({ chave: l.chave, rotulo: l.rotulo, rotuloCompleto: l.rotuloCompleto, valor: l.servicos })),
)
const pontosFaturamento = computed<PontoGrafico[]>(() =>
  linhas.value.map((l) => ({ chave: l.chave, rotulo: l.rotulo, rotuloCompleto: l.rotuloCompleto, valor: l.faturamento })),
)

const rankingClientes = computed(() => {
  const mapa = new Map<string, { id: any; nome: string; servicos: number; faturamento: number }>()
  for (const ag of filtrados.value) {
    const chave = String(ag.cliente_id)
    const r = mapa.get(chave) ?? { id: ag.cliente_id, nome: ag.clientes?.nome || '-', servicos: 0, faturamento: 0 }
    r.servicos += 1
    r.faturamento += valor(ag)
    mapa.set(chave, r)
  }
  return [...mapa.values()].sort((a, b) => b.faturamento - a.faturamento || b.servicos - a.servicos)
})

function moeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function inteiro(v: number) {
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

// ---- Exportação (CSV com ";" e vírgula decimal, abre direto no Excel em português) ----

function celula(v: string | number) {
  const texto = typeof v === 'number' ? v.toFixed(2).replace('.', ',') : String(v ?? '')
  return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

function baixarCsv(nome: string, linhasCsv: (string | number)[][]) {
  const conteudo = '﻿' + linhasCsv.map((l) => l.map(celula).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

function sufixoArquivo() {
  const cliente = clienteId.value
    ? '_' + (props.clientes.find((c) => String(c.id) === clienteId.value)?.nome || 'cliente').replace(/\s+/g, '-')
    : ''
  return `${de.value}_a_${ate.value}${cliente}.csv`
}

function baixarResumo() {
  baixarCsv(`resumo-por-${agrupamento.value}_${sufixoArquivo()}`, [
    ['Período', 'Serviços', 'Faturamento (R$)'],
    ...linhas.value.map((l) => [l.rotuloCompleto, String(l.servicos), l.faturamento]),
    ['Total', String(filtrados.value.length), totalFaturamento.value],
  ])
}

function baixarDetalhada() {
  baixarCsv(`agendamentos_${sufixoArquivo()}`, [
    ['Data', 'Horário', 'Cliente', 'Telefone', 'Serviço', 'Status', 'Valor (R$)'],
    ...filtrados.value.map((ag) => {
      const d = new Date(ag.data_hora)
      return [
        d.toLocaleDateString('pt-BR', { timeZone: TZ }),
        d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
        ag.clientes?.nome || '',
        formatarTelefone(ag.clientes?.telefone),
        ag.servicos?.nome || '',
        ag.status,
        valor(ag),
      ]
    }),
  ])
}
</script>

<style scoped>
.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin: 1rem 0 1.25rem;
}
.filtros label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--texto-suave);
}
.filtros select,
.filtros input {
  min-width: 150px;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--borda);
  border-radius: 10px;
  background: var(--branco);
  color: var(--texto);
  font-size: 0.85rem;
  letter-spacing: normal;
  text-transform: none;
}
.indicadores {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.indicador {
  display: flex;
  flex-direction: column;
  padding: 0.9rem 1.1rem;
  background: var(--branco);
  border: 1px solid var(--borda);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
}
.indicador .rotulo {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--texto-suave);
}
.indicador strong {
  font-family: var(--fonte-titulo);
  font-size: 1.9rem;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.graficos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.cabecalho-planilha {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.cabecalho-planilha h3 {
  margin: 0;
}
.botoes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.botoes button,
td.acoes button {
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--dourado);
  border-radius: 999px;
  background: var(--branco);
  color: var(--dourado-escuro);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.botoes button:hover,
td.acoes button:hover {
  background: var(--dourado-claro);
}
table {
  width: 100%;
  margin-top: 0.75rem;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--branco);
  border: 1px solid var(--borda);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
  overflow: hidden;
}
th,
td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--borda);
}
th {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--texto-suave);
  background: var(--fundo);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
tbody tr:last-child td {
  border-bottom: none;
}
tfoot td {
  font-weight: 600;
  border-top: 1px solid var(--borda);
  border-bottom: none;
  background: var(--fundo);
}
td.acoes {
  text-align: right;
}
.sem-dados {
  text-align: center;
  color: var(--texto-suave);
}
.nota {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--texto-suave);
}

@media (max-width: 900px) {
  .indicadores {
    grid-template-columns: repeat(2, 1fr);
  }
  .graficos {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .filtros label {
    flex: 1 1 140px;
  }
  .filtros select,
  .filtros input {
    min-width: 0;
    width: 100%;
  }
  .indicador strong {
    font-size: 1.5rem;
  }
  thead {
    display: none;
  }
  table,
  tbody,
  tfoot,
  tr,
  td {
    display: block;
    width: 100%;
  }
  table {
    background: none;
    border: none;
    box-shadow: none;
    overflow: visible;
  }
  tr {
    margin-bottom: 0.6rem;
    padding: 0.5rem 1rem;
    background: var(--branco);
    border: 1px solid var(--borda);
    border-radius: 12px;
  }
  td,
  tfoot td {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.3rem 0;
    border: none;
    background: none;
    text-align: right;
  }
  td::before {
    content: attr(data-label);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--texto-suave);
  }
  td.acoes::before,
  td.sem-dados::before {
    content: none;
  }
  td.sem-dados {
    justify-content: center;
  }
}
</style>
