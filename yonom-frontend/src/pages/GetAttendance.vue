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
              <th>시작시간</th>
              <th>요일</th>
              <th>교수</th>
              <!-- and so on -->
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item) in lectures"
              v-bind:key="item.lecture_id"
              @click="show_attendance(item.lecture_id)"
            >
              <td>{{ item.lecture_code }}</td>
              <td>{{ item.lecture_name }}</td>
              <td>{{ item.classroom }}</td>
              <td>{{ item.start_time }}</td>
              <td>{{ item.weekday }}</td>
              <td>{{ item.professor }}</td>
              <!-- and so on -->
            </tr>
          </tbody>
        </table>
        <b-modal ref="att-modal" hide-footer title="출결 상황">
          <div class="d-block text-center">
            <table class="table-hover" v-if="data">
              <thead>
                <tr>
                  <th>학생</th>
                  <th>날짜</th>
                  <th>들어온 시간</th>
                  <th>나간 시간</th>
                  <th>출결</th>
                  <!-- and so on -->
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item) in data"
                  v-bind:key="item.attendance_id"
                >
                  <td>{{ item.student_id }}</td>
                  <td>{{ item.date }}</td>
                  <td>{{ item.incoming_time }}</td>
                  <td>{{ item.outgoing_time }}</td>
                  <td>{{ item.attendance_state }}</td>
                  <!-- and so on -->
                </tr>
              </tbody>
            </table>
            <br>
            <br>
            <b-button v-if="type == 'professor'" type="button" name="button" @click="add_lecture(selected_lecture, datetime12, 'canceled')">휴강추가</b-button><br>
            <b-button v-if="type == 'professor'" type="button" name="button" @click="add_lecture(selected_lecture, datetime12, 'additional')">보강추가</b-button><br>
            <datetime v-if="type == 'professor'" type="datetime" v-model="datetime12" use12-hour></datetime>
          </div>
        </b-modal>
        
      </ul>
    </div>
  </b-container>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";
import Datetime from 'vue-datetime'
import 'vue-datetime/dist/vue-datetime.css'


 
export default {
  name: "HelloWorld2",
  data() {
    return {
      data: null,
      lectures: [],
      type: 'student',
      datetime12: "",
      selected_lecture: ""
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
    this.getuserinfo();
    this.get_lectures();
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
    async get_lectures() {
      const response = await this.$axios({
        method: "get",
        url:
          "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/getlectures"
      });
      this.lectures = response.data.body;
      console.log(this.lectures);
    },
    async show_attendance(lecture_id) {
      const response = await this.$axios({
        method: "get",
        url:
          "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/show_attendance?lecture_id=" +
          lecture_id
      });
      this.data = response.data.body;
      this.selected_lecture = lecture_id;
      this.$refs["att-modal"].show();
    },
    async add_lecture(lecture_id, time, type) {
        var lecdate = new Date(time);  
        var hours = lecdate.getHours();
        var minutes = lecdate.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        var seconds = lecdate.getSeconds();
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        hours = hours < 10 ? '0'+hours : hours;
        minutes = minutes < 10 ? '0'+minutes : minutes;
        seconds = seconds < 10 ? '0'+seconds : seconds;
        var strTime = hours + ':' + minutes + ":" + seconds + ' ' + ampm;
        if (type == "additional") {
            var startdate = lecdate.getMonth()+1 + "/" + lecdate.getDate() + "/" + lecdate.getFullYear() + "  " + strTime;
            console.log(startdate);
            var data = {
                lecture_code: lecture_id,
                time: startdate,
                type: type
            };
            const response = await this.$axios({
                method: "post",
                url:
                "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/add_lecture",
                data: data
            });
        }
        else if(type == "canceled") {
            var startdate = lecdate.getMonth()+1 + "/" + lecdate.getDate() + "/" + lecdate.getFullYear();
            console.log(startdate);
            var data = {
                lecture_code: lecture_id,
                time: startdate,
                type: type
            };
            const response = await this.$axios({
                method: "post",
                url:
                "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/add_lecture",
                data: data
            });
        }
       this.$refs["att-modal"].hide();
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
</style>
