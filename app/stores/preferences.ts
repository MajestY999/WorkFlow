import { defineStore } from "pinia";

export type ListDensity = "Комфортная" | "Компактная";
const storageKey = "workflow-ui-preferences";

export const usePreferencesStore = defineStore("preferences", () => {
  const density = ref<ListDensity>("Комфортная");
  const hydrated = ref(false);

  function hydrate() {
    if (hydrated.value || typeof window === "undefined") return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const preferences: { density?: unknown } = JSON.parse(saved);
        if (
          preferences.density === "Комфортная" ||
          preferences.density === "Компактная"
        ) {
          density.value = preferences.density;
        }
      } catch (error) {
        console.error("Не удалось прочитать настройки интерфейса.", error);
        window.localStorage.removeItem(storageKey);
      }
    }
    hydrated.value = true;
  }

  function setDensity(value: ListDensity) {
    density.value = value;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ density: value }),
      );
    }
  }

  return { density, hydrated, hydrate, setDensity };
});
