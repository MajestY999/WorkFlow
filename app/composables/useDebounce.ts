import { shallowRef } from "vue";
import type { Ref } from "vue";

export function useDebounce<T>(source: Ref<T>, delay = 350) {
  const debounced: Ref<T> = shallowRef(source.value);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  watch(
    source,
    (value) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        debounced.value = value;
      }, delay);
    },
    { deep: true },
  );

  onScopeDispose(() => clearTimeout(timeout));

  return debounced;
}
