import axios from 'axios';
import Cookies from 'js-cookie';

// initial state
const state = {
  user: null,
  isAuthenticated: false,
  authenticationStatus: null,
  idtoken: null,
  accesstoken: null
};

const getters = {
  authenticatedUser: state => state.user,
  isAuthenticated: state => state.isAuthenticated,
  authenticationStatus: state => {
    return state.authenticationStatus
      ? state.authenticationStatus
      : { variant: "secondary" };
  },
  hasAuthenticationStatus: state => {
    return !!state.authenticationStatus;
  },
  getIdToken: state => state.idtoken,
  getAccessToken: state => state.accesstoken,
};

const mutations = {
  setAuthenticationError(state, err) {
    console.log("auth error: "+ err);
    state.authenticationStatus = {
      state: "failed",
      message: err.message,
      variant: "danger"
    };
  },
  clearAuthenticationStatus: state => {
    state.authenticationStatus = null;
  },
  setUserAuthenticated(state, user) {
    state.user = user.user;
    state.idtoken = user.id_token;
    state.access_token = user.access_token;
    //state.authenticationStatus = user;
    state.isAuthenticated = true;
  },
  clearAuthentication(state) {
    state.user = null;
    state.userId = null;
    state.isAuthenticated = false;
    state.idtoken = null;
    state.accesstoken = null;
  }
};

const actions = {
  clearAuthenticationStatus: context => {
    context.commit("clearAuthenticationStatus", null);
  },
  signIn: async (context, params) => {
    console.log("signIn for "+ params.username);
    context.commit("auth/clearAuthenticationStatus", null, { root: true });
    axios.defaults.headers.common['Authorization'] = undefined;
    axios.defaults.headers.common['access_token'] = undefined;
    try {
      //const user = await Auth.signIn(params.username, params.password);
      //context.commit("setUserAuthenticated", user);
      var postdata = {
          name: params.username,
          password: params.password
      }
      axios.post("https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/login", postdata)
      .then(res => {
        console.log(res.data.error);
        if (res.data.error == true){
          context.commit("auth/setAuthenticationError", res.data, { root: true });
        }
        else {
          var user = {
            user: params.username,
            id_token: res.data.data.id_token,
            access_token: res.data.data.access_token
          };
          console.log(user);
          Cookies.set('idtoken', res.data.data.id_token);
          Cookies.set('access_token', res.data.data.access_token);
          context.commit("setUserAuthenticated", user);
        }
          
      });
    } catch (err) {
      console.log(err);
      context.commit("auth/setAuthenticationError", err, { root: true });
    }
  },
  signOut: async context => {
    try {
      axios.defaults.headers.common['Authorization'] = undefined
      axios.defaults.headers.common['access_token'] = undefined
      Cookies.remove('idtoken');
      Cookies.remove('access_token');
      await Auth.signOut();
    } catch (err) {
      console.log("error during sign out: " + err);
    }
    context.commit("auth/clearAuthentication", null, { root: true });
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
