<template>
  <div class="home">
    <!-- Login à direita -->
    <header class="header">
      <div class="login-box">
        <button @click="router.push('/login')" class="btn">Entrar</button>
      </div>
    </header>

    <!-- Botão de agendamentos + redes sociais à esquerda -->
    <section class="actions">
      <button @click="handleAgendamentos" class="btn-primary">Meus agendamentos</button>

      <!-- Social icons -->
      <div class="social">
        <a href="https://instagram.com/studiodantas" target="_blank">
          <img src="@/assets/icons/instagram.png" alt="Instagram" class="social-icon" />
        </a>
        <a href="https://wa.me/5514999999999" target="_blank">
          <img src="@/assets/icons/whatsapp.png" alt="WhatsApp" class="social-icon" />
        </a>
        <a href="https://maps.google.com/?q=Studio+Dantas+Marilia" target="_blank">
          <img src="@/assets/icons/maps.png" alt="Google Maps" class="social-icon" />
        </a>
      </div>
    </section>

    <main class="categorias">
      <h2>Escolha a categoria</h2>
      <div class="cards">
        <div class="card" @click="goTo('maos-e-pes')">
          <img src="@/assets/icons/nails.png" alt="Mãos & pés" class="card-icon" />
        </div>
        <div class="card" @click="goTo('cabelos')">
          <img src="@/assets/icons/hair.png" alt="Cabelos" class="card-icon" />
        </div>
        <div class="card" @click="goTo('olhos-e-sobrancelhas')">
          <img src="@/assets/icons/eyes.png" alt="Olhos & sobrancelhas" class="card-icon" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// O guard do router manda para o login quando a cliente não está autenticada
function handleAgendamentos() {
  router.push('/agendamentos')
}

function goTo(categoria: string) {
  router.push(`/servicos/${categoria}`)
}
</script>

<style scoped>
/* Ícones sociais menores */
.social-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.social-icon:hover {
  transform: scale(1.1);
}

/* Ícones das categorias maiores */
.card-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 0.5rem;
  object-fit: contain;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover .card-icon {
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.home {
  position: relative;
  padding-top: 120px;
  min-height: 100vh;
  background: url('@/assets/bg-salao.jpg') center/cover no-repeat;
  color: #333;
}

.header {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 3rem;
}

.login-box {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.btn,
.btn-primary {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn {
  background: #ccc;
}

.btn-primary {
  background: #d4af37;
  color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition:
    transform 0.2s,
    background 0.3s;
}

.btn-primary:hover {
  background: #c19a2e;
  transform: translateY(-2px);
}

.actions {
  margin: 2rem 2rem;
  text-align: left;
  padding-left: 3rem;
}

.social {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-start;
  gap: 1.5rem;
  font-size: 1.5rem;
}

.categorias {
  max-width: 600px;
  margin: 2rem 0 2rem 3rem;
  background: rgba(255, 255, 255, 0.85);
  padding: 2rem;
  border-radius: 12px;
}

.cards {
  display: flex;
  justify-content: flex-start;
  gap: 1rem;
  margin-top: 1rem;
}

.card {
  border: 1px solid #ddd;
  padding: 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.2s,
    background 0.3s;
  text-align: center;
  font-size: 1.1rem;
}

.card:hover {
  background-color: #fdf5e6;
  transform: translateY(-3px);
}
</style>
