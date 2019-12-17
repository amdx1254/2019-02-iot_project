import Vue from "vue";
import Router from "vue-router";
import Home from "@/pages/Home.vue";
import SignIn from "@/pages/auth/SignIn.vue";
import SignOut from "@/pages/auth/SignOut.vue";
import GetAttendance from "@/pages/GetAttendance.vue";
import GetCanceledLectures from "@/pages/GetCanceledLectures.vue";
import GetAdditionalLectures from "@/pages/GetAdditionalLectures.vue";
import store from "@/store";
import Cookies from 'js-cookie'
Vue.use(Router);

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
    meta: { title: "Home", auth: false }
  },
  {
    path: "/signIn",
    name: "signIn",
    component: SignIn,
    meta: { title: "Sign In", auth: false }
  },
  {
    path: "/signOut",
    name: "signOut",
    component: SignOut,
    meta: { title: "Sign Out", auth: true }
  },
  {
    path: "/getatt",
    name: "getatt",
    component: GetAttendance,
    meta: { title: "출결 상황", auth: true }
  }
  ,
  {
    path: "/getcanceledlecture",
    name: "getcanceledlecture",
    component: GetCanceledLectures,
    meta: { title: "휴강 조회", auth: true }
  }  ,
  {
    path: "/getaddedlecture",
    name: "getaddedlecture",
    component: GetAdditionalLectures,
    meta: { title: "휴강 조회", auth: true }
  }
];

const router = new Router({ mode: "history", routes });

// this routine will ensure that any pages marked as `auth` in the `meta` section are
// protected from access by unauthenticated users.
router.beforeEach((to, from, next) => {
  // Use the page's router title to name the page
  if (to.meta && to.meta.title) {
    document.title = to.meta.title;
  }

  // is there a meta and auth attribute?
  if (to.meta && to.meta.auth !== undefined) {
    // if the page requires auth
    if (to.meta.auth) {
      // and we are authenticated?
      if (store.getters["auth/isAuthenticated"]) {
        next(); // route normally
        return;
      }
      // otherwise off to the sign in page
      router.push({ name: "signIn" });
      return;
    }
    // otherwise are we already authenticated?
    if (store.getters["auth/isAuthenticated"]) {
      // yes we are, so off to dashboard
      router.push({ name: "getatt" });
      return;
    }
    next(); // route normally
    return;
  }
  next(); // route normally
  return;
});

export default router;
