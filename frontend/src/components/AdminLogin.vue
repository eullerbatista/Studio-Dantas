<template>
  <div class="admin-login">
    <h1>Painel do Studio</h1>
    <p>Entre com a conta Google do studio para gerenciar a agenda.</p>
    <a :href="`${API_URL}/auth/google`" class="btn-google">Entrar com Google</a>

    <div class="equipe">
      <p>Faz parte da equipe? Entre com a conta Google que a proprietária cadastrou.</p>
      <a :href="`${API_URL}/auth/google?equipe=1`" class="btn-equipe">Entrar como profissional</a>
    </div>
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { API_URL } from '../services/api'

const route = useRoute()
const erro = computed(() => (typeof route.query.erro === 'string' ? route.query.erro : ''))
</script>

<style scoped>
.admin-login {
  max-width: 400px;
  margin: 3.5rem auto;
  padding: 2.5rem 2rem;
  background: var(--branco);
  border: 1px solid var(--borda);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
}
.admin-login h1 {
  margin: 0 0 1.25rem;
  font-size: 2rem;
  text-align: center;
}

.admin-login {
  text-align: center;
}
.admin-login p {
  color: var(--texto-suave);
}
.btn-google {
  display: inline-block;
  margin-top: 0.75rem;
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
.equipe {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--borda);
}
.equipe p {
  font-size: 0.85rem;
}
.btn-equipe {
  display: inline-block;
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--dourado-escuro);
  border-radius: 999px;
  color: var(--dourado-escuro);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.3s;
}
.btn-equipe:hover {
  background: var(--dourado-claro);
}
.btn-google:hover {
  background: var(--dourado-escuro);
  color: var(--branco);
}
.erro {
  color: #b3261e;
  margin-top: 1rem;
}

@media (max-width: 480px) {
  .admin-login {
    margin: 1.5rem auto;
    width: calc(100% - 32px);
    padding: 2rem 1.25rem;
  }
}
</style>
