/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/eulle/Documents/StudioDantas/frontend/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { useRouter } from 'vue-router';
const router = useRouter();
const categorias = [
    {
        id: 1,
        slug: 'maos-e-pes',
        nome: 'Mãos & Pés',
        descricao: 'Cuidados completos para mãos e pés.',
        img: new URL('@/assets/servicos/nails.jpg', import.meta.url).href,
    },
    {
        id: 2,
        slug: 'cabelos',
        nome: 'Cabelos',
        descricao: 'Cortes, hidratações e colorações.',
        img: new URL('@/assets/servicos/hair.jpg', import.meta.url).href,
    },
    {
        id: 3,
        slug: 'olhos-e-sobrancelhas',
        nome: 'Olhos & Sobrancelhas',
        descricao: 'Design de sobrancelhas e extensão de cílios.',
        img: new URL('@/assets/servicos/eyes.jpg', import.meta.url).href,
    },
];
function verCategoria(slug) {
    router.push({ name: 'ServicosCategoria', params: { categoria: slug } });
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['servico-card']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "servicos" },
});
/** @type {__VLS_StyleScopedClasses['servicos']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "servicos-grid" },
});
/** @type {__VLS_StyleScopedClasses['servicos-grid']} */ ;
for (const [categoria] of __VLS_vFor((__VLS_ctx.categorias))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "servico-card" },
        key: (categoria.id),
    });
    /** @type {__VLS_StyleScopedClasses['servico-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (categoria.img),
        alt: (categoria.nome),
        ...{ class: "servico-img" },
    });
    /** @type {__VLS_StyleScopedClasses['servico-img']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    (categoria.nome);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (categoria.descricao);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return (__VLS_ctx.verCategoria(categoria.slug));
                // @ts-ignore
                [categorias, verCategoria,];
            } },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
