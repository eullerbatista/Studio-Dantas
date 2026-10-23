<template>
  <div class="admin-dashboard">
    <h2>Painel da Proprietária</h2>

    <!-- Abas -->
    <div class="tabs">
      <button :class="{ ativo: aba === 'agendamentos' }" @click="aba = 'agendamentos'">
        Agendamentos
      </button>
      <button :class="{ ativo: aba === 'clientes' }" @click="aba = 'clientes'">Clientes</button>
      <button :class="{ ativo: aba === 'servicos' }" @click="aba = 'servicos'">Serviços</button>
      <button :class="{ ativo: aba === 'analise' }" @click="aba = 'analise'">Análises</button>
    </div>

    <!-- Agendamentos -->
    <div v-if="aba === 'agendamentos'">
      <h3>Lista de Agendamentos</h3>
      <button class="btn-novo" @click="novoAgendamentoVisivel = true">+ Novo agendamento</button>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Telefone</th>
            <th>Serviço</th>
            <th>Data</th>
            <th>Confirmado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ag in agendamentos" :key="ag.id" :class="{ pendente: ag.status !== 'confirmado' }">
            <td data-label="Cliente">{{ ag.clientes?.nome }}</td>
            <td data-label="Telefone">{{ formatarTelefone(ag.clientes?.telefone) }}</td>
            <td data-label="Serviço">
              <div class="servico-info">
                {{ ag.servicos?.nome }}
                <p v-if="ag.observacoes?.trim()" class="observacao">
                  <span class="observacao-rotulo">Obs.:</span> {{ ag.observacoes }}
                </p>
              </div>
            </td>
            <td data-label="Data">{{ formatDate(ag.data_hora) }}</td>
            <td data-label="Confirmado">
              <span v-if="ag.status === 'cancelado'">Cancelado</span>
              <label v-else class="confirmar">
                <input
                  type="checkbox"
                  :checked="ag.status === 'confirmado'"
                  :disabled="salvandoStatus === ag.id"
                  @change="alterarConfirmacao(ag, ($event.target as HTMLInputElement).checked)"
                />
                {{ ag.status === 'confirmado' ? 'Sim' : 'Pendente' }}
              </label>
            </td>
            <td class="acoes">
              <button @click="abrirModal(ag)">Remarcar</button>
              <button @click="excluirAgendamento(ag.id)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Clientes -->
    <div v-if="aba === 'clientes'">
      <h3>Lista de Clientes</h3>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clientes" :key="c.id">
            <td data-label="Nome">{{ c.nome }}</td>
            <td data-label="Telefone">{{ formatarTelefone(c.telefone) }}</td>
            <td class="acoes">
              <button @click="editarCliente(c)">Editar</button>
              <button @click="excluirCliente(c.id)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Serviços -->
    <div v-if="aba === 'servicos'">
      <h3>Lista de Serviços</h3>
      <button class="btn-novo" @click="editarServico(null)">+ Novo serviço</button>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Duração</th>
            <th>Preço</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in servicos" :key="s.id" :class="{ desativado: s.ativo === false }">
            <td data-label="Nome">
              {{ s.nome }}
              <span v-if="s.ativo === false" class="selo-desativado">Desativado</span>
            </td>
            <td data-label="Categoria">{{ NOMES_CATEGORIAS[s.categoria] || '-' }}</td>
            <td data-label="Duração">{{ s.duracao_minutos ? `${s.duracao_minutos} min` : '-' }}</td>
            <td data-label="Preço">{{ s.preco ? Number(s.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-' }}</td>
            <td class="acoes">
              <button @click="editarServico(s)">Editar</button>
              <button v-if="s.ativo === false" @click="alterarAtivoServico(s, true)">Reativar</button>
              <button v-else @click="alterarAtivoServico(s, false)">Desativar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Análises -->
    <div v-if="aba === 'analise'">
      <h3>Análise de serviços e faturamento</h3>
      <AnaliseDashboard :agendamentos="agendamentos" :clientes="clientes" />
    </div>

    <!-- Modal -->
    <AgendamentoModal
      v-if="modalVisivel && agendamentoSelecionado"
      modo="editar"
      :servico="{ id: agendamentoSelecionado.servico_id, nome: agendamentoSelecionado.servicos?.nome }"
      @fechar="modalVisivel = false"
      @confirmar="atualizarAgendamento"
    />

    <NovoAgendamentoModal
      v-if="novoAgendamentoVisivel"
      :clientes="clientes"
      :servicos="servicos"
      @fechar="novoAgendamentoVisivel = false"
      @cliente-criada="(c) => clientes.push(c)"
      @salvo="agendamentoCriado"
    />

    <ClienteModal
      v-if="clienteSelecionado"
      :cliente="clienteSelecionado"
      @fechar="clienteSelecionado = null"
      @salvo="clienteSalvo"
    />

    <ServicoModal
      v-if="servicoModalVisivel"
      :servico="servicoSelecionado"
      @fechar="servicoModalVisivel = false"
      @salvo="servicoSalvo"
    />

    <!-- Feedback -->
    <div v-if="mensagem" class="toast">{{ mensagem }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api, { mensagemDeErro } from '../services/api'
import AgendamentoModal from '../components/AgendamentoModal.vue'
import AnaliseDashboard from '../components/AnaliseDashboard.vue'
import NovoAgendamentoModal from '../components/NovoAgendamentoModal.vue'
import ServicoModal, { type Servico } from '../components/ServicoModal.vue'
import ClienteModal, { type Cliente } from '../components/ClienteModal.vue'
import { formatarTelefone } from '../utils/telefone'

const NOMES_CATEGORIAS: Record<string, string> = {
  'maos-e-pes': 'Mãos & Pés',
  cabelos: 'Cabelos',
  'olhos-e-sobrancelhas': 'Olhos & Sobrancelhas',
}

const aba = ref<'agendamentos' | 'clientes' | 'servicos' | 'analise'>('agendamentos')
const agendamentos = ref<any[]>([])
const clientes = ref<any[]>([])
const servicos = ref<any[]>([])
const modalVisivel = ref(false)
const agendamentoSelecionado = ref<any | null>(null)
const mensagem = ref('')

async function executar(acao: () => Promise<void>, erroPadrao: string) {
  try {
    await acao()
  } catch (err) {
    exibirMensagem(mensagemDeErro(err, erroPadrao))
  }
}

async function fetchAgendamentos() {
  const res = await api.get('/agendamentos')
  agendamentos.value = res.data
}
async function fetchClientes() {
  const res = await api.get('/clientes')
  clientes.value = res.data
}
async function fetchServicos() {
  const res = await api.get('/servicos/todos')
  servicos.value = res.data
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function abrirModal(ag: any) {
  agendamentoSelecionado.value = ag
  modalVisivel.value = true
}

function atualizarAgendamento(dados: { data: string; horario: string }) {
  return executar(async () => {
    await api.put(`/agendamentos/${agendamentoSelecionado.value.id}`, {
      data: dados.data,
      horario: dados.horario,
    })
    modalVisivel.value = false
    await fetchAgendamentos()
    exibirMensagem('Agendamento atualizado com sucesso!')
  }, 'Erro ao atualizar agendamento')
}

// Agendamento feito pela proprietária (cliente pediu pessoalmente)
const novoAgendamentoVisivel = ref(false)

function agendamentoCriado() {
  novoAgendamentoVisivel.value = false
  exibirMensagem('Agendamento criado com sucesso!')
  return executar(fetchAgendamentos, 'Erro ao carregar agendamentos')
}

const salvandoStatus = ref<number | null>(null)

function alterarConfirmacao(ag: any, confirmado: boolean) {
  const anterior = ag.status
  ag.status = confirmado ? 'confirmado' : 'pendente'
  salvandoStatus.value = ag.id
  return executar(async () => {
    try {
      await api.put(`/agendamentos/${ag.id}`, { status: ag.status })
      exibirMensagem(confirmado ? 'Agendamento confirmado!' : 'Agendamento marcado como pendente')
    } catch (err) {
      ag.status = anterior
      throw err
    } finally {
      salvandoStatus.value = null
    }
  }, 'Erro ao alterar confirmação')
}

function excluirAgendamento(id: number) {
  return executar(async () => {
    await api.delete(`/agendamentos/${id}`)
    agendamentos.value = agendamentos.value.filter((a) => a.id !== id)
    exibirMensagem('Agendamento excluído com sucesso!')
  }, 'Erro ao excluir agendamento')
}

const clienteSelecionado = ref<Cliente | null>(null)

function editarCliente(c: Cliente) {
  clienteSelecionado.value = c
}

async function clienteSalvo(salvo: Cliente) {
  const i = clientes.value.findIndex((c) => c.id === salvo.id)
  if (i >= 0) clientes.value[i] = salvo
  clienteSelecionado.value = null
  exibirMensagem('Cliente atualizada com sucesso!')
  // A aba de agendamentos mostra nome e telefone da cliente
  await executar(fetchAgendamentos, 'Erro ao carregar agendamentos')
}
function excluirCliente(id: number) {
  return executar(async () => {
    await api.delete(`/clientes/${id}`)
    clientes.value = clientes.value.filter((c) => c.id !== id)
    exibirMensagem('Cliente excluído com sucesso!')
  }, 'Erro ao excluir cliente (ela pode ter agendamentos)')
}

const servicoModalVisivel = ref(false)
const servicoSelecionado = ref<Servico | null>(null)

function editarServico(s: Servico | null) {
  servicoSelecionado.value = s
  servicoModalVisivel.value = true
}

function servicoSalvo(salvo: Servico) {
  const i = servicos.value.findIndex((s) => s.id === salvo.id)
  if (i >= 0) servicos.value[i] = salvo
  else servicos.value.push(salvo)
  servicoModalVisivel.value = false
  exibirMensagem(i >= 0 ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!')
}
// Desativado continua na lista, para poder ser reativado depois
function alterarAtivoServico(s: any, ativo: boolean) {
  return executar(async () => {
    const res = ativo
      ? await api.post(`/servicos/${s.id}/reativar`)
      : await api.delete(`/servicos/${s.id}`)
    Object.assign(s, res.data)
    exibirMensagem(ativo ? 'Serviço reativado com sucesso!' : 'Serviço desativado com sucesso!')
  }, ativo ? 'Erro ao reativar serviço' : 'Erro ao desativar serviço')
}

function exibirMensagem(texto: string) {
  mensagem.value = texto
  setTimeout(() => {
    mensagem.value = ''
  }, 3000)
}

onMounted(() => {
  executar(fetchAgendamentos, 'Erro ao carregar agendamentos')
  executar(fetchClientes, 'Erro ao carregar clientes')
  executar(fetchServicos, 'Erro ao carregar serviços')
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}
.admin-dashboard h2 {
  font-size: 2.3rem;
  margin: 0 0 1.25rem;
}
.admin-dashboard h3 {
  font-size: 1.5rem;
  margin: 1.5rem 0 0.75rem;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tabs button {
  padding: 0.55rem 1.2rem;
  border: 1px solid var(--borda);
  border-radius: 999px;
  background: var(--branco);
  color: var(--texto);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.tabs button:hover {
  border-color: var(--dourado);
}
.tabs button.ativo {
  background: var(--dourado);
  border-color: var(--dourado);
  color: var(--branco);
}
table {
  width: 100%;
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
  padding: 0.8rem 1rem;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid var(--borda);
}
tbody tr:last-child td {
  border-bottom: none;
}
th {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--texto-suave);
  background: var(--fundo);
}
td.acoes button,
.btn-novo {
  margin: 2px 6px 2px 0;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--borda);
  border-radius: 999px;
  background: var(--branco);
  color: var(--texto);
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
td.acoes button:hover,
.btn-novo:hover {
  border-color: var(--dourado);
  color: var(--dourado-escuro);
}
.confirmar input {
  accent-color: var(--dourado);
}
tr.pendente td {
  background: #fdf8ea;
}
.confirmar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}
.btn-novo {
  margin-bottom: 1rem;
  border-color: var(--dourado);
  color: var(--dourado-escuro);
  font-weight: 600;
}
.observacao {
  margin: 0.3rem 0 0;
  padding: 0.35rem 0.6rem;
  max-width: 320px;
  background: var(--dourado-claro);
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.4;
  white-space: pre-line; /* mantém as quebras de linha digitadas pela cliente */
  overflow-wrap: anywhere;
}
.observacao-rotulo {
  font-weight: 600;
  color: var(--dourado-escuro);
}
tr.desativado td {
  color: #999;
}
.selo-desativado {
  margin-left: 0.4rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #eee;
  color: #666;
  font-size: 0.75rem;
}

/* Celular: cada linha vira um cartão, com o nome da coluna à esquerda */
@media (max-width: 700px) {
  .admin-dashboard {
    padding: 1rem;
  }
  .tabs {
    gap: 0.35rem;
  }
  .tabs button {
    flex: 1 1 40%;
    padding: 0.55rem 0.4rem;
    font-size: 0.66rem;
    letter-spacing: 0.06em;
  }
  thead {
    display: none;
  }
  table,
  tbody,
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
    margin-bottom: 0.75rem;
    padding: 0.6rem 1rem;
    background: var(--branco);
    border: 1px solid var(--borda);
    border-radius: 12px;
    box-shadow: var(--sombra);
  }
  tr.pendente {
    background: #fdf8ea;
  }
  tr.pendente td {
    background: none;
  }
  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.35rem 0;
    border: none;
    text-align: right;
  }
  td::before {
    content: attr(data-label);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--texto-suave);
    text-align: left;
  }
  .servico-info {
    text-align: right;
  }
  .observacao {
    max-width: none;
    text-align: left;
  }
  td.acoes {
    justify-content: flex-end;
    flex-wrap: wrap;
    padding-top: 0.6rem;
  }
  td.acoes::before {
    content: none;
  }
  td.acoes button {
    margin: 0;
    padding: 0.45rem 0.9rem;
  }
}
</style>
