<template>
  <nav class="navbar">
    <div class="navbar-left">
      <img :src="logo" alt="Studio Dantas Lash Beauty" class="logo" />
    </div>

    <!-- Contatos: sempre visíveis, inclusive no celular -->
    <div class="navbar-social">
      <a :href="WHATSAPP_URL" target="_blank" rel="noopener" class="social" aria-label="WhatsApp" title="WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path
            transform="translate(7.4 7.4) scale(0.38)"
            stroke-width="4"
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          />
        </svg>
      </a>
      <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" class="social" aria-label="Instagram" title="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      </a>
      <a :href="MAPS_URL" target="_blank" rel="noopener" class="social" aria-label="Localização no Google Maps" title="Como chegar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </a>
    </div>

    <!-- Botão do menu no celular -->
    <button
      class="menu-toggle"
      :class="{ aberto: menuAberto }"
      :aria-expanded="menuAberto"
      aria-label="Abrir menu"
      @click="menuAberto = !menuAberto"
    >
      <span></span><span></span><span></span>
    </button>

    <div class="navbar-links" :class="{ aberto: menuAberto }">
      <router-link to="/servicos" class="link">Serviços</router-link>
      <router-link v-if="!isAdmin" to="/agendamentos" class="link">Meus agendamentos</router-link>
      <router-link v-if="isAdmin" to="/dashboard" class="link">Painel</router-link>
      <router-link v-if="!isAuthenticated" to="/login" class="link">Entrar</router-link>
      <a v-else href="#" class="link" @click.prevent="sair">Sair</a>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
// Versão do logo.svg com os textos em curvas (não depende das fontes instaladas)
// e uma só camada dourada: a sombra em 3 camadas embaçava o logo em tamanho pequeno
import logo from '@/assets/logo-curvas.svg'
import { INSTAGRAM_URL, MAPS_URL, WHATSAPP_URL } from '@/config/contato'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, isAdmin, logout } = useAuth()

const menuAberto = ref(false)

// Fecha o menu do celular ao trocar de página
watch(() => route.fullPath, () => {
  menuAberto.value = false
})

function sair() {
  const eraAdmin = isAdmin.value
  menuAberto.value = false
  logout()
  router.push(eraAdmin ? '/admin' : '/')
}
</script>

<style scoped>
.navbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--branco);
  padding: 14px 40px;
  border-bottom: 1px solid var(--borda);
  box-shadow: 0 2px 14px rgba(74, 52, 38, 0.05);
  z-index: 20;
}

.logo {
  height: 72px;
  display: block;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-left: auto;
}

/* Ícones à direita dos links, separados por um fio */
.navbar-social {
  order: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 24px;
  padding-left: 20px;
  border-left: 1px solid var(--borda);
}

.social {
  display: flex;
  padding: 8px;
  border-radius: 50%;
  color: var(--texto);
  transition: color 0.2s, background 0.2s;
}

.social:hover,
.social:focus-visible {
  color: var(--dourado-escuro);
  background: var(--dourado-claro);
}

.social svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.link {
  position: relative;
  text-decoration: none;
  color: var(--texto);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: color 0.3s;
}

.link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 0%;
  height: 2px;
  background: var(--dourado);
  transition: width 0.3s ease-in-out;
}

.link:hover,
.link.router-link-exact-active {
  color: var(--dourado-escuro);
}

.link:hover::after,
.link.router-link-exact-active::after {
  width: 100%; /* sublinha dourada */
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  padding: 10px 6px;
  cursor: pointer;
}

.menu-toggle span {
  display: block;
  width: 26px;
  height: 2px;
  margin: 6px 0;
  background: var(--texto);
  transition: transform 0.25s, opacity 0.25s;
}

/* "X" quando aberto */
.menu-toggle.aberto span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.menu-toggle.aberto span:nth-child(2) {
  opacity: 0;
}
.menu-toggle.aberto span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

@media (max-width: 768px) {
  .navbar {
    padding: 10px 16px;
  }

  .logo {
    height: 50px;
  }

  .menu-toggle {
    display: block;
    order: 4;
  }

  .navbar-social {
    margin-left: auto;
    padding-left: 0;
    border-left: none;
    gap: 0;
  }

  .social {
    padding: 7px;
  }

  .navbar-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    background: #fff;
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.08);
  }

  .navbar-links.aberto {
    display: flex;
  }

  .link {
    padding: 16px 20px;
    border-top: 1px solid var(--borda);
  }

  .link::after {
    display: none;
  }
}
</style>
