/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import AgendamentoModal from '@/components/AgendamentoModal.vue';
import api, { mensagemDeErro } from '@/services/api';
const route = useRoute();
const categoria = computed(() => route.params.categoria);
const servicos = ref([]);
const carregando = ref(false);
const erro = ref('');
const sucesso = ref('');
async function carregarServicos() {
    carregando.value = true;
    erro.value = '';
    try {
        const res = await api.get('/servicos', { params: { categoria: categoria.value } });
        servicos.value = res.data;
    }
    catch (err) {
        erro.value = mensagemDeErro(err, 'Erro ao carregar serviços');
    }
    finally {
        carregando.value = false;
    }
}
watch(categoria, carregarServicos, { immediate: true });
const tituloCategoria = computed(() => {
    switch (categoria.value) {
        case 'maos-e-pes':
            return 'Serviços de Mãos & Pés';
        case 'cabelos':
            return 'Serviços de Cabelos';
        case 'olhos-e-sobrancelhas':
            return 'Serviços de Olhos & Sobrancelhas';
        default:
            return 'Serviços';
    }
});
const modalAberto = ref(false);
const servicoSelecionado = ref(null);
function abrirAgendamento(servico) {
    sucesso.value = '';
    servicoSelecionado.value = servico;
    modalAberto.value = true;
}
function confirmarAgendamento(dados) {
    modalAberto.value = false;
    const [ano, mes, dia] = dados.data.split('-');
    sucesso.value = `Agendamento confirmado para ${dia}/${mes}/${ano} às ${dados.horario}!`;
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "servicos" },
});
/** @type {__VLS_StyleScopedClasses['servicos']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
(__VLS_ctx.tituloCategoria);
if (__VLS_ctx.sucesso) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "sucesso" },
    });
    /** @type {__VLS_StyleScopedClasses['sucesso']} */ ;
    (__VLS_ctx.sucesso);
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        to: "/agendamentos",
    }));
    const __VLS_2 = __VLS_1({
        to: "/agendamentos",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    // @ts-ignore
    [tituloCategoria, sucesso, sucesso,];
    var __VLS_3;
}
if (__VLS_ctx.carregando) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.erro) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "erro" },
    });
    /** @type {__VLS_StyleScopedClasses['erro']} */ ;
    (__VLS_ctx.erro);
}
else if (__VLS_ctx.servicos.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "servicos-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['servicos-grid']} */ ;
    for (const [servico] of __VLS_vFor((__VLS_ctx.servicos))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "servico-card" },
            key: (servico.id),
        });
        /** @type {__VLS_StyleScopedClasses['servico-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        (servico.nome);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (servico.descricao);
        if (servico.duracao_minutos) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "detalhe" },
            });
            /** @type {__VLS_StyleScopedClasses['detalhe']} */ ;
            (servico.duracao_minutos);
        }
        if (servico.preco) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "detalhe" },
            });
            /** @type {__VLS_StyleScopedClasses['detalhe']} */ ;
            (Number(servico.preco).toFixed(2));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.carregando))
                        throw 0;
                    if (!!(__VLS_ctx.erro))
                        throw 0;
                    if (!(__VLS_ctx.servicos.length > 0))
                        throw 0;
                    return (__VLS_ctx.abrirAgendamento(servico));
                    // @ts-ignore
                    [carregando, erro, erro, servicos, servicos, abrirAgendamento,];
                } },
            ...{ class: "btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        // @ts-ignore
        [];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
if (__VLS_ctx.modalAberto && __VLS_ctx.servicoSelecionado) {
    const __VLS_6 = AgendamentoModal;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        ...{ 'onFechar': {} },
        ...{ 'onConfirmar': {} },
        servico: (__VLS_ctx.servicoSelecionado),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onFechar': {} },
        ...{ 'onConfirmar': {} },
        servico: (__VLS_ctx.servicoSelecionado),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_11;
    const __VLS_12 = {
        /** @type {typeof __VLS_11.fechar} */
        onFechar: (...[$event]) => {
            if (!(__VLS_ctx.modalAberto && __VLS_ctx.servicoSelecionado))
                throw 0;
            return (__VLS_ctx.modalAberto = false);
            // @ts-ignore
            [modalAberto, modalAberto, servicoSelecionado, servicoSelecionado,];
        },
    };
    const __VLS_13 = {
        /** @type {typeof __VLS_11.confirmar} */
        onConfirmar: (__VLS_ctx.confirmarAgendamento),
    };
    var __VLS_9;
    var __VLS_10;
}
// @ts-ignore
[confirmarAgendamento,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
