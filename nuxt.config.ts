export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxt/eslint"],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    databaseUrl: "",
  },
  app: {
    head: {
      title: "WorkFlow — поддержка команды",
      meta: [
        {
          name: "description",
          content: "Заявки, команда и результат — в одном месте.",
        },
        { name: "theme-color", content: "#15132f" },
      ],
    },
  },
});
