<template>
  <div class="modal-overlay">
    <div class="modal" ref="modal" role="dialog" aria-modal="true" aria-labelledby="agendamento-titulo" tabindex="-1">
      <h2 id="agendamento-titulo">{{ servico.nome }}</h2>
      <p>Escolha quem vai atender, a data e o horário</p>

      <!-- Profissional: a cliente escolhe; a funcionária remarca só com ela mesma -->
      <p v-if="profissionalFixa" class="com-quem">Com {{ profissionalNome }}</p>
      <label v-else class="campo">
        Profissional
        <select v-model="profissionalId" class="input-date" :disabled="carregandoProfissionais">
          <option :value="null" disabled>
            {{ carregandoProfissionais ? 'Carregando...' : 'Escolha a profissional' }}
          </option>
          <option v-for="p in profissionais" :key="p.id" :value="p.id">{{ p.nome }}</option>
        </select>
      </label>
      <p v-if="!profissionalFixa && !carregandoProfissionais && !profissionais.length" class="erro" role="alert">
        Nenhuma profissional realiza este serviço no momento.
      </p>

      <!-- Campo de data -->
      <label class="campo">
        Data
        <input type="date" v-model="data" :min="hoje" class="input-date" :disabled="!profissionalId" />
      </label>

      <!-- Lista de horários -->
      <p v-if="carregando" role="status">Carregando horários...</p>
      <p v-else-if="data && fechado">O salão não abre aos domingos e segundas. Escolha outra data.</p>
      <p v-else-if="data && horariosDisponiveis.length === 0">Nenhum horário livre nesta data.</p>
      <div class="horarios" role="group" aria-label="Horários disponíveis">
        <button
          v-for="hora in horariosDisponiveis"
          type="button"
          :key="hora"
          :class="{ ativo: hora === horario }"
          :aria-pressed="hora === horario"
          @click="horario = hora"
        >
          {{ hora }}
        </button>
      </div>

      <textarea
        v-if="modo === 'criar'"
        v-model="observacoes"
        class="input-obs"
        placeholder="Observações (opcional)"
        aria-label="Observações (opcional)"
        maxlength="500"
      />

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <!-- Ações -->
      <div class="acoes">
        <button @click="emit('fechar')" class="btn-cancelar">Cancelar</button>
        <button @click="confirmar" class="btn-confirmar" :disabled="enviando">Confirmar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import api, { mensagemDeErro } from '@/services/api'
import { useDialogo } from '@/composables/useDialogo'

// Props tipados
const props = withDefaults(
  defineProps<{
    servico: { id: number; nome: string }
    // 'criar': cliente agenda; 'editar': a equipe escolhe novo horário e o pai salva
    modo?: 'criar' | 'editar'
    // Remarcar: profissional atual; fixa quando a funcionária remarca o próprio agendamento
    profissionalInicial?: number | null
    profissionalFixa?: boolean
    profissionalNome?: string
  }>(),
  { modo: 'criar', profissionalInicial: null, profissionalFixa: false, profissionalNome: '' },
)

// Eventos tipados
const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'confirmar', dados: { data: string; horario: string; profissional_id: number; agendamento?: any }): void
}>()

const modal = ref<HTMLElement | null>(null)
useDialogo(modal, () => emit('fechar'))

// Data de hoje no fuso do navegador (YYYY-MM-DD)
const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

// Estado local
const data = ref('')
const horario = ref('')
const observacoes = ref('')
const horariosDisponiveis = ref<string[]>([])
const fechado = ref(false)
const carregando = ref(false)
const enviando = ref(false)
const erro = ref('')

// Quem realiza este serviço
const profissionais = ref<{ id: number; nome: string }[]>([])
const profissionalId = ref<number | null>(props.profissionalInicial)
const carregandoProfissionais = ref(!props.profissionalFixa)

async function carregarProfissionais() {
  try {
    const res = await api.get('/profissionais', { params: { servico_id: props.servico.id } })
    profissionais.value = res.data
    // Remarcando com quem não faz mais o serviço: mantém a atual na lista
    if (props.profissionalInicial && !res.data.some((p: any) => p.id === props.profissionalInicial)) {
      profissionais.value.unshift({ id: props.profissionalInicial, nome: props.profissionalNome || 'Atual' })
    }
    // Só uma faz o serviço: já vem escolhida
    if (!profissionalId.value && res.data.length === 1) profissionalId.value = res.data[0].id
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao carregar as profissionais')
  } finally {
    carregandoProfissionais.value = false
  }
}

onMounted(() => {
  if (!props.profissionalFixa) carregarProfissionais()
})

async function carregarHorarios(dia: string) {
  horario.value = ''
  horariosDisponiveis.value = []
  fechado.value = false
  const profissional = profissionalId.value
  if (!dia || !profissional) return

  carregando.value = true
  try {
    const res = await api.get('/calendar/availability', {
      params: { date: dia, servico_id: props.servico.id, profissional_id: profissional },
    })
    // Ignora respostas antigas se ela trocou a data ou a profissional no meio
    if (dia === data.value && profissional === profissionalId.value) {
      horariosDisponiveis.value = res.data.horarios || []
      fechado.value = res.data.fechado === true
    }
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao buscar horários disponíveis')
  } finally {
    carregando.value = false
  }
}

// Carrega horários disponíveis do backend (Google Calendar + agendamentos)
watch([data, profissionalId], () => {
  erro.value = ''
  carregarHorarios(data.value)
})

// Função de confirmação
async function confirmar() {
  if (!profissionalId.value) {
    erro.value = 'Escolha a profissional!'
    return
  }
  if (!data.value || !horario.value) {
    erro.value = 'Selecione data e horário!'
    return
  }

  const escolha = { data: data.value, horario: horario.value, profissional_id: profissionalId.value }
  if (props.modo === 'editar') {
    emit('confirmar', escolha)
    return
  }

  enviando.value = true
  erro.value = ''
  try {
    const res = await api.post('/agendamentos', {
      servico_id: props.servico.id,
      ...escolha,
      observacoes: observacoes.value || undefined,
    })
    emit('confirmar', { ...escolha, agendamento: res.data })
  } catch (err: any) {
    erro.value = mensagemDeErro(err, 'Erro ao salvar agendamento')
    // Horário foi ocupado por outra pessoa: recarrega a lista
    if (err?.response?.status === 409) carregarHorarios(data.value)
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(46, 38, 48, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
}
.modal {
  background: var(--branco);
  color: var(--texto);
  padding: 2rem;
  border-radius: var(--raio);
  box-shadow: 0 20px 50px rgba(46, 38, 48, 0.25);
  width: 420px;
  max-width: 100%;
  max-height: 100%;
  overflow-y: auto;
}
.modal h2 {
  text-align: center;
  font-size: 1.9rem;
  margin: 0 0 0.25rem;
}
.acoes {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.25rem;
}
.btn-cancelar,
.btn-confirmar {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.3s, color 0.3s, border-color 0.3s;
}
.btn-cancelar {
  background: transparent;
  border: 1px solid var(--borda);
  color: var(--texto-suave);
}
.btn-cancelar:hover {
  border-color: var(--texto-suave);
  color: var(--texto);
}
.btn-confirmar {
  background: var(--dourado);
  border: 1px solid var(--dourado);
  color: var(--texto);
}
.btn-confirmar:hover {
  background: var(--dourado-escuro);
  color: var(--branco);
  border-color: var(--dourado-escuro);
}
.btn-confirmar:disabled {
  opacity: 0.6;
  cursor: wait;
}
.erro {
  color: #b3261e;
  margin: 0.75rem 0 0;
}

.modal {
  text-align: center;
}
.modal > p:not(.erro) {
  color: var(--texto-suave);
  margin: 0 0 1.25rem;
}
.input-date,
.input-obs {
  display: block;
  margin-bottom: 1rem;
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--borda-campo);
  border-radius: 10px;
  background: var(--fundo);
  color: var(--texto);
}
.campo {
  display: block;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--texto-suave);
}
.campo .input-date {
  margin-top: 0.35rem;
  font-size: 15px;
}
.input-date:disabled {
  opacity: 0.6;
}
.modal > p.com-quem {
  color: var(--texto);
  font-weight: 600;
}
.input-date:focus,
.input-obs:focus {
  border-color: var(--dourado-escuro);
  background: var(--branco);
}
.input-obs {
  min-height: 70px;
  resize: vertical;
}
.horarios {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}
.horarios button {
  min-width: 72px;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--borda);
  border-radius: 999px;
  background: var(--branco);
  color: var(--texto);
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}
.horarios button:hover {
  border-color: var(--dourado);
}
.horarios button.ativo {
  background: var(--dourado);
  border-color: var(--dourado);
  color: var(--texto);
}
@media (max-width: 480px) {
  .modal {
    padding: 1.5rem 1.25rem;
  }
}
</style>
