/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api, { mensagemDeErro } from '../services/api';
import { setSession } from '../composables/useAuth';
const route = useRoute();
const router = useRouter();
const telefone = ref('');
const telefoneConfirmacao = ref('');
const nome = ref('');
const precisaRegistro = ref(false);
const enviando = ref(false);
const erro = ref('');
function mascararTelefone(valor) {
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2)
        return d;
    if (d.length <= 6)
        return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10)
        return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function concluirLogin(data) {
    setSession(data.token, 'client', data.client);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/servicos';
    router.push(redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/servicos');
}
async function entrar() {
    erro.value = '';
    enviando.value = true;
    try {
        const res = await api.post('/auth/client/login', { telefone: telefone.value });
        if (res.data.needsRegistration) {
            precisaRegistro.value = true;
            return;
        }
        concluirLogin(res.data);
    }
    catch (err) {
        erro.value = mensagemDeErro(err, 'Erro ao realizar login. Tente novamente.');
    }
    finally {
        enviando.value = false;
    }
}
async function registrar() {
    erro.value = '';
    if (telefone.value.replace(/\D/g, '') !== telefoneConfirmacao.value.replace(/\D/g, '')) {
        erro.value = 'Os telefones informados não conferem.';
        return;
    }
    enviando.value = true;
    try {
        const res = await api.post('/auth/client/register', {
            telefone: telefone.value,
            telefoneConfirmacao: telefoneConfirmacao.value,
            nome: nome.value,
        });
        concluirLogin(res.data);
    }
    catch (err) {
        erro.value = mensagemDeErro(err, 'Erro ao realizar cadastro. Tente novamente.');
    }
    finally {
        enviando.value = false;
    }
}
function voltar() {
    precisaRegistro.value = false;
    telefoneConfirmacao.value = '';
    nome.value = '';
    erro.value = '';
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['login']} */ ;
/** @type {__VLS_StyleScopedClasses['login']} */ ;
/** @type {__VLS_StyleScopedClasses['login']} */ ;
/** @type {__VLS_StyleScopedClasses['login']} */ ;
/** @type {__VLS_StyleScopedClasses['login']} */ ;
/** @type {__VLS_StyleScopedClasses['login']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "login" },
});
/** @type {__VLS_StyleScopedClasses['login']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.precisaRegistro ? 'Primeiro acesso' : 'Login do Cliente');
if (!__VLS_ctx.precisaRegistro) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.entrar) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                if (!(!__VLS_ctx.precisaRegistro))
                    throw 0;
                return (__VLS_ctx.telefone = __VLS_ctx.mascararTelefone(__VLS_ctx.telefone));
                // @ts-ignore
                [precisaRegistro, precisaRegistro, entrar, telefone, telefone, mascararTelefone,];
            } },
        type: "tel",
        inputmode: "numeric",
        autocomplete: "tel",
        placeholder: "Telefone com DDD",
        required: true,
    });
    (__VLS_ctx.telefone);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.enviando),
    });
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.registrar) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "info" },
    });
    /** @type {__VLS_StyleScopedClasses['info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.telefone);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.nome),
        type: "text",
        autocomplete: "name",
        placeholder: "Seu nome",
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (...[$event]) => {
                if (!!(!__VLS_ctx.precisaRegistro))
                    throw 0;
                return (__VLS_ctx.telefoneConfirmacao = __VLS_ctx.mascararTelefone(__VLS_ctx.telefoneConfirmacao));
                // @ts-ignore
                [telefone, telefone, mascararTelefone, enviando, registrar, nome, telefoneConfirmacao, telefoneConfirmacao,];
            } },
        ...{ onPaste: () => { } },
        type: "tel",
        inputmode: "numeric",
        placeholder: "Confirme o telefone",
        required: true,
    });
    (__VLS_ctx.telefoneConfirmacao);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.enviando),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.voltar) },
        type: "button",
        ...{ class: "voltar" },
    });
    /** @type {__VLS_StyleScopedClasses['voltar']} */ ;
}
if (__VLS_ctx.erro) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "erro" },
    });
    /** @type {__VLS_StyleScopedClasses['erro']} */ ;
    (__VLS_ctx.erro);
}
// @ts-ignore
[enviando, telefoneConfirmacao, voltar, erro, erro,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
