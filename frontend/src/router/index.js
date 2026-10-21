import { createRouter, createWebHistory } from 'vue-router';
import AdminCallback from '../components/AdminCallback.vue';
import AdminLogin from '../components/AdminLogin.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import Agendamentos from '../views/Agendamentos.vue';
import ClientLogin from '../components/ClientLogin.vue';
import Servicos from '../views/Servicos.vue';
import ServicosCategoria from '../views/ServicosCategoria.vue';
import Privacidade from '../views/Privacidade.vue';
import Termos from '../views/Termos.vue';
const routes = [
    { path: '/', redirect: '/servicos' },
    { path: '/servicos', name: 'Servicos', component: Servicos },
    {
        path: '/servicos/:categoria',
        name: 'ServicosCategoria',
        component: ServicosCategoria,
        meta: { requiresClient: true },
    },
    {
        path: '/agendamentos',
        name: 'Agendamentos',
        component: Agendamentos,
        meta: { requiresClient: true },
    },
    { path: '/login', name: 'ClientLogin', component: ClientLogin },
    // Link do e-mail de "esqueci minha senha" (mesma tela de login, na etapa de nova senha)
    { path: '/redefinir-senha', name: 'RedefinirSenha', component: ClientLogin },
    { path: '/admin', name: 'AdminLogin', component: AdminLogin },
    { path: '/admin/callback', name: 'AdminCallback', component: AdminCallback },
    {
        path: '/dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { requiresAdmin: true },
    },
    { path: '/privacidade', name: 'Privacidade', component: Privacidade },
    { path: '/termos', name: 'Termos', component: Termos },
    { path: '/clientes', redirect: '/dashboard' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
];
const router = createRouter({
    history: createWebHistory(),
    scrollBehavior: () => ({ top: 0 }),
    routes,
});
router.beforeEach((to) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (to.meta.requiresAdmin && (!token || role !== 'admin')) {
        return { name: 'AdminLogin' };
    }
    // Cliente precisa informar o telefone antes de ver serviços e horários
    if (to.meta.requiresClient && (!token || role !== 'client')) {
        return { name: 'ClientLogin', query: { redirect: to.fullPath } };
    }
    return true;
});
export default router;
