<template>
  <div class="modal-overlay">
    <form class="modal" @submit.prevent="salvar">
      <h2>{{ servico?.id ? 'Editar serviço' : 'Novo serviço' }}</h2>

      <label>
        Nome
        <input v-model="form.nome" type="text" required maxlength="100" />
      </label>

      <label>
        Categoria
        <select v-model="form.categoria" required>
          <option v-for="c in CATEGORIAS" :key="c.slug" :value="c.slug">{{ c.nome }}</option>
        </select>
      </label>

      <label>
        Descrição
        <textarea v-model="form.descricao" maxlength="300" />
      </label>

      <div class="linha">
        <label>
          Duração (min)
          <input v-model.number="form.duracao_minutos" type="number" min="5" max="600" step="5" required />
        </label>
        <label>
          Preço (R$)
          <input v-model="form.preco" type="number" min="0" step="0.01" placeholder="Opcional" />
        </label>
      </div>

      <p v-if="erro" class="erro">{{ erro }}</p>

      <div class="acoes">
        <button type="button" class="btn-cancelar" @click="emit('fechar')">Cancelar</button>
        <button type="submit" class="btn-confirmar" :disabled="enviando">Salvar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import api, { mensagemDeErro } from '@/services/api'

export interface Servico {
  id?: number
  nome: string
  categoria: string | null
  descricao: string | null
  duracao_minutos: number | null
  preco: number | null
}

const CATEGORIAS = [
  { slug: 'maos-e-pes', nome: 'Mãos & Pés' },
  { slug: 'cabelos', nome: 'Cabelos' },
  { slug: 'olhos-e-sobrancelhas', nome: 'Olhos & Sobrancelhas' },
]

const props = defineProps<{ servico: Servico | null }>()

const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'salvo', servico: Servico): void
}>()

const form = reactive({
  nome: props.servico?.nome ?? '',
  categoria: props.servico?.categoria ?? 'maos-e-pes',
  descricao: props.servico?.descricao ?? '',
  duracao_minutos: props.servico?.duracao_minutos ?? 60,
  preco: props.servico?.preco ?? ('' as number | string),
})
const enviando = ref(false)
const erro = ref('')

async function salvar() {
  enviando.value = true
  erro.value = ''
  try {
    const res = props.servico?.id
      ? await api.put(`/servicos/${props.servico.id}`, form)
      : await api.post('/servicos', form)
    emit('salvo', res.data)
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao salvar serviço')
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
  color: var(--branco);
}
.btn-confirmar:hover {
  background: var(--dourado-escuro);
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
  border: 1px solid var(--borda);
  border-radius: 10px;
  background: var(--fundo);
  color: var(--texto);
}
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--dourado);
  background: var(--branco);
}
textarea {
  min-height: 70px;
  resize: vertical;
}

.linha {
  display: flex;
  gap: 1rem;
}
.linha label {
  flex: 1;
}
</style>
