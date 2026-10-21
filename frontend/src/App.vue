<template>
  <div class="layout">
    <Navbar />
    <main class="conteudo">
      <router-view />
    </main>
    <Rodape />
  </div>
</template>

<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import Rodape from '@/components/Rodape.vue'
</script>

<style scoped>
/* Rodapé sempre no fim da tela, mesmo em páginas curtas */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.conteudo {
  flex: 1;
}
</style>
