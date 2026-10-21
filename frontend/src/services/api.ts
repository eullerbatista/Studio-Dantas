import axios from 'axios'
import router from '../router/index.js'
import { useLoader } from '../composables/useLoader.js'
import { clearSession } from '../composables/useAuth.js'

const { startLoading, stopLoading } = useLoader()

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Instância principal da API (todas as rotas já começam com /api)
const api = axios.create({
  baseURL: API_URL,
})

// Extrai a mensagem de erro enviada pelo backend
export function mensagemDeErro(err: any, padrao = 'Erro inesperado') {
  if (!err?.response) return 'Erro de conexão com o servidor'
  return err.response.data?.error || padrao
}

// Interceptor de requisição
api.interceptors.request.use((config) => {
  startLoading()
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de resposta
api.interceptors.response.use(
  (response) => {
    stopLoading()
    return response
  },
  (error) => {
    stopLoading()

    // Token inválido ou expirado: limpa a sessão e volta para o login correto
    if (error.response?.status === 401) {
      const eraAdmin = localStorage.getItem('role') === 'admin'
      clearSession()
      const atual = router.currentRoute.value
      if (eraAdmin || atual.path.startsWith('/dashboard')) {
        router.push('/admin')
      } else if (atual.name !== 'ClientLogin') {
        router.push({ name: 'ClientLogin', query: { redirect: atual.fullPath } })
      }
    }

    // As mensagens de erro são exibidas por cada tela
    return Promise.reject(error)
  },
)

export default api
