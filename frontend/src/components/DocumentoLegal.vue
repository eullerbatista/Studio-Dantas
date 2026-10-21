<template>
  <article class="documento">
    <header>
      <h2>{{ titulo }}</h2>
      <p class="atualizacao">Última atualização: {{ atualizadoEm }}</p>
    </header>
    <slot />
  </article>
</template>

<script setup lang="ts">
defineProps<{
  titulo: string
  atualizadoEm: string
}>()
</script>

<style scoped>
.documento {
  max-width: 760px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
}
header {
  margin-bottom: 1.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--borda);
}
h2 {
  margin: 0 0 0.35rem;
  font-size: 2.3rem;
}
.atualizacao {
  margin: 0;
  font-size: 0.8rem;
  color: var(--texto-suave);
}
.documento :deep(h3) {
  margin: 1.75rem 0 0.5rem;
  font-size: 1.4rem;
}
.documento :deep(p),
.documento :deep(li) {
  color: var(--texto);
}
.documento :deep(ul) {
  padding-left: 1.25rem;
}
.documento :deep(li) {
  margin-bottom: 0.35rem;
}
.documento :deep(.destaque) {
  padding: 1rem 1.25rem;
  background: var(--dourado-claro);
  border-left: 3px solid var(--dourado);
  border-radius: 0 var(--raio) var(--raio) 0;
}

@media (max-width: 700px) {
  .documento {
    padding: 1.5rem 1rem 2rem;
  }
  h2 {
    font-size: 1.9rem;
  }
}
</style>
