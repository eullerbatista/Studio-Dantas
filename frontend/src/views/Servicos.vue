<template>
  <div class="servicos">
    <h1>Nossas Categorias</h1>
    <p class="subtitulo">Escolha uma categoria e agende seu horário</p>
    <div class="servicos-grid">
      <div class="servico-card" v-for="categoria in categorias" :key="categoria.id">
        <img
          :src="categoria.img"
          :alt="categoria.nome"
          class="servico-img"
          :class="{ 'servico-img--menor': categoria.imgMenor }"
        />
        <h2>{{ categoria.nome }}</h2>
        <p class="descricao">{{ categoria.descricao }}</p>
        <button @click="verCategoria(categoria.slug)" class="btn-primary">Ver serviços</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const categorias = [
  {
    id: 1,
    slug: 'maos-e-pes',
    nome: 'Mãos & Pés',
    descricao: 'Cuidados completos para mãos e pés.',
    img: new URL('@/assets/icons/categoria-maos-pes.png', import.meta.url).href,
  },
  {
    id: 2,
    slug: 'cabelos',
    nome: 'Cabelos',
    descricao: 'Cortes, hidratações e colorações.',
    img: new URL('@/assets/servicos/cabelos.svg', import.meta.url).href,
  },
  {
    id: 3,
    slug: 'olhos-e-sobrancelhas',
    nome: 'Olhos & Sobrancelhas',
    descricao: 'Design de sobrancelhas e extensão de cílios.',
    img: new URL('@/assets/servicos/cat-olhossobrancelhas.svg', import.meta.url).href,
    imgMenor: true,
  },
]

function verCategoria(slug: string) {
  router.push({ name: 'ServicosCategoria', params: { categoria: slug } })
}
</script>
<style scoped>
.servicos {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

h1 {
  text-align: center;
  font-size: 2.6rem;
  margin: 0 0 0.4rem;
}

/* Traço dourado sob o título */
h1::after {
  content: '';
  display: block;
  width: 56px;
  height: 2px;
  margin: 0.9rem auto 0;
  background: var(--dourado);
}

.subtitulo {
  text-align: center;
  color: var(--texto-suave);
  margin: 0.8rem 0 2.5rem;
}

.servicos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 2rem;
  justify-items: center;
}

.servico-card {
  width: 100%;
  max-width: 360px;
  padding: 2rem 1.5rem;
  text-align: center;
  background: var(--branco);
  border: 1px solid var(--borda);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.servico-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(74, 52, 38, 0.12);
}

.servico-card h2 {
  margin: 0.8rem 0 0.5rem;
  font-family: var(--fonte-texto);
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.btn-primary {
  margin-top: 0.6rem;
  padding: 0.75rem 1.8rem;
  border: none;
  border-radius: 999px;
  background: var(--dourado);
  color: var(--branco);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: var(--dourado-escuro);
}

.servico-img {
  display: block;
  height: 120px;
  max-width: 100%;
  margin: 0 auto 0.5rem;
  object-fit: contain;
}

/* 15% menor, mantendo o título alinhado com os outros cartões */
.servico-img--menor {
  height: 102px;
  margin: 18px auto 0.5rem;
}

.descricao {
  color: var(--texto-suave);
  margin: 0 0 1rem;
}

@media (max-width: 600px) {
  .servicos {
    padding: 1.75rem 1rem;
  }
  h1 {
    font-size: 2rem;
  }
  .subtitulo {
    margin-bottom: 1.5rem;
  }
  .servicos-grid {
    gap: 1.25rem;
  }
}
</style>
