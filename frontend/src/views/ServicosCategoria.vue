<template>
  <div class="servicos">
    <h1>{{ tituloCategoria }}</h1>

    <p v-if="sucesso" class="sucesso">
      {{ sucesso }} <router-link to="/agendamentos">Ver meus agendamentos</router-link>
    </p>

    <p v-if="carregando" class="aviso">Carregando serviços...</p>
    <p v-else-if="erro" class="erro">{{ erro }}</p>
    <div v-else-if="servicos.length > 0" class="servicos-grid">
      <div class="servico-card" v-for="servico in servicos" :key="servico.id">
        <img v-if="iconeDoServico(servico.nome)" :src="iconeDoServico(servico.nome)" alt="" class="servico-icone" />
        <h2>{{ servico.nome }}</h2>
        <p v-if="servico.descricao" class="descricao">{{ servico.descricao }}</p>
        <p class="detalhe">
          <span v-if="servico.duracao_minutos">{{ servico.duracao_minutos }} min</span>
          <span v-if="servico.duracao_minutos && servico.preco" class="separador">·</span>
          <span v-if="servico.preco" class="preco">{{ formatarPreco(servico.preco) }}</span>
        </p>
        <button @click="abrirAgendamento(servico)" class="btn-primary">Agendar</button>
      </div>
    </div>
    <div v-else>
      <p class="aviso">Nenhum serviço encontrado para esta categoria.</p>
    </div>

    <!-- Modal de agendamento -->
    <AgendamentoModal
      v-if="modalAberto && servicoSelecionado"
      :servico="servicoSelecionado"
      @fechar="modalAberto = false"
      @confirmar="confirmarAgendamento"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AgendamentoModal from '@/components/AgendamentoModal.vue'
import api, { mensagemDeErro } from '@/services/api'

interface Servico {
  id: number
  nome: string
  descricao?: string
  duracao_minutos?: number
  preco?: number
}

// Ícones de assets/servicos, escolhidos pelo nome do serviço (o primeiro termo que bater vence)
const ICONES: [string, string][] = [
  ['alongamento', new URL('@/assets/servicos/alongamento.png', import.meta.url).href],
  ['spa', new URL('@/assets/servicos/spa-pes.png', import.meta.url).href],
  ['pedicure', new URL('@/assets/servicos/pedicure.png', import.meta.url).href],
  ['manicure', new URL('@/assets/servicos/manicure.png', import.meta.url).href],
  ['gel', new URL('@/assets/servicos/gel.png', import.meta.url).href],
  ['corte', new URL('@/assets/servicos/corte.svg', import.meta.url).href],
  ['escova', new URL('@/assets/servicos/escova.svg', import.meta.url).href],
  ['progressiva', new URL('@/assets/servicos/progressiva.svg', import.meta.url).href],
  ['selante', new URL('@/assets/servicos/selante.svg', import.meta.url).href],
  ['tintura', new URL('@/assets/servicos/tintura.svg', import.meta.url).href],
  ['coloracao', new URL('@/assets/servicos/tintura.svg', import.meta.url).href],
  ['sobrancelha', new URL('@/assets/servicos/sobrancelha.svg', import.meta.url).href],
  ['cilios', new URL('@/assets/servicos/cilios.svg', import.meta.url).href],
]

function formatarPreco(valor: number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function iconeDoServico(nome: string) {
  const n = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return ICONES.find(([termo]) => n.includes(termo))?.[1]
}

const route = useRoute()
const categoria = computed(() => route.params.categoria as string)

const servicos = ref<Servico[]>([])
const carregando = ref(false)
const erro = ref('')
const sucesso = ref('')

async function carregarServicos() {
  carregando.value = true
  erro.value = ''
  try {
    const res = await api.get('/servicos', { params: { categoria: categoria.value } })
    servicos.value = res.data
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao carregar serviços')
  } finally {
    carregando.value = false
  }
}

watch(categoria, carregarServicos, { immediate: true })

const tituloCategoria = computed(() => {
  switch (categoria.value) {
    case 'maos-e-pes':
      return 'Serviços de Mãos & Pés'
    case 'cabelos':
      return 'Serviços de Cabelos'
    case 'olhos-e-sobrancelhas':
      return 'Serviços de Olhos & Sobrancelhas'
    default:
      return 'Serviços'
  }
})

const modalAberto = ref(false)
const servicoSelecionado = ref<Servico | null>(null)

function abrirAgendamento(servico: Servico) {
  sucesso.value = ''
  servicoSelecionado.value = servico
  modalAberto.value = true
}

function confirmarAgendamento(dados: { data: string; horario: string }) {
  modalAberto.value = false
  const [ano, mes, dia] = dados.data.split('-')
  sucesso.value = `Agendamento confirmado para ${dia}/${mes}/${ano} às ${dados.horario}!`
}
</script>

<style scoped>
.servicos {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

h1 {
  text-align: center;
  font-size: 2.6rem;
  margin: 0 0 2.5rem;
}

/* Traço dourado sob o título */
h1::after {
  content: '';
  display: block;
  width: 56px;
  height: 2px;
  margin: 0.9rem auto 0;
  background: var(--dourado);
}

.servicos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 2rem;
  justify-items: center;
}

.servico-card {
  width: 100%;
  max-width: 360px;
  padding: 2rem 1.5rem;
  text-align: center;
  background: var(--branco);
  border: 1px solid var(--borda);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.servico-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(74, 52, 38, 0.12);
}

.servico-card h2 {
  margin: 0.8rem 0 0.5rem;
  font-family: var(--fonte-texto);
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.btn-primary {
  margin-top: 0.6rem;
  padding: 0.75rem 1.8rem;
  border: none;
  border-radius: 999px;
  background: var(--dourado);
  color: var(--branco);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: var(--dourado-escuro);
}

.servico-icone {
  display: block;
  height: 96px;
  max-width: 100%;
  margin: 0 auto 0.5rem;
  object-fit: contain;
}

.descricao {
  color: var(--texto-suave);
  margin: 0 0 0.6rem;
}

.detalhe {
  margin: 0 0 1rem;
  color: var(--texto-suave);
  font-size: 0.9rem;
}

.separador {
  margin: 0 0.5rem;
  color: var(--dourado);
}

.preco {
  color: var(--texto);
  font-weight: 600;
}

.aviso {
  text-align: center;
  color: var(--texto-suave);
}

.sucesso {
  max-width: 720px;
  margin: 0 auto 2rem;
  padding: 0.9rem 1.2rem;
  border: 1px solid #cfe5d2;
  border-radius: 12px;
  background: #eef7ef;
  color: #2e6b37;
  text-align: center;
}

.erro {
  text-align: center;
  color: #b3261e;
}

@media (max-width: 600px) {
  .servicos {
    padding: 1.75rem 1rem;
  }
  h1 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }
  .servicos-grid {
    gap: 1.25rem;
  }
}
</style>
