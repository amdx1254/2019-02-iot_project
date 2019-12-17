import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import App from "@/App.vue";
import router from "@/router";
import store from "@/store";
import axios from 'axios';
Vue.use(BootstrapVue);
Vue.prototype.$axios = axios;
Vue.config.productionTip = false;
new Vue({
  router,
  store,
  el: "#app",
  render: h => h(App)
});
