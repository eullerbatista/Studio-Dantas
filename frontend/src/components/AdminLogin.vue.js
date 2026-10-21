/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { API_URL } from '../services/api';
const route = useRoute();
const erro = computed(() => (typeof route.query.erro === 'string' ? route.query.erro : ''));
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-google']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "admin-login" },
});
/** @type {__VLS_StyleScopedClasses['admin-login']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
    href: (`${__VLS_ctx.API_URL}/auth/google`),
    ...{ class: "btn-google" },
});
/** @type {__VLS_StyleScopedClasses['btn-google']} */ ;
if (__VLS_ctx.erro) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "erro" },
    });
    /** @type {__VLS_StyleScopedClasses['erro']} */ ;
    (__VLS_ctx.erro);
}
// @ts-ignore
[API_URL, erro, erro,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
