import { ref, computed } from 'vue'

export type Role = 'client' | 'admin'

export interface Cliente {
  id: number
  nome: string
  telefone: string
}

function lerCliente(): Cliente | null {
  try {
    return JSON.parse(localStorage.getItem('cliente') || 'null')
  } catch {
    return null
  }
}

// Estado compartilhado entre todos os componentes
const token = ref<string | null>(localStorage.getItem('token'))
const role = ref<Role | null>(localStorage.getItem('role') as Role | null)
const cliente = ref<Cliente | null>(lerCliente())

export function setSession(novoToken: string, novoRole: Role, novoCliente: Cliente | null = null) {
  token.value = novoToken
  role.value = novoRole
  cliente.value = novoCliente
  localStorage.setItem('token', novoToken)
  localStorage.setItem('role', novoRole)
  if (novoCliente) localStorage.setItem('cliente', JSON.stringify(novoCliente))
  else localStorage.removeItem('cliente')
}

export function clearSession() {
  token.value = null
  role.value = null
  cliente.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('cliente')
}

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => isAuthenticated.value && role.value === 'admin')
  const isClient = computed(() => isAuthenticated.value && role.value === 'client')

  return {
    token,
    role,
    cliente,
    isAuthenticated,
    isAdmin,
    isClient,
    setSession,
    logout: clearSession,
  }
}
