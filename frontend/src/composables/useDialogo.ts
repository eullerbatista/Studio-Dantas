import { onBeforeUnmount, onMounted, type Ref } from 'vue'

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Modal acessível (WCAG 2.1.2 / 2.4.3): o foco entra no modal, o Tab fica preso nele,
// Esc fecha e, ao fechar, o foco volta para o botão que abriu
export function useDialogo(modal: Ref<HTMLElement | null>, fechar: () => void) {
  let anterior: HTMLElement | null = null

  function focaveis() {
    const lista = modal.value?.querySelectorAll<HTMLElement>(FOCAVEIS) ?? []
    return Array.from(lista).filter((el) => el.offsetParent !== null)
  }

  function aoTeclar(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      fechar()
      return
    }
    if (e.key !== 'Tab' || !modal.value) return

    const lista = focaveis()
    if (!lista.length) return
    const primeiro = lista[0]!
    const ultimo = lista[lista.length - 1]!
    const ativo = document.activeElement
    const fora = !modal.value.contains(ativo)

    if (e.shiftKey && (ativo === primeiro || ativo === modal.value || fora)) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && (ativo === ultimo || fora)) {
      e.preventDefault()
      primeiro.focus()
    }
  }

  onMounted(() => {
    anterior = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', aoTeclar)
    // Foca o próprio diálogo para o leitor de tela anunciar o título; o Tab segue para os campos
    modal.value?.focus()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', aoTeclar)
    if (anterior?.isConnected) anterior.focus()
  })
}
