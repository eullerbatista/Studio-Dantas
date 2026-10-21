<template>
  <footer class="rodape">
    <nav class="links" aria-label="Informações legais">
      <router-link to="/privacidade">Política de Privacidade</router-link>
      <span aria-hidden="true">·</span>
      <router-link to="/termos">Termos de Uso</router-link>
    </nav>
    <p>© {{ ano }} Studio Dantas · Lash Beauty</p>
    <p class="academico">
      Projeto Integrador em Computação II (DRP07 – Turma 001) · Univesp
    </p>
  </footer>
</template>

<script setup lang="ts">
const ano = new Date().getFullYear()
</script>

<style scoped>
.rodape {
  padding: 1.5rem 1rem;
  border-top: 1px solid var(--borda);
  background: var(--branco);
  text-align: center;
  font-size: 0.78rem;
  color: var(--texto-suave);
}
.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.links a {
  color: var(--texto);
  text-decoration: none;
  font-weight: 500;
}
.links a:hover {
  color: var(--dourado-escuro);
  text-decoration: underline;
}
p {
  margin: 0.15rem 0;
}
.academico {
  font-size: 0.72rem;
}
</style>
