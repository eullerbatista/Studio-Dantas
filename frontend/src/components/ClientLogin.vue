<template>
  <div class="login">
    <h2>{{ precisaRegistro ? 'Primeiro acesso' : 'Login do Cliente' }}</h2>

    <form v-if="!precisaRegistro" @submit.prevent="entrar">
      <input
        v-model="telefone"
        type="tel"
        inputmode="numeric"
        autocomplete="tel"
        placeholder="Telefone com DDD"
        required
        @input="telefone = mascararTelefone(telefone)"
      />
      <button type="submit" :disabled="enviando">Entrar</button>
    </form>

    <!-- Primeira vez deste telefone: pede nome e confirmação -->
    <form v-else @submit.prevent="registrar">
      <p class="info">
        Não encontramos cadastro para <strong>{{ telefone }}</strong>. Informe seu nome e confirme o
        telefone.
      </p>
      <input v-model="nome" type="text" autocomplete="name" placeholder="Seu nome" required />
      <input
        v-model="telefoneConfirmacao"
        type="tel"
        inputmode="numeric"
        placeholder="Confirme o telefone"
        required
        @input="telefoneConfirmacao = mascararTelefone(telefoneConfirmacao)"
        @paste.prevent
      />
      <button type="submit" :disabled="enviando">Cadastrar</button>
      <button type="button" class="voltar" @click="voltar">Usar outro telefone</button>
    </form>

    <p v-if="erro" class="erro">{{ erro }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { mensagemDeErro } from '../services/api'
import { setSession } from '../composables/useAuth'
import { mascararTelefone } from '../utils/telefone'

const route = useRoute()
const router = useRouter()

const telefone = ref('')
const telefoneConfirmacao = ref('')
const nome = ref('')
const precisaRegistro = ref(false)
const enviando = ref(false)
const erro = ref('')

function concluirLogin(data: any) {
  setSession(data.token, 'client', data.client)
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/servicos'
  router.push(redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/servicos')
}

async function entrar() {
  erro.value = ''
  enviando.value = true
  try {
    const res = await api.post('/auth/client/login', { telefone: telefone.value })
    if (res.data.needsRegistration) {
      precisaRegistro.value = true
      return
    }
    concluirLogin(res.data)
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao realizar login. Tente novamente.')
  } finally {
    enviando.value = false
  }
}

async function registrar() {
  erro.value = ''
  if (telefone.value.replace(/\D/g, '') !== telefoneConfirmacao.value.replace(/\D/g, '')) {
    erro.value = 'Os telefones informados não conferem.'
    return
  }

  enviando.value = true
  try {
    const res = await api.post('/auth/client/register', {
      telefone: telefone.value,
      telefoneConfirmacao: telefoneConfirmacao.value,
      nome: nome.value,
    })
    concluirLogin(res.data)
  } catch (err) {
    erro.value = mensagemDeErro(err, 'Erro ao realizar cadastro. Tente novamente.')
  } finally {
    enviando.value = false
  }
}

function voltar() {
  precisaRegistro.value = false
  telefoneConfirmacao.value = ''
  nome.value = ''
  erro.value = ''
}
</script>

<style scoped>
.login {
  max-width: 380px;
  margin: 3.5rem auto;
  padding: 2.5rem 2rem;
  background: var(--branco);
  border: 1px solid var(--borda);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
}
.login h2 {
  margin: 0 0 1.25rem;
  font-size: 2rem;
  text-align: center;
}

.login input {
  display: block;
  width: 100%;
  margin-bottom: 0.8rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--borda);
  border-radius: 10px;
  background: var(--fundo);
  color: var(--texto);
  transition: border-color 0.2s, background 0.2s;
}
.login input:focus {
  outline: none;
  border-color: var(--dourado);
  background: var(--branco);
}
.login button {
  display: block;
  width: 100%;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 999px;
  background: var(--dourado);
  color: var(--branco);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.3s;
}
.login button:hover {
  background: var(--dourado-escuro);
}
.login button:disabled {
  opacity: 0.6;
  cursor: wait;
}
.login button.voltar {
  margin-top: 0.5rem;
  background: transparent;
  color: var(--texto-suave);
}
.login button.voltar:hover {
  color: var(--dourado-escuro);
}
.info {
  font-size: 0.9rem;
  color: var(--texto-suave);
  margin: 0 0 1rem;
}
.erro {
  color: #b3261e;
  text-align: center;
  margin: 1rem 0 0;
}

@media (max-width: 480px) {
  .login {
    margin: 1.5rem auto;
    width: calc(100% - 32px);
    padding: 2rem 1.25rem;
  }
}
</style>
