<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api, { mensagemDeErro } from '../services/api'
import { useAuth } from '../composables/useAuth'

const { cliente } = useAuth()
const agendamentos = ref<any[]>([])
const loading = ref(false)
const erro = ref('')

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchAgendamentos() {
  loading.value = true
  try {
    const res = await api.get('/agendamentos/me')
    agendamentos.value = res.data
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao carregar agendamentos.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAgendamentos)
</script>

<template>
  <div class="agendamentos-view">
    <h2>Meus Agendamentos</h2>
    <p v-if="cliente">Olá, {{ cliente.nome }}!</p>

    <div v-if="loading">Carregando agendamentos...</div>
    <div v-else-if="agendamentos.length === 0 && !erro">
      Nenhum agendamento encontrado. <router-link to="/servicos">Agendar um serviço</router-link>
    </div>

    <ul v-else>
      <li v-for="ag in agendamentos" :key="ag.id">
        <strong>{{ ag.servicos?.nome }}</strong> - {{ formatDate(ag.data_hora) }}
        <span v-if="ag.status === 'cancelado'"> (cancelado)</span>
        <span v-else-if="ag.status === 'confirmado'"> (confirmado)</span>
        <span v-else> (aguardando confirmação)</span>
      </li>
    </ul>

    <p v-if="erro" class="erro">{{ erro }}</p>
  </div>
</template>

<style scoped>
.agendamentos-view {
  max-width: 640px;
  margin: 3.5rem auto;
  padding: 2.5rem 2rem;
  background: var(--branco);
  border: 1px solid var(--borda);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
}
.agendamentos-view h2 {
  margin: 0 0 1.25rem;
  font-size: 2rem;
  text-align: left;
}

.agendamentos-view p {
  color: var(--texto-suave);
}
ul {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
}
li {
  margin: 0.6rem 0;
  padding: 0.9rem 1.1rem;
  border: 1px solid var(--borda);
  border-left: 3px solid var(--dourado);
  border-radius: 10px;
  background: var(--fundo);
}
.erro {
  color: #b3261e;
  text-align: center;
  margin-top: 10px;
}

@media (max-width: 480px) {
  .agendamentos-view {
    margin: 1.5rem auto;
    width: calc(100% - 32px);
    padding: 2rem 1.25rem;
  }
}
</style>
