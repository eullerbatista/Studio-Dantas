/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, watch } from 'vue';
import api, { mensagemDeErro } from '@/services/api';
const props = withDefaults(defineProps(), { modo: 'criar' });
const emit = defineEmits();
// Data de hoje no fuso do navegador (YYYY-MM-DD)
const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
// Estado local
const data = ref('');
const horario = ref('');
const observacoes = ref('');
const horariosDisponiveis = ref([]);
const carregando = ref(false);
const enviando = ref(false);
const erro = ref('');
async function carregarHorarios(dia) {
    horario.value = '';
    horariosDisponiveis.value = [];
    if (!dia)
        return;
    carregando.value = true;
    try {
        const res = await api.get('/calendar/availability', {
            params: { date: dia, servico_id: props.servico.id },
        });
        if (dia === data.value)
            horariosDisponiveis.value = res.data.horarios || [];
    }
    catch (err) {
        erro.value = mensagemDeErro(err, 'Erro ao buscar horários disponíveis');
    }
    finally {
        carregando.value = false;
    }
}
// Carrega horários disponíveis do backend (Google Calendar + agendamentos)
watch(data, (novaData) => {
    erro.value = '';
    carregarHorarios(novaData);
});
// Função de confirmação
async function confirmar() {
    if (!data.value || !horario.value) {
        erro.value = 'Selecione data e horário!';
        return;
    }
    if (props.modo === 'editar') {
        emit('confirmar', { data: data.value, horario: horario.value });
        return;
    }
    enviando.value = true;
    erro.value = '';
    try {
        const res = await api.post('/agendamentos', {
            servico_id: props.servico.id,
            data: data.value,
            horario: horario.value,
            observacoes: observacoes.value || undefined,
        });
        emit('confirmar', { data: data.value, horario: horario.value, agendamento: res.data });
    }
    catch (err) {
        erro.value = mensagemDeErro(err, 'Erro ao salvar agendamento');
        // Horário foi ocupado por outra pessoa: recarrega a lista
        if (err?.response?.status === 409)
            carregarHorarios(data.value);
    }
    finally {
        enviando.value = false;
    }
}
const __VLS_defaults = { modo: 'criar' };
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['horarios']} */ ;
/** @type {__VLS_StyleScopedClasses['horarios']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirmar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "modal-overlay" },
});
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "modal" },
});
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.servico.nome);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "date",
    min: (__VLS_ctx.hoje),
    ...{ class: "input-date" },
});
(__VLS_ctx.data);
/** @type {__VLS_StyleScopedClasses['input-date']} */ ;
if (__VLS_ctx.carregando) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.data && __VLS_ctx.horariosDisponiveis.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "horarios" },
});
/** @type {__VLS_StyleScopedClasses['horarios']} */ ;
for (const [hora] of __VLS_vFor((__VLS_ctx.horariosDisponiveis))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return (__VLS_ctx.horario = hora);
                // @ts-ignore
                [servico, hoje, data, data, carregando, horariosDisponiveis, horariosDisponiveis, horario,];
            } },
        key: (hora),
        ...{ class: ({ ativo: hora === __VLS_ctx.horario }) },
    });
    /** @type {__VLS_StyleScopedClasses['ativo']} */ ;
    (hora);
    // @ts-ignore
    [horario,];
}
if (__VLS_ctx.modo === 'criar') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
        value: (__VLS_ctx.observacoes),
        ...{ class: "input-obs" },
        placeholder: "Observações (opcional)",
        maxlength: "500",
    });
    /** @type {__VLS_StyleScopedClasses['input-obs']} */ ;
}
if (__VLS_ctx.erro) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "erro" },
    });
    /** @type {__VLS_StyleScopedClasses['erro']} */ ;
    (__VLS_ctx.erro);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "acoes" },
});
/** @type {__VLS_StyleScopedClasses['acoes']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.emit('fechar'));
            // @ts-ignore
            [modo, observacoes, erro, erro, emit,];
        } },
    ...{ class: "btn-cancelar" },
});
/** @type {__VLS_StyleScopedClasses['btn-cancelar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.confirmar) },
    ...{ class: "btn-confirmar" },
    disabled: (__VLS_ctx.enviando),
});
/** @type {__VLS_StyleScopedClasses['btn-confirmar']} */ ;
// @ts-ignore
[confirmar, enviando,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
