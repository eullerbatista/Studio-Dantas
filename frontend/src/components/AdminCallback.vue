<template>
  <p class="aguarde" role="status">Entrando...</p>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { setSession, type Role } from '../composables/useAuth'

const router = useRouter()

// O backend redireciona para /admin/callback#token=... após o login com Google
onMounted(() => {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
  history.replaceState(null, '', window.location.pathname) // remove o token da URL

  if (!token) {
    router.replace({ name: 'AdminLogin', query: { erro: 'Login não concluído' } })
    return
  }

  // Só para a tela saber quem entrou; quem confere o token é o backend
  let dados: { role?: Role; profissional_id?: number; nome?: string } = {}
  try {
    const base64 = token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')
    dados = JSON.parse(decodeURIComponent(escape(atob(base64))))
  } catch {
    // token sem o formato esperado: entra como admin, o backend recusa se não for
  }

  const role = dados.role === 'profissional' ? 'profissional' : 'admin'
  setSession(token, role, null, { profissionalId: dados.profissional_id ?? null, nome: dados.nome || '' })
  router.replace({ name: 'AdminDashboard' })
})
</script>

<style scoped>
.aguarde {
  text-align: center;
  margin-top: 50px;
}
</style>
