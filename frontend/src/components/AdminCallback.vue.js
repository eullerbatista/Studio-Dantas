/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { setSession } from '../composables/useAuth';
const router = useRouter();
// O backend redireciona para /admin/callback#token=... após o login com Google
onMounted(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    history.replaceState(null, '', window.location.pathname); // remove o token da URL
    if (!token) {
        router.replace({ name: 'AdminLogin', query: { erro: 'Login não concluído' } });
        return;
    }
    setSession(token, 'admin');
    router.replace({ name: 'AdminDashboard' });
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "aguarde" },
});
/** @type {__VLS_StyleScopedClasses['aguarde']} */ ;
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
