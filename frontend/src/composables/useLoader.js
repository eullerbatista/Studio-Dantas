import { ref } from 'vue';
const loading = ref(false);
export function useLoader() {
    function startLoading() {
        loading.value = true;
    }
    function stopLoading() {
        loading.value = false;
    }
    return {
        loading,
        startLoading,
        stopLoading,
    };
}
