<template>
  <div class="layout">
    <!-- Atalho de teclado para pular o menu (WCAG 2.4.1) -->
    <a href="#conteudo" class="pular" @click.prevent="irParaConteudo">Pular para o conteúdo</a>
    <Navbar />
    <main id="conteudo" class="conteudo" tabindex="-1">
      <router-view />
    </main>
    <Rodape />
  </div>
</template>

<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import Rodape from '@/components/Rodape.vue'

// Sem mudar o endereço: o vue-router trataria o #conteudo como navegação
function irParaConteudo() {
  document.getElementById('conteudo')?.focus()
}
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
/* Só aparece ao receber foco pelo Tab */
.pular {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 100;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  background: var(--texto);
  color: var(--branco);
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-200%);
}
.pular:focus {
  transform: none;
}
</style>
