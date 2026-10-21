import { ref, computed } from 'vue';
function lerCliente() {
    try {
        return JSON.parse(localStorage.getItem('cliente') || 'null');
    }
    catch {
        return null;
    }
}
// Estado compartilhado entre todos os componentes
const token = ref(localStorage.getItem('token'));
const role = ref(localStorage.getItem('role'));
const cliente = ref(lerCliente());
export function setSession(novoToken, novoRole, novoCliente = null) {
    token.value = novoToken;
    role.value = novoRole;
    cliente.value = novoCliente;
    localStorage.setItem('token', novoToken);
    localStorage.setItem('role', novoRole);
    if (novoCliente)
        localStorage.setItem('cliente', JSON.stringify(novoCliente));
    else
        localStorage.removeItem('cliente');
}
export function clearSession() {
    token.value = null;
    role.value = null;
    cliente.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('cliente');
}
export function useAuth() {
    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => isAuthenticated.value && role.value === 'admin');
    const isClient = computed(() => isAuthenticated.value && role.value === 'client');
    return {
        token,
        role,
        cliente,
        isAuthenticated,
        isAdmin,
        isClient,
        setSession,
        logout: clearSession,
    };
}
