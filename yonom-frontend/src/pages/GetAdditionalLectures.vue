<template>
  <b-container>
    <div class="b-main-content">
      <h2>잡았다 요놈!!</h2>
      <p>You are logged in as {{ user }}.</p>
      <ul>
        <table class="table-hover" v-if="lectures">
          <thead>
            <tr>
              <th>학수번호</th>
              <th>강의명</th>
              <th>위치</th>
              <th>보강날짜</th>
              <th>교수</th>
              <th v-if="type=='professor'">삭제</th>
              <!-- and so on -->
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item) in lectures"
              v-bind:key="item.lecture_id"
            >
              <td>{{ item.lecture_id }}</td>
              <td>{{ item.lecture_name }}</td>
              <td>{{ item.classroom }}</td>
              <td>{{ item.add }}</td>
              <td>{{ item.professor }}</td>
              <th v-if="type=='professor'"><b-button v-if="type == 'professor'" type="button" name="button" @click="delete_lecture(item.lecture_id, item.index, 'additional')">삭제</b-button><br></th>
              <!-- and so on -->
            </tr>
          </tbody>
        </table>
      </ul>
    </div>
  </b-container>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";
import Cookies from 'js-cookie'
export default {
  name: "HelloWorld2",
  data() {
    return {
      data: null,
      lectures: [],
      type: 'student'
    };
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      access_token: state => state.auth.access_token,
      id_token: state => state.auth.idtoken
    })
  },
  created() {
    var access_token = Cookies.get('access_token');
    var id_token = Cookies.get('idtoken');
    axios.defaults.headers.common['Authorization'] = `Bearer ${id_token}`;
    axios.defaults.headers.common['access_token'] = `${access_token}`;
    this.getuserinfo();
    this.get_canceled_lectures();
  },
  methods: {
    async getuserinfo() {
      const response = await this.$axios({
        method: "get",
        url:
          "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/getuserinfo"
      });
      this.type = response.data.body.type;
      console.log(response);
    },
    async get_canceled_lectures() {
      const response = await this.$axios({
        method: "get",
        url:
          "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/get_additional_lecture"
      });
      this.lectures = response.data.body;
      console.log(this.lectures);
    },
    async delete_lecture(lecture_id, index, type) {
        if (type == "additional") {
            var data = {
                lecture_code: lecture_id,
                type: type,
                index: index
            };
            const response = await this.$axios({
                method: "post",
                url:
                "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/delete_lecture",
                data: data
            });
        }
        else if(type == "canceled") {
            var data = {
                lecture_code: lecture_id,
                type: type,
                index: index
            };
            const response = await this.$axios({
                method: "post",
                url:
                "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/delete_lecture",
                data: data
            });
        }
        this.get_canceled_lectures();
    }
    
  }
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
  table {
    width: 100%;
    border-top: 1px solid #444444;
    border-collapse: collapse;
  }
  th, td {
    border-bottom: 1px solid #444444;
    padding: 10px;
  }
</style>
