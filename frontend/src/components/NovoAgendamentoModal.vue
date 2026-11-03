<template>
  <div class="modal-overlay">
    <form class="modal" ref="modal" role="dialog" aria-modal="true" aria-labelledby="novo-agendamento-titulo" tabindex="-1" @submit.prevent="confirmar">
      <h2 id="novo-agendamento-titulo">Novo agendamento</h2>

      <label>
        Cliente
        <select v-model="clienteId" required>
          <option :value="null" disabled>Selecione a cliente</option>
          <option :value="NOVA">+ Nova cliente</option>
          <option v-for="c in clientesOrdenadas" :key="c.id" :value="c.id">
            {{ c.nome }} · {{ formatarTelefone(c.telefone) }}
          </option>
        </select>
      </label>

      <template v-if="clienteId === NOVA">
        <label>
          Nome
          <input v-model="novaCliente.nome" type="text" required minlength="2" maxlength="100" />
        </label>
        <label>
          Telefone
          <input
            v-model="novaCliente.telefone"
            type="tel"
            required
            placeholder="(11) 98765-4321"
            @input="novaCliente.telefone = mascararTelefone(novaCliente.telefone)"
          />
        </label>
        <p class="aviso">No primeiro acesso pelo site, ela entra com este telefone e cria a senha.</p>
      </template>

      <label>
        Serviço
        <select v-model="servicoId" required>
          <option :value="null" disabled>Selecione o serviço</option>
          <option v-for="s in servicosAtivos" :key="s.id" :value="s.id">{{ s.nome }}</option>
        </select>
      </label>

      <label v-if="!profissionalFixa">
        Profissional
        <select v-model="profissionalId" required :disabled="!servicoId">
          <option :value="null" disabled>
            {{ servicoId && !profissionaisDoServico.length ? 'Ninguém realiza este serviço' : 'Selecione a profissional' }}
          </option>
          <option v-for="p in profissionaisDoServico" :key="p.id" :value="p.id">{{ p.nome }}</option>
        </select>
      </label>

      <label>
        Data
        <input v-model="data" type="date" :min="hoje" required />
      </label>

      <p v-if="!servicoId || !profissionalId || !data" class="aviso">
        Escolha o serviço, {{ profissionalFixa ? '' : 'a profissional ' }}e a data para ver os horários.
      </p>
      <p v-else-if="carregando" class="aviso" role="status">Carregando horários...</p>
      <p v-else-if="fechado" class="aviso">O salão não abre aos domingos e segundas. Escolha outra data.</p>
      <p v-else-if="horariosDisponiveis.length === 0" class="aviso">Nenhum horário livre nesta data.</p>
      <div class="horarios" role="group" aria-label="Horários disponíveis">
        <button
          v-for="hora in horariosDisponiveis"
          :key="hora"
          type="button"
          :class="{ ativo: hora === horario }"
          :aria-pressed="hora === horario"
          @click="horario = hora"
        >
          {{ hora }}
        </button>
      </div>

      <label>
        Observações
        <textarea v-model="observacoes" maxlength="500" placeholder="Opcional" />
      </label>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <div class="acoes">
        <button type="button" class="btn-cancelar" @click="emit('fechar')">Cancelar</button>
        <button type="submit" class="btn-confirmar" :disabled="enviando">Agendar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import api, { mensagemDeErro } from '@/services/api'
import { formatarTelefone, mascararTelefone } from '@/utils/telefone'
import { useDialogo } from '@/composables/useDialogo'
import type { Cliente } from './ClienteModal.vue'
import type { Profissional } from './ProfissionalModal.vue'

// Valor do <select> que indica cadastro de cliente nova
const NOVA = 'nova'

const props = defineProps<{
  clientes: Cliente[]
  servicos: { id: number; nome: string; ativo?: boolean }[]
  profissionais: Profissional[]
  // Funcionária agenda só para ela mesma (id dela); a proprietária escolhe
  profissionalFixa?: number | null
}>()

const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'clienteCriada', cliente: Cliente): void
  (e: 'salvo'): void
}>()

const modal = ref<HTMLElement | null>(null)
useDialogo(modal, () => emit('fechar'))

const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

const clientesOrdenadas = computed(() =>
  [...props.clientes].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')),
)
const servicosAtivos = computed(() => {
  const ativos = props.servicos.filter((s) => s.ativo !== false)
  if (!props.profissionalFixa) return ativos
  const meus = props.profissionais.find((p) => p.id === props.profissionalFixa)?.servicos || []
  return ativos.filter((s) => meus.includes(s.id))
})

const clienteId = ref<number | typeof NOVA | null>(null)
const novaCliente = reactive({ nome: '', telefone: '' })
const servicoId = ref<number | null>(null)
const profissionalId = ref<number | null>(props.profissionalFixa ?? null)
const profissionaisDoServico = computed(() =>
  props.profissionais.filter((p) => servicoId.value && p.servicos.includes(servicoId.value)),
)

// Trocou o serviço: mantém a profissional só se ela também faz o novo; se só uma faz, já escolhe
watch(servicoId, () => {
  if (props.profissionalFixa) return
  const lista = profissionaisDoServico.value
  if (!lista.some((p) => p.id === profissionalId.value)) profissionalId.value = null
  if (!profissionalId.value && lista.length === 1) profissionalId.value = lista[0]!.id
})
const data = ref('')
const horario = ref('')
const observacoes = ref('')
const horariosDisponiveis = ref<string[]>([])
const fechado = ref(false)
const carregando = ref(false)
const enviando = ref(false)
const erro = ref('')

async function carregarHorarios() {
  horario.value = ''
  horariosDisponiveis.value = []
  fechado.value = false
  const [dia, servico, profissional] = [data.value, servicoId.value, profissionalId.value]
  if (!dia || !servico || !profissional) return

  carregando.value = true
  try {
    const res = await api.get('/calendar/availability', {
      params: { date: dia, servico_id: servico, profissional_id: profissional },
    })
    // Ignora respostas antigas se ela trocou a data, o serviço ou a profissional no meio
    if (dia === data.value && servico === servicoId.value && profissional === profissionalId.value) {
      horariosDisponiveis.value = res.data.horarios || []
      fechado.value = res.data.fechado === true
    }
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao buscar horários disponíveis')
  } finally {
    carregando.value = false
  }
}

watch([data, servicoId, profissionalId], () => {
  erro.value = ''
  carregarHorarios()
})

async function confirmar() {
  if (!horario.value) {
    erro.value = 'Selecione um horário!'
    return
  }

  enviando.value = true
  erro.value = ''
  try {
    if (clienteId.value === NOVA) {
      const res = await api.post('/clientes', novaCliente)
      emit('clienteCriada', res.data)
      // Se o agendamento falhar, uma nova tentativa não recadastra a cliente
      clienteId.value = res.data.id
    }

    await api.post('/agendamentos', {
      cliente_id: clienteId.value,
      servico_id: servicoId.value,
      profissional_id: profissionalId.value,
      data: data.value,
      horario: horario.value,
      observacoes: observacoes.value || undefined,
    })
    emit('salvo')
  } catch (err: any) {
    erro.value = mensagemDeErro(err, 'Erro ao salvar agendamento')
    if (err?.response?.status === 409 && err.config?.url === '/agendamentos') carregarHorarios()
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
  width: 460px;
  max-width: 100%;
  max-height: 100%;
  overflow-y: auto;
}
.modal h2 {
  text-align: center;
  font-size: 1.9rem;
  margin: 0 0 1.25rem;
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

label {
  display: block;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--texto-suave);
}
input,
select,
textarea {
  display: block;
  margin-top: 0.35rem;
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--borda-campo);
  border-radius: 10px;
  background: var(--fundo);
  color: var(--texto);
}
input:focus,
select:focus,
textarea:focus {
  border-color: var(--dourado-escuro);
  background: var(--branco);
}
textarea {
  min-height: 70px;
  resize: vertical;
}

.aviso {
  font-size: 0.8rem;
  color: var(--texto-suave);
  margin: -0.5rem 0 1rem;
}
.horarios {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}
.horarios:empty {
  display: none;
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
