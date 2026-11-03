import { ref, computed } from 'vue'

// admin: proprietária (acesso a tudo); profissional: funcionária da equipe
export type Role = 'client' | 'admin' | 'profissional'

export interface Cliente {
  id: number
  nome: string
  telefone: string
}

// Quem entrou no painel (vem do token do login com Google)
export interface MembroEquipe {
  profissionalId: number | null
  nome: string
}

function lerJson<T>(chave: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(chave) || 'null')
  } catch {
    return null
  }
}

// Estado compartilhado entre todos os componentes
const token = ref<string | null>(localStorage.getItem('token'))
const role = ref<Role | null>(localStorage.getItem('role') as Role | null)
const cliente = ref<Cliente | null>(lerJson<Cliente>('cliente'))
const equipe = ref<MembroEquipe | null>(lerJson<MembroEquipe>('equipe'))

export function setSession(
  novoToken: string,
  novoRole: Role,
  novoCliente: Cliente | null = null,
  novaEquipe: MembroEquipe | null = null,
) {
  token.value = novoToken
  role.value = novoRole
  cliente.value = novoCliente
  equipe.value = novaEquipe
  localStorage.setItem('token', novoToken)
  localStorage.setItem('role', novoRole)
  if (novoCliente) localStorage.setItem('cliente', JSON.stringify(novoCliente))
  else localStorage.removeItem('cliente')
  if (novaEquipe) localStorage.setItem('equipe', JSON.stringify(novaEquipe))
  else localStorage.removeItem('equipe')
}

export function clearSession() {
  token.value = null
  role.value = null
  cliente.value = null
  equipe.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('cliente')
  localStorage.removeItem('equipe')
}

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => isAuthenticated.value && role.value === 'admin')
  const isProfissional = computed(() => isAuthenticated.value && role.value === 'profissional')
  // Quem acessa o painel: proprietária ou funcionária
  const isEquipe = computed(() => isAdmin.value || isProfissional.value)
  const isClient = computed(() => isAuthenticated.value && role.value === 'client')

  return {
    token,
    role,
    cliente,
    equipe,
    isAuthenticated,
    isAdmin,
    isProfissional,
    isEquipe,
    isClient,
    setSession,
    logout: clearSession,
  }
}
