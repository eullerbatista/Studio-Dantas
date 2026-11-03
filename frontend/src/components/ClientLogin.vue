<template>
  <div class="login">
    <h1>{{ titulos[etapa] }}</h1>

    <!-- 1) Telefone: o backend diz se falta cadastro, criar senha ou digitar a senha -->
    <form v-if="etapa === 'telefone'" @submit.prevent="continuar">
      <label class="campo">
        <span>Telefone com DDD</span>
        <input
          v-model="telefone"
          type="tel"
          inputmode="numeric"
          autocomplete="username"
          placeholder="(11) 98765-4321"
          required
          @input="telefone = mascararTelefone(telefone)"
        />
      </label>
      <button type="submit" :disabled="enviando">Continuar</button>
    </form>

    <!-- 2) Senha -->
    <form v-else-if="etapa === 'senha'" @submit.prevent="entrar">
      <!-- Campo de usuário para o navegador salvar telefone + senha juntos -->
      <label class="campo">
        <span>Telefone</span>
        <input :value="telefone" type="tel" autocomplete="username" readonly class="somente-leitura" />
      </label>
      <label class="campo">
        <span>Senha</span>
        <input
          v-model="senha"
          type="password"
          autocomplete="current-password"
          required
          autofocus
        />
      </label>
      <button type="submit" :disabled="enviando">Entrar</button>
      <button type="button" class="voltar" @click="irPara('esqueci')">Esqueci minha senha</button>
      <button type="button" class="voltar" @click="recomecar">Usar outro telefone</button>
    </form>

    <!-- 3) Primeira vez deste telefone: cadastro completo -->
    <form v-else-if="etapa === 'cadastro'" @submit.prevent="registrar">
      <p class="info">Não encontramos cadastro para este telefone. Preencha seus dados para criar sua conta.</p>
      <label class="campo">
        <span>Telefone</span>
        <input :value="telefone" type="tel" autocomplete="username" readonly class="somente-leitura" />
      </label>
      <label class="campo">
        <span>Nome</span>
        <input v-model="nome" type="text" autocomplete="name" required />
      </label>
      <label class="campo">
        <span>Confirme o telefone</span>
        <input
          v-model="telefoneConfirmacao"
          type="tel"
          inputmode="numeric"
          required
          @input="telefoneConfirmacao = mascararTelefone(telefoneConfirmacao)"
        />
      </label>
      <label class="campo">
        <span>E-mail</span>
        <input v-model="email" type="email" autocomplete="email" required />
      </label>
      <label class="campo">
        <span>Crie uma senha (mín. 8 caracteres)</span>
        <input
          v-model="senha"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
        />
      </label>
      <label class="campo">
        <span>Confirme a senha</span>
        <input
          v-model="senhaConfirmacao"
          type="password"
          autocomplete="new-password"
          required
        />
      </label>
      <button type="submit" :disabled="enviando">Cadastrar</button>
      <button type="button" class="voltar" @click="recomecar">Usar outro telefone</button>
    </form>

    <!-- 4) Cliente cadastrada antes das senhas: cria a senha agora -->
    <form v-else-if="etapa === 'criarSenha'" @submit.prevent="criarSenha">
      <p class="info">
        Para proteger seus agendamentos, o acesso agora é feito com senha. Informe seu e-mail (usado
        caso você esqueça a senha) e crie sua senha.
      </p>
      <label class="campo">
        <span>Telefone</span>
        <input :value="telefone" type="tel" autocomplete="username" readonly class="somente-leitura" />
      </label>
      <label class="campo">
        <span>E-mail</span>
        <input v-model="email" type="email" autocomplete="email" required />
      </label>
      <label class="campo">
        <span>Crie uma senha (mín. 8 caracteres)</span>
        <input
          v-model="senha"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
        />
      </label>
      <label class="campo">
        <span>Confirme a senha</span>
        <input
          v-model="senhaConfirmacao"
          type="password"
          autocomplete="new-password"
          required
        />
      </label>
      <button type="submit" :disabled="enviando">Salvar e entrar</button>
      <button type="button" class="voltar" @click="recomecar">Usar outro telefone</button>
    </form>

    <!-- 5) Esqueci minha senha -->
    <form v-else-if="etapa === 'esqueci'" @submit.prevent="pedirRedefinicao">
      <template v-if="!mensagem">
        <p class="info">Informe o e-mail da sua conta. Enviaremos um link para criar uma nova senha.</p>
        <label class="campo">
          <span>E-mail</span>
          <input v-model="email" type="email" autocomplete="email" required />
        </label>
        <button type="submit" :disabled="enviando">Enviar link</button>
      </template>
      <p v-else class="sucesso" role="status">{{ mensagem }}</p>
      <button type="button" class="voltar" @click="recomecar">Voltar para o login</button>
    </form>

    <!-- 6) Link do e-mail (/redefinir-senha?token=...) -->
    <form v-else-if="etapa === 'redefinir'" @submit.prevent="redefinir">
      <label class="campo">
        <span>Nova senha (mín. 8 caracteres)</span>
        <input
          v-model="senha"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
          autofocus
        />
      </label>
      <label class="campo">
        <span>Confirme a nova senha</span>
        <input
          v-model="senhaConfirmacao"
          type="password"
          autocomplete="new-password"
          required
        />
      </label>
      <button type="submit" :disabled="enviando">Salvar nova senha</button>
      <button type="button" class="voltar" @click="recomecar">Voltar para o login</button>
    </form>

    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { mensagemDeErro } from '../services/api'
import { setSession } from '../composables/useAuth'
import { mascararTelefone } from '../utils/telefone'

type Etapa = 'telefone' | 'senha' | 'cadastro' | 'criarSenha' | 'esqueci' | 'redefinir'

const titulos: Record<Etapa, string> = {
  telefone: 'Login do Cliente',
  senha: 'Login do Cliente',
  cadastro: 'Primeiro acesso',
  criarSenha: 'Crie sua senha',
  esqueci: 'Esqueci minha senha',
  redefinir: 'Nova senha',
}

const route = useRoute()
const router = useRouter()

const tokenRedefinicao = typeof route.query.token === 'string' ? route.query.token : ''
// Tira o token da barra de endereço e do histórico depois de lido
if (tokenRedefinicao) router.replace({ name: 'RedefinirSenha' })

const etapa = ref<Etapa>(route.name === 'RedefinirSenha' && tokenRedefinicao ? 'redefinir' : 'telefone')
const telefone = ref('')
const telefoneConfirmacao = ref('')
const nome = ref('')
const email = ref('')
const senha = ref('')
const senhaConfirmacao = ref('')
const enviando = ref(false)
const erro = ref('')
const mensagem = ref('')

function irPara(proxima: Etapa) {
  etapa.value = proxima
  senha.value = ''
  senhaConfirmacao.value = ''
  erro.value = ''
  mensagem.value = ''
}

function recomecar() {
  irPara('telefone')
  telefoneConfirmacao.value = ''
  nome.value = ''
  if (route.name === 'RedefinirSenha') router.replace({ name: 'ClientLogin' })
}

function concluirLogin(data: any) {
  setSession(data.token, 'client', data.client)
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/servicos'
  router.push(redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/servicos')
}

function senhasConferem() {
  if (senha.value.length < 8) {
    erro.value = 'A senha precisa ter pelo menos 8 caracteres.'
    return false
  }
  if (senha.value !== senhaConfirmacao.value) {
    erro.value = 'As senhas informadas não conferem.'
    return false
  }
  return true
}

// Envia a requisição cuidando do estado "enviando" e da mensagem de erro
async function enviar(acao: () => Promise<void>, erroPadrao: string) {
  erro.value = ''
  enviando.value = true
  try {
    await acao()
  } catch (err) {
    erro.value = mensagemDeErro(err, erroPadrao)
  } finally {
    enviando.value = false
  }
}

function continuar() {
  return enviar(async () => {
    const res = await api.post('/auth/client/login', { telefone: telefone.value })
    if (res.data.needsRegistration) irPara('cadastro')
    else if (res.data.needsPasswordSetup) irPara('criarSenha')
    else irPara('senha')
  }, 'Erro ao realizar login. Tente novamente.')
}

function entrar() {
  return enviar(async () => {
    const res = await api.post('/auth/client/login', { telefone: telefone.value, senha: senha.value })
    concluirLogin(res.data)
  }, 'Erro ao realizar login. Tente novamente.')
}

function registrar() {
  erro.value = ''
  if (telefone.value.replace(/\D/g, '') !== telefoneConfirmacao.value.replace(/\D/g, '')) {
    erro.value = 'Os telefones informados não conferem.'
    return
  }
  if (!senhasConferem()) return

  return enviar(async () => {
    const res = await api.post('/auth/client/register', {
      telefone: telefone.value,
      telefoneConfirmacao: telefoneConfirmacao.value,
      nome: nome.value,
      email: email.value,
      senha: senha.value,
    })
    concluirLogin(res.data)
  }, 'Erro ao realizar cadastro. Tente novamente.')
}

function criarSenha() {
  erro.value = ''
  if (!senhasConferem()) return

  return enviar(async () => {
    const res = await api.post('/auth/client/setup-password', {
      telefone: telefone.value,
      email: email.value,
      senha: senha.value,
    })
    concluirLogin(res.data)
  }, 'Erro ao criar a senha. Tente novamente.')
}

function pedirRedefinicao() {
  return enviar(async () => {
    const res = await api.post('/auth/client/forgot-password', { email: email.value })
    mensagem.value = res.data.message
  }, 'Erro ao enviar o link. Tente novamente.')
}

function redefinir() {
  erro.value = ''
  if (!senhasConferem()) return

  return enviar(async () => {
    const res = await api.post('/auth/client/reset-password', {
      token: tokenRedefinicao,
      senha: senha.value,
    })
    concluirLogin(res.data)
  }, 'Erro ao salvar a nova senha. Tente novamente.')
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
.login h1 {
  margin: 0 0 1.25rem;
  font-size: 2rem;
  text-align: center;
}

.login input {
  display: block;
  width: 100%;
  margin-bottom: 0.8rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--borda-campo);
  border-radius: 10px;
  background: var(--fundo);
  color: var(--texto);
  transition: border-color 0.2s, background 0.2s;
}
.login input:focus {
  border-color: var(--dourado-escuro);
  background: var(--branco);
}
.campo {
  display: block;
  margin-bottom: 0.8rem;
}
.campo span {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.8rem;
  font-weight: 500;
}
.campo input {
  margin-bottom: 0;
}
.login input.somente-leitura {
  color: var(--texto-suave);
  cursor: default;
}
.login button {
  display: block;
  width: 100%;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 999px;
  background: var(--dourado);
  color: var(--texto);
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
  color: var(--branco);
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
.sucesso {
  font-size: 0.95rem;
  color: var(--texto);
  text-align: center;
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
