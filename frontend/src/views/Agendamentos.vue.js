/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted } from 'vue';
import api, { mensagemDeErro } from '../services/api';
import { useAuth } from '../composables/useAuth';
const { cliente } = useAuth();
const agendamentos = ref([]);
const loading = ref(false);
const erro = ref('');
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
async function fetchAgendamentos() {
    loading.value = true;
    try {
        const res = await api.get('/agendamentos/me');
        agendamentos.value = res.data;
    }
    catch (err) {
        erro.value = mensagemDeErro(err, 'Erro ao carregar agendamentos.');
    }
    finally {
        loading.value = false;
    }
}
onMounted(fetchAgendamentos);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "agendamentos-view" },
});
/** @type {__VLS_StyleScopedClasses['agendamentos-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
if (__VLS_ctx.cliente) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.cliente.nome);
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
}
else if (__VLS_ctx.agendamentos.length === 0 && !__VLS_ctx.erro) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        to: "/servicos",
    }));
    const __VLS_2 = __VLS_1({
        to: "/servicos",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    // @ts-ignore
    [cliente, cliente, loading, agendamentos, erro,];
    var __VLS_3;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    for (const [ag] of __VLS_vFor((__VLS_ctx.agendamentos))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (ag.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (ag.servicos?.nome);
        (__VLS_ctx.formatDate(ag.data_hora));
        if (ag.status === 'cancelado') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        // @ts-ignore
        [agendamentos, formatDate,];
    }
}
if (__VLS_ctx.erro) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "erro" },
    });
    /** @type {__VLS_StyleScopedClasses['erro']} */ ;
    (__VLS_ctx.erro);
}
// @ts-ignore
[erro, erro,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
