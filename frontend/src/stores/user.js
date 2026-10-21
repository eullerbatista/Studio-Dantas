import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    email: null,
    token: null,
  }),
  actions: {
    login(email, token) {
      this.email = email;
      this.token = token;
    },
    logout() {
      this.email = null;
      this.token = null;
    },
  },
});
