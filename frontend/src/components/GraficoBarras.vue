<template>
  <figure class="grafico">
    <figcaption>{{ titulo }}</figcaption>

    <div v-if="maximo === 0" class="vazio">Sem dados no período</div>

    <div v-else class="area">
      <div class="eixo-y" aria-hidden="true">
        <span>{{ formatar(maximo) }}</span>
        <span>{{ formatar(maximo / 2) }}</span>
        <span>{{ formatar(0) }}</span>
      </div>

      <div class="plot">
        <div class="grade" aria-hidden="true"><span></span><span></span><span></span></div>

        <div class="barras">
          <div
            v-for="(p, i) in pontos"
            :key="p.chave"
            class="coluna"
            tabindex="0"
            :aria-label="`${p.rotuloCompleto}: ${formatar(p.valor)}`"
            @mouseenter="ativo = i"
            @mouseleave="ativo = null"
            @focus="ativo = i"
            @blur="ativo = null"
          >
            <div class="barra" :class="{ destaque: ativo === i }" :style="{ height: `${(p.valor / maximo) * 100}%` }"></div>
            <div
              v-if="ativo === i"
              class="tooltip"
              :class="{ esquerda: i < pontos.length * 0.25, direita: i > pontos.length * 0.75 }"
              :style="{ bottom: `calc(${(p.valor / maximo) * 100}% + 8px)` }"
            >
              <span class="tooltip-rotulo">{{ p.rotuloCompleto }}</span>
              <strong>{{ formatar(p.valor) }}</strong>
            </div>
          </div>
        </div>

        <div class="eixo-x" aria-hidden="true">
          <span v-for="(p, i) in pontos" :key="p.chave">{{ i % passoRotulo === 0 ? p.rotulo : '' }}</span>
        </div>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export interface PontoGrafico {
  chave: string
  rotulo: string
  rotuloCompleto: string
  valor: number
}

const props = defineProps<{
  titulo: string
  pontos: PontoGrafico[]
  formatar: (valor: number) => string
}>()

const ativo = ref<number | null>(null)

// Arredonda o topo do eixo para 1, 2 ou 5 × 10^n
const maximo = computed(() => {
  const maior = Math.max(0, ...props.pontos.map((p) => p.valor))
  if (maior === 0) return 0
  const base = 10 ** Math.floor(Math.log10(maior))
  const passo = [1, 2, 5, 10].find((m) => m * base >= maior) ?? 10
  // Contagens: o meio do eixo precisa ser inteiro
  return Math.max(passo * base, 2)
})

// No máximo ~8 rótulos no eixo X para não encavalar
const passoRotulo = computed(() => Math.max(1, Math.ceil(props.pontos.length / 8)))
</script>

<style scoped>
.grafico {
  margin: 0;
  padding: 1rem 1.25rem 0.75rem;
  background: var(--branco);
  border: 1px solid var(--borda);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
  min-width: 0;
}
figcaption {
  margin-bottom: 0.75rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--texto-suave);
}
.vazio {
  padding: 3rem 0;
  text-align: center;
  color: var(--texto-suave);
}
.area {
  display: flex;
  gap: 0.5rem;
}
.eixo-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 200px;
  margin-top: -0.45em;
  margin-bottom: -0.45em;
  font-size: 0.7rem;
  color: var(--texto-suave);
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.plot {
  position: relative;
  flex: 1;
  min-width: 0;
}
.grade {
  position: absolute;
  inset: 0 0 auto 0;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}
.grade span {
  border-top: 1px solid var(--borda);
}
.barras {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 200px;
}
.coluna {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  outline: none;
  cursor: default;
}
.barra {
  width: 100%;
  max-width: 36px;
  min-height: 0;
  background: var(--dourado-escuro);
  border-radius: 4px 4px 0 0;
  transition: background 0.15s;
}
.barra.destaque {
  background: #86681a;
}
.coluna:focus-visible .barra {
  outline: 2px solid var(--texto);
  outline-offset: 2px;
}
.tooltip {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  flex-direction: column;
  padding: 0.4rem 0.65rem;
  background: var(--texto);
  color: var(--branco);
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.35;
  white-space: nowrap;
  pointer-events: none;
}
.tooltip.esquerda {
  left: 0;
  transform: none;
}
.tooltip.direita {
  left: auto;
  right: 0;
  transform: none;
}
.tooltip-rotulo {
  opacity: 0.8;
}
.eixo-x {
  display: flex;
  gap: 2px;
  margin-top: 0.4rem;
  border-top: 1px solid var(--texto-suave);
  padding-top: 0.3rem;
}
.eixo-x span {
  flex: 1;
  min-width: 0;
  overflow: visible;
  font-size: 0.68rem;
  color: var(--texto-suave);
  text-align: center;
  white-space: nowrap;
}
</style>
