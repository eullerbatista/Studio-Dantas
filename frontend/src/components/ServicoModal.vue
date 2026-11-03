<template>
  <div class="modal-overlay">
    <form class="modal" ref="modal" role="dialog" aria-modal="true" aria-labelledby="servico-titulo" tabindex="-1" @submit.prevent="salvar">
      <h2 id="servico-titulo">{{ servico?.id ? 'Editar serviço' : 'Novo serviço' }}</h2>

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

      <fieldset class="icones">
        <legend>Ícone <span class="opcional">(opcional)</span></legend>
        <div class="icones-grade">
          <label class="icone-opcao">
            <input v-model="form.icone" type="radio" name="icone" :value="null" />
            <span class="icone-caixa">
              <img v-if="iconeAutomatico" :src="iconeAutomatico.url" alt="" />
              <span v-else aria-hidden="true">Auto</span>
            </span>
            Automático
          </label>
          <label class="icone-opcao">
            <input v-model="form.icone" type="radio" name="icone" :value="SEM_ICONE" />
            <span class="icone-caixa"><span aria-hidden="true">—</span></span>
            Sem ícone
          </label>
          <label v-if="imagemPropria" class="icone-opcao">
            <input v-model="form.icone" type="radio" name="icone" :value="imagemPropria" />
            <span class="icone-caixa"><img :src="imagemPropria" alt="" /></span>
            Da galeria
          </label>
          <label class="icone-opcao">
            <input type="file" accept="image/*" :disabled="preparandoImagem" @change="escolherImagem" />
            <span class="icone-caixa icone-enviar"><span aria-hidden="true">+</span></span>
            {{ preparandoImagem ? 'Carregando...' : imagemPropria ? 'Trocar imagem' : 'Escolher da galeria' }}
          </label>
          <label v-for="i in ICONES_SERVICOS" :key="i.chave" class="icone-opcao">
            <input v-model="form.icone" type="radio" name="icone" :value="i.chave" />
            <span class="icone-caixa"><img :src="i.url" alt="" /></span>
            {{ i.nome }}
          </label>
        </div>
        <p class="dica">No automático, o ícone acompanha o nome do serviço (ex.: "Manicure").</p>
      </fieldset>

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

      <fieldset v-if="profissionais.length" class="quem">
        <legend>Quem realiza</legend>
        <label v-for="p in profissionais" :key="p.id" class="opcao">
          <input v-model="form.profissionais" type="checkbox" :value="p.id" />
          {{ p.nome }}
        </label>
        <p v-if="!form.profissionais.length" class="dica">Sem ninguém marcado, as clientes não conseguem agendar.</p>
      </fieldset>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <div class="acoes">
        <button type="button" class="btn-cancelar" @click="emit('fechar')">Cancelar</button>
        <button type="submit" class="btn-confirmar" :disabled="enviando || preparandoImagem">Salvar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import api, { mensagemDeErro } from '@/services/api'
import { useDialogo } from '@/composables/useDialogo'
import {
  ICONES_SERVICOS,
  SEM_ICONE,
  ehImagemPropria,
  iconeDoServico,
  prepararImagem,
} from '@/utils/iconesServicos'

export interface Servico {
  id?: number
  nome: string
  categoria: string | null
  descricao: string | null
  duracao_minutos: number | null
  preco: number | null
  // Chave de ICONES_SERVICOS, SEM_ICONE, imagem da galeria (data URL) ou null (automático pelo nome)
  icone?: string | null
  // Ids das profissionais que realizam o serviço
  profissionais?: number[]
}

const CATEGORIAS = [
  { slug: 'maos-e-pes', nome: 'Mãos & Pés' },
  { slug: 'cabelos', nome: 'Cabelos' },
  { slug: 'olhos-e-sobrancelhas', nome: 'Olhos & Sobrancelhas' },
]

const props = withDefaults(
  defineProps<{ servico: Servico | null; profissionais?: { id: number; nome: string; proprietaria: boolean }[] }>(),
  { profissionais: () => [] },
)

const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'salvo', servico: Servico): void
}>()

const modal = ref<HTMLElement | null>(null)
useDialogo(modal, () => emit('fechar'))

const form = reactive({
  nome: props.servico?.nome ?? '',
  categoria: props.servico?.categoria ?? 'maos-e-pes',
  descricao: props.servico?.descricao ?? '',
  duracao_minutos: props.servico?.duracao_minutos ?? 60,
  preco: props.servico?.preco ?? ('' as number | string),
  icone: props.servico?.icone ?? (null as string | null),
  // Serviço novo já vem marcado para a proprietária
  profissionais: props.servico?.profissionais ?? props.profissionais.filter((p) => p.proprietaria).map((p) => p.id),
})

// Prévia da opção "Automático" com o nome digitado
const iconeAutomatico = computed(() => iconeDoServico({ nome: form.nome }))
const enviando = ref(false)
const erro = ref('')

// Imagem da galeria já salva no serviço ou recém-escolhida
const imagemPropria = ref(ehImagemPropria(props.servico?.icone) ? props.servico.icone : '')
const preparandoImagem = ref(false)

async function escolherImagem(e: Event) {
  const campo = e.target as HTMLInputElement
  const arquivo = campo.files?.[0]
  campo.value = '' // permite escolher o mesmo arquivo de novo
  if (!arquivo) return

  erro.value = ''
  preparandoImagem.value = true
  try {
    imagemPropria.value = await prepararImagem(arquivo)
    form.icone = imagemPropria.value
  } catch (err) {
    erro.value = err instanceof Error ? err.message : 'Não foi possível usar esta imagem'
  } finally {
    preparandoImagem.value = false
  }
}

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

.linha {
  display: flex;
  gap: 1rem;
}
.linha label {
  flex: 1;
}

.icones {
  margin: 0 0 1rem;
  padding: 0;
  border: none;
}
.icones legend {
  padding: 0;
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--texto-suave);
}
.opcional {
  font-weight: 400;
}
.icones-grade {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 0.5rem;
}
.icone-opcao {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0;
  text-align: center;
  line-height: 1.2;
  color: var(--texto);
  cursor: pointer;
}
/* O rádio fica invisível, mas continua acessível pelo teclado e leitor de tela */
.icone-opcao input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  opacity: 0;
}
.icone-caixa {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border: 2px solid var(--borda);
  border-radius: 12px;
  background: var(--fundo);
  color: var(--texto-suave);
  font-size: 0.75rem;
  transition: border-color 0.2s, background 0.2s;
}
.icone-caixa img {
  max-width: 44px;
  max-height: 44px;
  object-fit: contain;
}
.icone-enviar {
  border-style: dashed;
  font-size: 1.6rem;
  font-weight: 300;
}
.icone-opcao:hover .icone-caixa {
  border-color: var(--dourado);
}
.icone-opcao input:checked + .icone-caixa {
  border-color: var(--dourado-escuro);
  background: var(--dourado-claro);
}
.icone-opcao input:focus-visible + .icone-caixa {
  outline: 2px solid var(--dourado-escuro);
  outline-offset: 2px;
}
.quem {
  margin: 0 0 1rem;
  padding: 0;
  border: none;
}
.quem legend {
  padding: 0;
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--texto-suave);
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
  display: inline-block;
  width: auto;
  margin: 0;
  accent-color: var(--dourado-escuro);
}
.dica {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--texto-suave);
}
</style>
