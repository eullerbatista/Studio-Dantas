/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
const eventos = ref([]);
const filtroData = ref('');
const filtroServico = ref('');
const paginaAtual = ref(1);
const itensPorPagina = 10;
onMounted(async () => {
    try {
        const res = await api.get('/api/calendar/events');
        eventos.value = res.data.eventos || [];
    }
    catch (err) {
        console.error('Erro ao carregar eventos:', err);
    }
});
// Lista de serviços únicos
const servicosUnicos = computed(() => {
    const nomes = eventos.value.map((e) => e.resumo);
    return [...new Set(nomes)];
});
// Eventos filtrados
const eventosFiltrados = computed(() => {
    return eventos.value.filter((e) => {
        const dataOk = filtroData.value
            ? new Date(e.inicio).toISOString().startsWith(filtroData.value)
            : true;
        const servicoOk = filtroServico.value ? e.resumo === filtroServico.value : true;
        return dataOk && servicoOk;
    });
});
// Paginação
const totalPaginas = computed(() => Math.ceil(eventosFiltrados.value.length / itensPorPagina));
const eventosPaginados = computed(() => {
    const start = (paginaAtual.value - 1) * itensPorPagina;
    const end = start + itensPorPagina;
    return eventosFiltrados.value.slice(start, end);
});
// Funções auxiliares
function formatarData(dateTime) {
    return new Date(dateTime).toLocaleDateString('pt-BR');
}
function formatarHora(dateTime) {
    return new Date(dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function extrairCliente(descricao) {
    const nomeMatch = descricao?.match(/Cliente:\s(.+?)\s-/);
    const telMatch = descricao?.match(/Telefone:\s(.+)/);
    return {
        nome: nomeMatch ? nomeMatch[1] : 'Não informado',
        telefone: telMatch ? telMatch[1] : 'Não informado',
    };
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tabela-eventos']} */ ;
/** @type {__VLS_StyleScopedClasses['tabela-eventos']} */ ;
/** @type {__VLS_StyleScopedClasses['tabela-eventos']} */ ;
/** @type {__VLS_StyleScopedClasses['paginacao']} */ ;
/** @type {__VLS_StyleScopedClasses['paginacao']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "painel-eventos" },
});
/** @type {__VLS_StyleScopedClasses['painel-eventos']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filtros" },
});
/** @type {__VLS_StyleScopedClasses['filtros']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "date",
});
(__VLS_ctx.filtroData);
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtroServico),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [servico] of __VLS_vFor((__VLS_ctx.servicosUnicos))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (servico),
        value: (servico),
    });
    (servico);
    // @ts-ignore
    [filtroData, filtroServico, servicosUnicos,];
}
if (__VLS_ctx.eventosFiltrados.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "tabela-eventos" },
    });
    /** @type {__VLS_StyleScopedClasses['tabela-eventos']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [evento] of __VLS_vFor((__VLS_ctx.eventosPaginados))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (evento.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (evento.resumo);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.extrairCliente(evento.descricao).nome);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.extrairCliente(evento.descricao).telefone);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatarData(evento.inicio));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatarHora(evento.inicio));
        // @ts-ignore
        [eventosFiltrados, eventosPaginados, extrairCliente, extrairCliente, formatarData, formatarHora,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
if (__VLS_ctx.totalPaginas > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "paginacao" },
    });
    /** @type {__VLS_StyleScopedClasses['paginacao']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalPaginas > 1))
                    throw 0;
                return (__VLS_ctx.paginaAtual--);
                // @ts-ignore
                [totalPaginas, paginaAtual,];
            } },
        disabled: (__VLS_ctx.paginaAtual === 1),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.paginaAtual);
    (__VLS_ctx.totalPaginas);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalPaginas > 1))
                    throw 0;
                return (__VLS_ctx.paginaAtual++);
                // @ts-ignore
                [totalPaginas, paginaAtual, paginaAtual, paginaAtual,];
            } },
        disabled: (__VLS_ctx.paginaAtual === __VLS_ctx.totalPaginas),
    });
}
// @ts-ignore
[totalPaginas, paginaAtual,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
