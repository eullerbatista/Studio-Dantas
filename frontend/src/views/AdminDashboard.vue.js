/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted } from 'vue';
import api, { mensagemDeErro } from '../services/api';
import AgendamentoModal from '../components/AgendamentoModal.vue';
const aba = ref('agendamentos');
const agendamentos = ref([]);
const clientes = ref([]);
const servicos = ref([]);
const modalVisivel = ref(false);
const agendamentoSelecionado = ref(null);
const mensagem = ref('');
async function executar(acao, erroPadrao) {
    try {
        await acao();
    }
    catch (err) {
        exibirMensagem(mensagemDeErro(err, erroPadrao));
    }
}
async function fetchAgendamentos() {
    const res = await api.get('/agendamentos');
    agendamentos.value = res.data;
}
async function fetchClientes() {
    const res = await api.get('/clientes');
    clientes.value = res.data;
}
async function fetchServicos() {
    const res = await api.get('/servicos');
    servicos.value = res.data;
}
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function abrirModal(ag) {
    agendamentoSelecionado.value = ag;
    modalVisivel.value = true;
}
function atualizarAgendamento(dados) {
    return executar(async () => {
        await api.put(`/agendamentos/${agendamentoSelecionado.value.id}`, {
            data: dados.data,
            horario: dados.horario,
        });
        modalVisivel.value = false;
        await fetchAgendamentos();
        exibirMensagem('Agendamento atualizado com sucesso!');
    }, 'Erro ao atualizar agendamento');
}
function excluirAgendamento(id) {
    return executar(async () => {
        await api.delete(`/agendamentos/${id}`);
        agendamentos.value = agendamentos.value.filter((a) => a.id !== id);
        exibirMensagem('Agendamento excluído com sucesso!');
    }, 'Erro ao excluir agendamento');
}
function editarCliente(c) {
    alert(`Editar cliente: ${c.nome}`);
}
function excluirCliente(id) {
    return executar(async () => {
        await api.delete(`/clientes/${id}`);
        clientes.value = clientes.value.filter((c) => c.id !== id);
        exibirMensagem('Cliente excluído com sucesso!');
    }, 'Erro ao excluir cliente (ela pode ter agendamentos)');
}
function editarServico(s) {
    alert(`Editar serviço: ${s.nome}`);
}
function excluirServico(id) {
    return executar(async () => {
        await api.delete(`/servicos/${id}`);
        servicos.value = servicos.value.filter((s) => s.id !== id);
        exibirMensagem('Serviço desativado com sucesso!');
    }, 'Erro ao desativar serviço');
}
function exibirMensagem(texto) {
    mensagem.value = texto;
    setTimeout(() => {
        mensagem.value = '';
    }, 3000);
}
onMounted(() => {
    executar(fetchAgendamentos, 'Erro ao carregar agendamentos');
    executar(fetchClientes, 'Erro ao carregar clientes');
    executar(fetchServicos, 'Erro ao carregar serviços');
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "admin-dashboard" },
});
/** @type {__VLS_StyleScopedClasses['admin-dashboard']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "tabs" },
});
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.aba = 'agendamentos');
            // @ts-ignore
            [aba,];
        } },
    ...{ class: ({ ativo: __VLS_ctx.aba === 'agendamentos' }) },
});
/** @type {__VLS_StyleScopedClasses['ativo']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.aba = 'clientes');
            // @ts-ignore
            [aba, aba,];
        } },
    ...{ class: ({ ativo: __VLS_ctx.aba === 'clientes' }) },
});
/** @type {__VLS_StyleScopedClasses['ativo']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.aba = 'servicos');
            // @ts-ignore
            [aba, aba,];
        } },
    ...{ class: ({ ativo: __VLS_ctx.aba === 'servicos' }) },
});
/** @type {__VLS_StyleScopedClasses['ativo']} */ ;
if (__VLS_ctx.aba === 'agendamentos') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [ag] of __VLS_vFor((__VLS_ctx.agendamentos))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (ag.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (ag.clientes?.nome);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (ag.clientes?.telefone);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (ag.servicos?.nome);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatDate(ag.data_hora));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (ag.status || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.aba === 'agendamentos'))
                        throw 0;
                    return (__VLS_ctx.abrirModal(ag));
                    // @ts-ignore
                    [aba, aba, agendamentos, formatDate, abrirModal,];
                } },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.aba === 'agendamentos'))
                        throw 0;
                    return (__VLS_ctx.excluirAgendamento(ag.id));
                    // @ts-ignore
                    [excluirAgendamento,];
                } },
        });
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.aba === 'clientes') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [c] of __VLS_vFor((__VLS_ctx.clientes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (c.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (c.nome);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (c.telefone);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.aba === 'clientes'))
                        throw 0;
                    return (__VLS_ctx.editarCliente(c));
                    // @ts-ignore
                    [aba, clientes, editarCliente,];
                } },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.aba === 'clientes'))
                        throw 0;
                    return (__VLS_ctx.excluirCliente(c.id));
                    // @ts-ignore
                    [excluirCliente,];
                } },
        });
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.aba === 'servicos') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [s] of __VLS_vFor((__VLS_ctx.servicos))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (s.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (s.nome);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (s.duracao_minutos ? `${s.duracao_minutos} min` : '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (s.preco ? `R$ ${s.preco}` : '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.aba === 'servicos'))
                        throw 0;
                    return (__VLS_ctx.editarServico(s));
                    // @ts-ignore
                    [aba, servicos, editarServico,];
                } },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.aba === 'servicos'))
                        throw 0;
                    return (__VLS_ctx.excluirServico(s.id));
                    // @ts-ignore
                    [excluirServico,];
                } },
        });
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.modalVisivel && __VLS_ctx.agendamentoSelecionado) {
    const __VLS_0 = AgendamentoModal;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onFechar': {} },
        ...{ 'onConfirmar': {} },
        modo: "editar",
        servico: ({ id: __VLS_ctx.agendamentoSelecionado.servico_id, nome: __VLS_ctx.agendamentoSelecionado.servicos?.nome }),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onFechar': {} },
        ...{ 'onConfirmar': {} },
        modo: "editar",
        servico: ({ id: __VLS_ctx.agendamentoSelecionado.servico_id, nome: __VLS_ctx.agendamentoSelecionado.servicos?.nome }),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = {
        /** @type {typeof __VLS_5.fechar} */
        onFechar: (...[$event]) => {
            if (!(__VLS_ctx.modalVisivel && __VLS_ctx.agendamentoSelecionado))
                throw 0;
            return (__VLS_ctx.modalVisivel = false);
            // @ts-ignore
            [modalVisivel, modalVisivel, agendamentoSelecionado, agendamentoSelecionado, agendamentoSelecionado,];
        },
    };
    const __VLS_7 = {
        /** @type {typeof __VLS_5.confirmar} */
        onConfirmar: (__VLS_ctx.atualizarAgendamento),
    };
    var __VLS_3;
    var __VLS_4;
}
if (__VLS_ctx.mensagem) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    (__VLS_ctx.mensagem);
}
// @ts-ignore
[atualizarAgendamento, mensagem, mensagem,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
