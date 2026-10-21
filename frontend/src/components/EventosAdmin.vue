<template>
  <div class="painel-eventos">
    <h2>Agendamentos futuros</h2>

    <!-- Filtros -->
    <div class="filtros">
      <input type="date" v-model="filtroData" />
      <select v-model="filtroServico">
        <option value="">Todos os serviços</option>
        <option v-for="servico in servicosUnicos" :key="servico" :value="servico">
          {{ servico }}
        </option>
      </select>
    </div>

    <!-- Tabela -->
    <table v-if="eventosFiltrados.length" class="tabela-eventos">
      <thead>
        <tr>
          <th>Serviço</th>
          <th>Cliente</th>
          <th>Telefone</th>
          <th>Data</th>
          <th>Horário</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="evento in eventosPaginados" :key="evento.id">
          <td>{{ evento.resumo }}</td>
          <td>{{ extrairCliente(evento.descricao).nome }}</td>
          <td>{{ extrairCliente(evento.descricao).telefone }}</td>
          <td>{{ formatarData(evento.inicio) }}</td>
          <td>{{ formatarHora(evento.inicio) }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else>Nenhum agendamento encontrado.</p>

    <!-- Paginação -->
    <div v-if="totalPaginas > 1" class="paginacao">
      <button @click="paginaAtual--" :disabled="paginaAtual === 1">Anterior</button>
      <span>Página {{ paginaAtual }} de {{ totalPaginas }}</span>
      <button @click="paginaAtual++" :disabled="paginaAtual === totalPaginas">Próxima</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const eventos = ref<any[]>([])
const filtroData = ref('')
const filtroServico = ref('')
const paginaAtual = ref(1)
const itensPorPagina = 10

onMounted(async () => {
  try {
    const res = await api.get('/api/calendar/events')
    eventos.value = res.data.eventos || []
  } catch (err) {
    console.error('Erro ao carregar eventos:', err)
  }
})

// Lista de serviços únicos
const servicosUnicos = computed(() => {
  const nomes = eventos.value.map((e) => e.resumo)
  return [...new Set(nomes)]
})

// Eventos filtrados
const eventosFiltrados = computed(() => {
  return eventos.value.filter((e) => {
    const dataOk = filtroData.value
      ? new Date(e.inicio).toISOString().startsWith(filtroData.value)
      : true
    const servicoOk = filtroServico.value ? e.resumo === filtroServico.value : true
    return dataOk && servicoOk
  })
})

// Paginação
const totalPaginas = computed(() => Math.ceil(eventosFiltrados.value.length / itensPorPagina))

const eventosPaginados = computed(() => {
  const start = (paginaAtual.value - 1) * itensPorPagina
  const end = start + itensPorPagina
  return eventosFiltrados.value.slice(start, end)
})

// Funções auxiliares
function formatarData(dateTime: string) {
  return new Date(dateTime).toLocaleDateString('pt-BR')
}
function formatarHora(dateTime: string) {
  return new Date(dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function extrairCliente(descricao: string) {
  const nomeMatch = descricao?.match(/Cliente:\s(.+?)\s-/)
  const telMatch = descricao?.match(/Telefone:\s(.+)/)
  return {
    nome: nomeMatch ? nomeMatch[1] : 'Não informado',
    telefone: telMatch ? telMatch[1] : 'Não informado',
  }
}
</script>

<style scoped>
.painel-eventos {
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
}
.filtros {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.tabela-eventos {
  width: 100%;
  border-collapse: collapse;
}
.tabela-eventos th,
.tabela-eventos td {
  border: 1px solid #ddd;
  padding: 0.8rem;
  text-align: center;
}
.tabela-eventos th {
  background: #d4af37;
  color: #fff;
}
.paginacao {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.paginacao button {
  background: #d4af37;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  cursor: pointer;
}
.paginacao button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
