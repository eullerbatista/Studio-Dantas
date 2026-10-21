/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { useRouter } from 'vue-router';
const router = useRouter();
// O guard do router manda para o login quando a cliente não está autenticada
function handleAgendamentos() {
    router.push('/agendamentos');
}
function goTo(categoria) {
    router.push(`/servicos/${categoria}`);
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['social-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "home" },
});
/** @type {__VLS_StyleScopedClasses['home']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "header" },
});
/** @type {__VLS_StyleScopedClasses['header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "login-box" },
});
/** @type {__VLS_StyleScopedClasses['login-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.router.push('/login'));
            // @ts-ignore
            [router,];
        } },
    ...{ class: "btn" },
});
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "actions" },
});
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleAgendamentos) },
    ...{ class: "btn-primary" },
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "social" },
});
/** @type {__VLS_StyleScopedClasses['social']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
    href: "https://instagram.com/studiodantas",
    target: "_blank",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "@/assets/icons/instagram.png",
    alt: "Instagram",
    ...{ class: "social-icon" },
});
/** @type {__VLS_StyleScopedClasses['social-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
    href: "https://wa.me/5514999999999",
    target: "_blank",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "@/assets/icons/whatsapp.png",
    alt: "WhatsApp",
    ...{ class: "social-icon" },
});
/** @type {__VLS_StyleScopedClasses['social-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
    href: "https://maps.google.com/?q=Studio+Dantas+Marilia",
    target: "_blank",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "@/assets/icons/maps.png",
    alt: "Google Maps",
    ...{ class: "social-icon" },
});
/** @type {__VLS_StyleScopedClasses['social-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "categorias" },
});
/** @type {__VLS_StyleScopedClasses['categorias']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "cards" },
});
/** @type {__VLS_StyleScopedClasses['cards']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.goTo('maos-e-pes'));
            // @ts-ignore
            [handleAgendamentos, goTo,];
        } },
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "@/assets/icons/nails.png",
    alt: "Mãos & pés",
    ...{ class: "card-icon" },
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.goTo('cabelos'));
            // @ts-ignore
            [goTo,];
        } },
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "@/assets/icons/hair.png",
    alt: "Cabelos",
    ...{ class: "card-icon" },
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.goTo('olhos-e-sobrancelhas'));
            // @ts-ignore
            [goTo,];
        } },
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "@/assets/icons/eyes.png",
    alt: "Olhos & sobrancelhas",
    ...{ class: "card-icon" },
});
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
