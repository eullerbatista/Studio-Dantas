<template>
  <div class="modal-overlay">
    <form
      ref="modal"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profissional-titulo"
      tabindex="-1"
      @submit.prevent="salvar"
    >
      <h2 id="profissional-titulo">{{ profissional ? 'Editar profissional' : 'Nova profissional' }}</h2>

      <label>
        Nome
        <input v-model="form.nome" type="text" required minlength="2" maxlength="100" />
      </label>

      <label>
        E-mail da conta Google
        <input
          v-model="form.email"
          type="email"
          required
          maxlength="254"
          autocomplete="off"
          :disabled="profissional?.proprietaria"
        />
      </label>
      <p class="aviso">
        {{
          profissional?.proprietaria
            ? 'É o e-mail configurado no servidor (ADMIN_EMAIL).'
            : 'Ela entra no painel em “Entrar como profissional” com esta conta. No primeiro acesso, a Agenda Google dela é conectada.'
        }}
      </p>

      <fieldset class="servicos">
        <legend>Serviços que realiza</legend>
        <div v-for="grupo in grupos" :key="grupo.slug" class="grupo">
          <label class="opcao todos">
            <input
              type="checkbox"
              :checked="grupo.servicos.every((s) => form.servicos.includes(s.id))"
              :indeterminate.prop="
                grupo.servicos.some((s) => form.servicos.includes(s.id)) &&
                !grupo.servicos.every((s) => form.servicos.includes(s.id))
              "
              @change="marcarGrupo(grupo.servicos, ($event.target as HTMLInputElement).checked)"
            />
            {{ grupo.nome }} (todos)
          </label>
          <label v-for="s in grupo.servicos" :key="s.id" class="opcao">
            <input v-model="form.servicos" type="checkbox" :value="s.id" />
            {{ s.nome }}
            <span v-if="s.ativo === false" class="desativado">(desativado)</span>
          </label>
        </div>
        <p v-if="!grupos.length" class="aviso">Cadastre os serviços na aba Serviços.</p>
      </fieldset>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <div class="acoes">
        <button type="button" class="btn-cancelar" @click="emit('fechar')">Cancelar</button>
        <button type="submit" class="btn-confirmar" :disabled="enviando">Salvar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import api, { mensagemDeErro } from '@/services/api'
import { useDialogo } from '@/composables/useDialogo'

export interface Profissional {
  id: number
  nome: string
  email?: string
  proprietaria: boolean
  agenda_conectada: boolean
  servicos: number[]
}

const CATEGORIAS = [
  { slug: 'maos-e-pes', nome: 'Mãos & Pés' },
  { slug: 'cabelos', nome: 'Cabelos' },
  { slug: 'olhos-e-sobrancelhas', nome: 'Olhos & Sobrancelhas' },
]

type ServicoResumo = { id: number; nome: string; categoria: string | null; ativo?: boolean }

// null: cadastro de profissional nova
const props = defineProps<{ profissional: Profissional | null; servicos: ServicoResumo[] }>()

const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'salvo'): void
}>()

const modal = ref<HTMLElement | null>(null)
useDialogo(modal, () => emit('fechar'))

const form = reactive({
  nome: props.profissional?.nome ?? '',
  email: props.profissional?.email ?? '',
  servicos: [...(props.profissional?.servicos ?? [])],
})
const enviando = ref(false)
const erro = ref('')

// Serviços agrupados por categoria (sem categoria vão para "Outros")
const grupos = computed(() => {
  const lista = CATEGORIAS.map((c) => ({ ...c, servicos: props.servicos.filter((s) => s.categoria === c.slug) }))
  const outros = props.servicos.filter((s) => !CATEGORIAS.some((c) => c.slug === s.categoria))
  if (outros.length) lista.push({ slug: 'outros', nome: 'Outros', servicos: outros })
  return lista.filter((g) => g.servicos.length)
})

function marcarGrupo(servicos: ServicoResumo[], marcar: boolean) {
  const ids = servicos.map((s) => s.id)
  form.servicos = marcar
    ? [...new Set([...form.servicos, ...ids])]
    : form.servicos.filter((id) => !ids.includes(id))
}

async function salvar() {
  enviando.value = true
  erro.value = ''
  try {
    if (props.profissional) await api.put(`/profissionais/${props.profissional.id}`, form)
    else await api.post('/profissionais', form)
    emit('salvo')
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao salvar profissional')
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
label {
  display: block;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--texto-suave);
}
input[type='text'],
input[type='email'] {
  display: block;
  margin-top: 0.35rem;
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--borda-campo);
  border-radius: 10px;
  background: var(--fundo);
  color: var(--texto);
}
input[type='text']:focus,
input[type='email']:focus {
  border-color: var(--dourado-escuro);
  background: var(--branco);
}
input:disabled {
  opacity: 0.7;
}
.aviso {
  margin: -0.5rem 0 1rem;
  font-size: 0.75rem;
  color: var(--texto-suave);
}
.servicos {
  margin: 0;
  padding: 0;
  border: none;
}
.servicos legend {
  padding: 0;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--texto-suave);
}
.grupo {
  margin-bottom: 0.75rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--borda);
  border-radius: 10px;
}
.opcao {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.2rem 0;
  font-size: 0.85rem;
  letter-spacing: 0;
  color: var(--texto);
  cursor: pointer;
}
.opcao input {
  accent-color: var(--dourado-escuro);
}
.opcao.todos {
  font-weight: 600;
}
.desativado {
  color: var(--texto-suave);
  font-size: 0.75rem;
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
@media (max-width: 480px) {
  .modal {
    padding: 1.5rem 1.25rem;
  }
}
</style>
