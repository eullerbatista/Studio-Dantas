// Ícones de assets/servicos que a proprietária pode escolher para um serviço (guardados no banco pela chave)
export interface IconeServico {
  chave: string
  nome: string
  url: string
  // Termos do nome do serviço que escolhem este ícone quando nenhum foi definido
  termos: string[]
}

// Valor de `icone` quando a proprietária não quer ícone; null = automático pelo nome
export const SEM_ICONE = 'nenhum'

// Imagem da galeria: guardada no próprio serviço como data URL, em até 192px (2x o maior tamanho exibido)
const LADO_MAXIMO = 192
// Mesmo limite do backend (caracteres do data URL)
const TAMANHO_MAXIMO = 150_000

export function ehImagemPropria(icone?: string | null): icone is string {
  return !!icone && icone.startsWith('data:image/')
}

function abrirImagem(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível abrir esta imagem. Tente outra.'))
    img.src = url
  })
}

// Reduz a foto escolhida para o tamanho de ícone antes de enviar
export async function prepararImagem(arquivo: File) {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.')

  const url = URL.createObjectURL(arquivo)
  try {
    const img = await abrirImagem(url)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala))
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // WebP mantém a transparência e fica pequeno; navegadores sem WebP devolvem PNG
    let dados = canvas.toDataURL('image/webp', 0.85)
    if (!dados.startsWith('data:image/webp')) dados = canvas.toDataURL('image/png')
    if (dados.length > TAMANHO_MAXIMO) {
      // JPEG não tem transparência: fundo branco atrás da imagem
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      dados = canvas.toDataURL('image/jpeg', 0.85)
    }
    if (dados.length > TAMANHO_MAXIMO) throw new Error('Imagem muito grande. Tente outra.')
    return dados
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Na escolha automática, o primeiro termo que bater vence
export const ICONES_SERVICOS: IconeServico[] = [
  { chave: 'alongamento', nome: 'Alongamento', termos: ['alongamento'], url: new URL('@/assets/servicos/alongamento.png', import.meta.url).href },
  { chave: 'spa-pes', nome: 'Spa dos pés', termos: ['spa'], url: new URL('@/assets/servicos/spa-pes.png', import.meta.url).href },
  { chave: 'pedicure', nome: 'Pedicure', termos: ['pedicure'], url: new URL('@/assets/servicos/pedicure.png', import.meta.url).href },
  { chave: 'manicure', nome: 'Manicure', termos: ['manicure'], url: new URL('@/assets/servicos/manicure.png', import.meta.url).href },
  { chave: 'gel', nome: 'Unha em gel', termos: ['gel'], url: new URL('@/assets/servicos/gel.png', import.meta.url).href },
  { chave: 'corte', nome: 'Corte', termos: ['corte'], url: new URL('@/assets/servicos/corte.svg', import.meta.url).href },
  { chave: 'escova', nome: 'Escova', termos: ['escova'], url: new URL('@/assets/servicos/escova.svg', import.meta.url).href },
  { chave: 'progressiva', nome: 'Progressiva', termos: ['progressiva'], url: new URL('@/assets/servicos/progressiva.svg', import.meta.url).href },
  { chave: 'selante', nome: 'Selante', termos: ['selante'], url: new URL('@/assets/servicos/selante.svg', import.meta.url).href },
  { chave: 'tintura', nome: 'Tintura', termos: ['tintura', 'coloracao'], url: new URL('@/assets/servicos/tintura.svg', import.meta.url).href },
  { chave: 'sobrancelha', nome: 'Sobrancelha', termos: ['sobrancelha'], url: new URL('@/assets/servicos/sobrancelha.svg', import.meta.url).href },
  { chave: 'cilios', nome: 'Cílios', termos: ['cilios'], url: new URL('@/assets/servicos/cilios.svg', import.meta.url).href },
  { chave: 'cabelos', nome: 'Cabelos', termos: [], url: new URL('@/assets/servicos/cabelos.svg', import.meta.url).href },
  { chave: 'olhos', nome: 'Olhos', termos: [], url: new URL('@/assets/servicos/cat-olhossobrancelhas.svg', import.meta.url).href },
]

function iconeAutomatico(nome: string) {
  const n = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return ICONES_SERVICOS.find((i) => i.termos.some((t) => n.includes(t)))
}

// Ícone escolhido no painel; sem escolha, o que combina com o nome do serviço
export function iconeDoServico(servico: { nome: string; icone?: string | null }): IconeServico | undefined {
  if (servico.icone === SEM_ICONE) return undefined
  if (ehImagemPropria(servico.icone)) {
    return { chave: 'galeria', nome: 'Da galeria', url: servico.icone, termos: [] }
  }
  const escolhido = servico.icone && ICONES_SERVICOS.find((i) => i.chave === servico.icone)
  return escolhido || iconeAutomatico(servico.nome || '')
}
