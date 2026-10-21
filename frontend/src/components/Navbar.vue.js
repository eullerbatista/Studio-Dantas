/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth.js';
const router = useRouter();
const { isAuthenticated, isAdmin, logout } = useAuth();
function sair() {
    const eraAdmin = isAdmin.value;
    logout();
    router.push(eraAdmin ? '/admin' : '/');
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "navbar" },
});
/** @type {__VLS_StyleScopedClasses['navbar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "navbar-left" },
});
/** @type {__VLS_StyleScopedClasses['navbar-left']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.img)({
    src: "/logo.png",
    alt: "Studio Dantas Lash Beauty",
    ...{ class: "logo" },
});
/** @type {__VLS_StyleScopedClasses['logo']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "navbar-links" },
});
/** @type {__VLS_StyleScopedClasses['navbar-links']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/",
    ...{ class: "link" },
}));
const __VLS_2 = __VLS_1({
    to: "/",
    ...{ class: "link" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['link']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
var __VLS_3;
let __VLS_6;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    to: "/servicos",
    ...{ class: "link" },
}));
const __VLS_8 = __VLS_7({
    to: "/servicos",
    ...{ class: "link" },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['link']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
var __VLS_9;
if (!__VLS_ctx.isAdmin) {
    let __VLS_12;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        to: "/agendamentos",
        ...{ class: "link" },
    }));
    const __VLS_14 = __VLS_13({
        to: "/agendamentos",
        ...{ class: "link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['link']} */ ;
    const { default: __VLS_17 } = __VLS_15.slots;
    // @ts-ignore
    [isAdmin,];
    var __VLS_15;
}
if (__VLS_ctx.isAdmin) {
    let __VLS_18;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        to: "/dashboard",
        ...{ class: "link" },
    }));
    const __VLS_20 = __VLS_19({
        to: "/dashboard",
        ...{ class: "link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['link']} */ ;
    const { default: __VLS_23 } = __VLS_21.slots;
    // @ts-ignore
    [isAdmin,];
    var __VLS_21;
}
if (!__VLS_ctx.isAuthenticated) {
    let __VLS_24;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        to: "/login",
        ...{ class: "link" },
    }));
    const __VLS_26 = __VLS_25({
        to: "/login",
        ...{ class: "link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    /** @type {__VLS_StyleScopedClasses['link']} */ ;
    const { default: __VLS_29 } = __VLS_27.slots;
    // @ts-ignore
    [isAuthenticated,];
    var __VLS_27;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        ...{ onClick: (__VLS_ctx.sair) },
        href: "#",
        ...{ class: "link" },
    });
    /** @type {__VLS_StyleScopedClasses['link']} */ ;
}
// @ts-ignore
[sair,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
