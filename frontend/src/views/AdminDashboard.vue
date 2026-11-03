<template>
  <div class="admin-dashboard">
    <h1>{{ isAdmin ? 'Painel da Proprietária' : 'Painel da equipe' }}</h1>
    <p v-if="isProfissional && equipe?.nome" class="ola">Olá, {{ equipe.nome }}! Você vê a agenda de todas e altera os seus agendamentos.</p>

    <!-- Abas (serviços, equipe e análises só para a proprietária) -->
    <div class="tabs">
      <button :class="{ ativo: aba === 'agendamentos' }" :aria-pressed="aba === 'agendamentos'" @click="aba = 'agendamentos'">
        Agendamentos
      </button>
      <button :class="{ ativo: aba === 'clientes' }" :aria-pressed="aba === 'clientes'" @click="aba = 'clientes'">Clientes</button>
      <template v-if="isAdmin">
        <button :class="{ ativo: aba === 'servicos' }" :aria-pressed="aba === 'servicos'" @click="aba = 'servicos'">Serviços</button>
        <button :class="{ ativo: aba === 'equipe' }" :aria-pressed="aba === 'equipe'" @click="aba = 'equipe'">Equipe</button>
        <button :class="{ ativo: aba === 'analise' }" :aria-pressed="aba === 'analise'" @click="aba = 'analise'">Análises</button>
      </template>
    </div>

    <!-- Agendamentos -->
    <div v-if="aba === 'agendamentos'">
      <h2>Lista de Agendamentos</h2>
      <div class="barra">
        <button class="btn-novo" @click="novoAgendamentoVisivel = true">+ Novo agendamento</button>
        <label class="filtro">
          Profissional
          <select v-model="filtroProfissional">
            <option value="">Todas</option>
            <option v-for="p in profissionais" :key="p.id" :value="p.id">
              {{ p.id === equipe?.profissionalId ? `${p.nome} (eu)` : p.nome }}
            </option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Telefone</th>
            <th>Serviço</th>
            <th>Profissional</th>
            <th>Data</th>
            <th>Confirmado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ag in agendamentosFiltrados" :key="ag.id" :class="{ pendente: ag.status !== 'confirmado' }">
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
            <td data-label="Profissional">{{ ag.profissionais?.nome || '-' }}</td>
            <td data-label="Data">{{ formatDate(ag.data_hora) }}</td>
            <td data-label="Confirmado">
              <span v-if="ag.status === 'cancelado'">Cancelado</span>
              <span v-else-if="!podeAlterar(ag)">{{ ag.status === 'confirmado' ? 'Sim' : 'Pendente' }}</span>
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
              <!-- Nome no aria-label: no leitor de tela os botões das linhas não soam todos iguais -->
              <template v-if="podeAlterar(ag)">
                <button :aria-label="`Remarcar ${ag.clientes?.nome ?? 'agendamento'}, ${formatDate(ag.data_hora)}`" @click="abrirModal(ag)">Remarcar</button>
                <button :aria-label="`Excluir ${ag.clientes?.nome ?? 'agendamento'}, ${formatDate(ag.data_hora)}`" @click="excluirAgendamento(ag.id)">Excluir</button>
              </template>
              <span v-else class="so-leitura">De outra profissional</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!agendamentosFiltrados.length" class="vazio">Nenhum agendamento.</p>
    </div>

    <!-- Clientes -->
    <div v-if="aba === 'clientes'">
      <h2>Lista de Clientes</h2>
      <button v-if="isAdmin" class="btn-novo" @click="editarCliente(null)">+ Nova cliente</button>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th v-if="isAdmin">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clientes" :key="c.id">
            <td data-label="Nome">{{ c.nome }}</td>
            <td data-label="Telefone">{{ formatarTelefone(c.telefone) }}</td>
            <td v-if="isAdmin" class="acoes">
              <button :aria-label="`Editar ${c.nome}`" @click="editarCliente(c)">Editar</button>
              <button :aria-label="`Excluir ${c.nome}`" @click="excluirCliente(c.id)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Serviços -->
    <div v-if="aba === 'servicos' && isAdmin">
      <h2>Lista de Serviços</h2>
      <button class="btn-novo" @click="editarServico(null)">+ Novo serviço</button>
      <table>
        <thead>
          <tr>
            <th>Ícone</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Duração</th>
            <th>Preço</th>
            <th>Quem realiza</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in servicos" :key="s.id" :class="{ desativado: s.ativo === false }">
            <td data-label="Ícone">
              <img v-if="iconeDoServico(s)" :src="iconeDoServico(s)!.url" alt="" class="icone-servico" />
              <span v-else class="sem-icone">Sem ícone</span>
            </td>
            <td data-label="Nome">
              {{ s.nome }}
              <span v-if="s.ativo === false" class="selo-desativado">Desativado</span>
            </td>
            <td data-label="Categoria">{{ NOMES_CATEGORIAS[s.categoria] || '-' }}</td>
            <td data-label="Duração">{{ s.duracao_minutos ? `${s.duracao_minutos} min` : '-' }}</td>
            <td data-label="Preço">{{ s.preco ? Number(s.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-' }}</td>
            <td data-label="Quem realiza">
              <span v-if="nomesDasProfissionais(s).length">{{ nomesDasProfissionais(s).join(', ') }}</span>
              <span v-else class="sem-icone">Ninguém</span>
            </td>
            <td class="acoes">
              <button :aria-label="`Editar ${s.nome}`" @click="editarServico(s)">Editar</button>
              <button v-if="s.ativo === false" :aria-label="`Reativar ${s.nome}`" @click="alterarAtivoServico(s, true)">Reativar</button>
              <button v-else :aria-label="`Desativar ${s.nome}`" @click="alterarAtivoServico(s, false)">Desativar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Equipe -->
    <div v-if="aba === 'equipe' && isAdmin">
      <h2>Equipe</h2>
      <button class="btn-novo" @click="editarProfissional(null)">+ Nova profissional</button>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail Google</th>
            <th>Serviços</th>
            <th>Agenda Google</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in profissionais" :key="p.id">
            <td data-label="Nome">
              {{ p.nome }}
              <span v-if="p.proprietaria" class="selo-desativado">Proprietária</span>
            </td>
            <td data-label="E-mail Google">{{ p.email }}</td>
            <td data-label="Serviços">{{ resumoServicos(p) }}</td>
            <td data-label="Agenda Google">
              <span v-if="p.agenda_conectada">Conectada</span>
              <span v-else class="sem-icone">Aguardando o primeiro acesso</span>
            </td>
            <td class="acoes">
              <button :aria-label="`Editar ${p.nome}`" @click="editarProfissional(p)">Editar</button>
              <button v-if="!p.proprietaria" :aria-label="`Remover ${p.nome}`" @click="removerProfissional(p)">Remover</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="nota-equipe">
        Enquanto a profissional não entra no painel, os agendamentos dela vão para a sua Agenda Google, com o nome dela.
      </p>
    </div>

    <!-- Análises -->
    <div v-if="aba === 'analise' && isAdmin">
      <h2>Análise de serviços e faturamento</h2>
      <AnaliseDashboard :agendamentos="agendamentos" :clientes="clientes" :profissionais="profissionais" />
    </div>

    <!-- Modal -->
    <AgendamentoModal
      v-if="modalVisivel && agendamentoSelecionado"
      modo="editar"
      :servico="{ id: agendamentoSelecionado.servico_id, nome: agendamentoSelecionado.servicos?.nome }"
      :profissional-inicial="agendamentoSelecionado.profissional_id"
      :profissional-nome="agendamentoSelecionado.profissionais?.nome"
      :profissional-fixa="!isAdmin"
      @fechar="modalVisivel = false"
      @confirmar="atualizarAgendamento"
    />

    <NovoAgendamentoModal
      v-if="novoAgendamentoVisivel"
      :clientes="clientes"
      :servicos="servicos"
      :profissionais="profissionais"
      :profissional-fixa="isAdmin ? null : equipe?.profissionalId"
      @fechar="novoAgendamentoVisivel = false"
      @cliente-criada="(c) => clientes.push(c)"
      @salvo="agendamentoCriado"
    />

    <ClienteModal
      v-if="clienteModalVisivel"
      :cliente="clienteSelecionado"
      @fechar="clienteModalVisivel = false"
      @salvo="clienteSalvo"
    />

    <ServicoModal
      v-if="servicoModalVisivel"
      :servico="servicoSelecionado"
      :profissionais="profissionais"
      @fechar="servicoModalVisivel = false"
      @salvo="servicoSalvo"
    />

    <ProfissionalModal
      v-if="profissionalModalVisivel"
      :profissional="profissionalSelecionado"
      :servicos="servicos"
      @fechar="profissionalModalVisivel = false"
      @salvo="profissionalSalvo"
    />

    <!-- Feedback: a região de status existe sempre, para o leitor de tela anunciar o texto novo (WCAG 4.1.3) -->
    <div role="status">
      <div v-if="mensagem" class="toast">{{ mensagem }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import api, { mensagemDeErro } from '../services/api'
import AgendamentoModal from '../components/AgendamentoModal.vue'
import AnaliseDashboard from '../components/AnaliseDashboard.vue'
import NovoAgendamentoModal from '../components/NovoAgendamentoModal.vue'
import ServicoModal, { type Servico } from '../components/ServicoModal.vue'
import ClienteModal, { type Cliente } from '../components/ClienteModal.vue'
import ProfissionalModal, { type Profissional } from '../components/ProfissionalModal.vue'
import { useAuth } from '../composables/useAuth'
import { formatarTelefone } from '../utils/telefone'
import { iconeDoServico } from '../utils/iconesServicos'

const NOMES_CATEGORIAS: Record<string, string> = {
  'maos-e-pes': 'Mãos & Pés',
  cabelos: 'Cabelos',
  'olhos-e-sobrancelhas': 'Olhos & Sobrancelhas',
}

const { isAdmin, isProfissional, equipe } = useAuth()

const aba = ref<'agendamentos' | 'clientes' | 'servicos' | 'equipe' | 'analise'>('agendamentos')
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

const profissionais = ref<Profissional[]>([])
async function fetchEquipe() {
  const res = await api.get('/profissionais/equipe')
  profissionais.value = res.data
}

// A funcionária começa vendo só os dela; pode escolher "Todas"
const filtroProfissional = ref<number | ''>(isProfissional.value ? (equipe.value?.profissionalId ?? '') : '')
const agendamentosFiltrados = computed(() =>
  filtroProfissional.value === ''
    ? agendamentos.value
    : agendamentos.value.filter((a) => a.profissional_id === filtroProfissional.value),
)

// A proprietária altera todos; a funcionária, só os dela (o backend confere de novo)
function podeAlterar(ag: any) {
  return isAdmin.value || ag.profissional_id === equipe.value?.profissionalId
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

function atualizarAgendamento(dados: { data: string; horario: string; profissional_id: number }) {
  return executar(async () => {
    await api.put(`/agendamentos/${agendamentoSelecionado.value.id}`, {
      data: dados.data,
      horario: dados.horario,
      profissional_id: dados.profissional_id,
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

const clienteModalVisivel = ref(false)
const clienteSelecionado = ref<Cliente | null>(null)

function editarCliente(c: Cliente | null) {
  clienteSelecionado.value = c
  clienteModalVisivel.value = true
}

async function clienteSalvo(salvo: Cliente) {
  clienteModalVisivel.value = false
  const i = clientes.value.findIndex((c) => c.id === salvo.id)
  if (i < 0) {
    clientes.value.push(salvo)
    exibirMensagem('Cliente cadastrada com sucesso!')
    return
  }
  clientes.value[i] = salvo
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
  // "Quem realiza" muda os serviços de cada profissional
  return executar(fetchEquipe, 'Erro ao carregar a equipe')
}

function nomesDasProfissionais(s: any) {
  return profissionais.value.filter((p) => s.profissionais?.includes(p.id)).map((p) => p.nome)
}

const profissionalModalVisivel = ref(false)
const profissionalSelecionado = ref<Profissional | null>(null)

function editarProfissional(p: Profissional | null) {
  profissionalSelecionado.value = p
  profissionalModalVisivel.value = true
}

function profissionalSalvo() {
  const editando = !!profissionalSelecionado.value
  profissionalModalVisivel.value = false
  exibirMensagem(editando ? 'Profissional atualizada com sucesso!' : 'Profissional adicionada à equipe!')
  return executar(async () => {
    await Promise.all([fetchEquipe(), fetchServicos(), fetchAgendamentos()])
  }, 'Erro ao carregar a equipe')
}

function removerProfissional(p: Profissional) {
  if (!window.confirm(`Remover ${p.nome} da equipe? Ela perde o acesso ao painel.`)) return
  return executar(async () => {
    await api.delete(`/profissionais/${p.id}`)
    profissionais.value = profissionais.value.filter((x) => x.id !== p.id)
    exibirMensagem(`${p.nome} foi removida da equipe`)
    await fetchServicos()
  }, 'Erro ao remover profissional')
}

// Serviços de uma profissional, por nome (ou "Todos")
function resumoServicos(p: Profissional) {
  const ativos = servicos.value.filter((s) => s.ativo !== false)
  const dela = ativos.filter((s) => p.servicos.includes(s.id))
  if (!dela.length) return 'Nenhum'
  if (dela.length === ativos.length) return 'Todos'
  return dela.map((s) => s.nome).join(', ')
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
  executar(fetchEquipe, 'Erro ao carregar a equipe')
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}
.admin-dashboard h1 {
  font-size: 2.3rem;
  margin: 0 0 1.25rem;
}
.admin-dashboard h2 {
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
  color: var(--texto);
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
  font-size: 0.75rem;
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
  color: var(--texto-suave);
}
.icone-servico {
  display: block;
  width: 36px;
  height: 36px;
  object-fit: contain;
}
tr.desativado .icone-servico {
  opacity: 0.5;
}
.sem-icone {
  font-size: 0.75rem;
  color: var(--texto-suave);
}
.ola {
  margin: -0.75rem 0 1.25rem;
  color: var(--texto-suave);
}
.barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.barra .btn-novo {
  margin-bottom: 0;
}
.filtro {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--texto-suave);
}
.filtro select {
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--borda-campo);
  border-radius: 999px;
  background: var(--branco);
  color: var(--texto);
}
.so-leitura,
.vazio,
.nota-equipe {
  font-size: 0.8rem;
  color: var(--texto-suave);
}
.vazio {
  margin-top: 1rem;
  text-align: center;
}
.nota-equipe {
  margin-top: 0.75rem;
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
    font-size: 0.75rem;
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
    font-size: 0.75rem;
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
