<template>
  <p class="aguarde">Entrando...</p>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { setSession } from '../composables/useAuth'

const router = useRouter()

// O backend redireciona para /admin/callback#token=... após o login com Google
onMounted(() => {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
  history.replaceState(null, '', window.location.pathname) // remove o token da URL

  if (!token) {
    router.replace({ name: 'AdminLogin', query: { erro: 'Login não concluído' } })
    return
  }

  setSession(token, 'admin')
  router.replace({ name: 'AdminDashboard' })
})
</script>

<style scoped>
.aguarde {
  text-align: center;
  margin-top: 50px;
}
</style>
