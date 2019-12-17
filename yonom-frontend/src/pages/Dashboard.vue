<template>
  <b-container>
    <div class="b-main-content">
      <h2>잡았다 요놈!!</h2>
      <p>You are logged in as {{ user }}.</p>
<ul>
      <b-button type="button" name="button" @click="show_attendance"> 출석부 조회</b-button><br>
      <transition name="fade">
        <div v-if="att_show">
          <li v-for="record in att_data" v-bind:key='record.attendance_id'>
            {{ record}}
          </li>
        </div>
      </transition><br>

      <b-button type="button" name="button" @click="get_cancelled_lecture"> 휴강 조회</b-button><br>
      <transition name="fade">
        <div v-if="get_cancel_show">
          <li v-for="classInfo in data" :key="classInfo.lecture_id">
            {{ classInfo.lecture_id }} -  {{ classInfo.lecture_name }} -  {{ classInfo.professor }}
          </li>
        </div>
      </transition><br>

      <b-button type="button" name="button" @click="get_additional_lecture"> 보강 조회</b-button><br>
      <transition name="fade">
        <div v-if="get_additional_show">
          <li v-for="classInfo in adata" :key="classInfo.lecture_id">
            {{ classInfo.lecture_id }} -  {{ classInfo.lecture_name }} -  {{ classInfo.professor }}
          </li>
        </div>
      </transition><br>

      <b-button type="button" name="button" @click="open_update"> 출결 수정</b-button><br>
      <transition name="fade">
        <div v-if="upatt_show">
          <label for="student_id">학생 아이디</label>
          <input v-model="student_id" id="student_id"><br>

          <label for="lecture_code">강의코드</label>
          <input v-model="lecture_code" id="lecture_code"><br>

          <label for="date">날짜</label>
          <input v-model="date" id="date"><br>

          <label for="attendance_status">출결</label>
          <input v-model="attendance_status" id="attendance_status"><br>

          <button type="button" name="button" @click="update_attendance">조회</button><br>
          {{upatt_data}}
        </div>
      </transition><br>

      <b-button type="button" name="button" @click="open_adder"> 강의 추가</b-button><br>
      <transition name="fade">
        <div v-if="adder_show">
          <label for="lecture_id">강의 아이디</label>
          <input v-model="lecture_id" id="lecture_id"><br>

          <label for="classroom">강의실</label>
          <input v-model="classroom" id="classroom"><br>

          <label for="end_time">종료시간</label>
          <input v-model="end_time" id="end_time"><br>

          <label for="isAdditional">보강여부</label>
          <input v-model="isAdditional" id="isAdditional"><br>

          <label for="isCancelled">휴강여부</label>
          <input v-model="isCancelled" id="isCancelled"><br>

          <label for="lecture_name">강의명</label>
          <input v-model="lecture_name" id="lecture_name"><br>

          <label for="professor">교수명</label>
          <input v-model="professor" id="professor"><br>

          <label for="start_time">시작시간</label>
          <input v-model="start_time" id="start_time"><br>

          <label for="weekday">요일</label>
          <input v-model="weekday" id="weekday"><br>

          <button type="button" name="button" @click="add_lecture">추가</button><br>
          {{adder_data}}
        </div>
      </transition><br>

      <b-button type="button" name="button" @click="open_del"> 강의 삭제</b-button><br>
      <transition name="fade">
        <div v-if="del_show">
          <label for="lecture_id">강의 아이디</label>
          <input v-model="lecture_id" id="lecture_id"><br>

          <button type="button" name="button" @click="delete_lecture">삭제</button><br>
          {{del_data}}
        </div>
      </transition><br>

    </ul>
    </div>
  </b-container>
</template>

<script>
import { mapState } from "vuex";
import axios from 'axios';
export default {
  name: 'HelloWorld2',
  data () {
    return {
      data: null,
      get_cancel_show: false,
      adata:null,
      get_additional_show: false,
      att_data: null,
      att_show:false,
      lecture_id: '',
      upatt_show: false,
      upatt_data: null,
      student_id: '',
      lecture_code: '',
      date: '',
      attendance_status: '',
      classroom: '',
      end_time:'',
      isAdditional: '',
      isCancelled: '',
      lecture_name:'',
      professor: '',
      start_time: '',
      weekday:'',
      adder_show: false,
      adder_data: null,
      del_show: false,
      del_data: null
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      access_token: state => state.auth.access_token,
      id_token: state => state.auth.idtoken
    })
  },
  methods: {
    async get_cancelled_lecture() {
      const response = await this.$axios({
        method: 'get',
        url: 'https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/get_cancelled_lecture'
      });
      this.data = response.data.body.Items;
      this.get_cancel_show = !this.get_cancel_show;
    },

    async get_additional_lecture() {
      const response = await this.$axios({
        method: 'get',
        url: 'https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/get_additional_lecture'
      });
      this.adata = response.data.body.Items;
      this.get_additional_show = !this.get_additional_show;
    },

    async show_attendance() {
      const response = await this.$axios({
        method: 'get',
        url: 'https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/show_attendance?lecture_id=CSE437'
      });
      this.att_data = response.data.body;
      this.att_show = !this.att_show;
    },

    async update_attendance() {
      const response = await this.$axios({
        method: 'post',
        url: 'https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/update_attendance',
        data:{
          student_id: this.student_id,
          lecture_code: this.lecture_code,
          date: this.date,
          attendance_status: this.attendance_status
        }
      });
      this.upatt_data = response.data.body;
      //this.upatt_show = !this.upatt_show;
    },

    async add_lecture() {
      const response = await this.$axios({
        method: 'post',
        url: 'https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/add_lecture',
        data:{
          "TableName": "Lecture",
          "Item":{
            "lecture_id": this.lecture_id,
            "classroom": this.classroom,
            "end_time": this.end_time,
            "isAdditional": this.isAdditional,
            "isCancelled": this.isCancelled,
            "lecture_name": this.lecture_name,
            "professor": this.professor,
            "start_time": this.start_time,
            "weekday": this.weekday
          }
        }
      });
      this.adder_data = response.data.body;
      //this.upatt_show = !this.upatt_show;
    },

    async delete_lecture() {
      const response = await this.$axios({
        method: 'delete',
        url: 'https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/delete_lecture',
        data:{
          "TableName": "Lecture",
          "Key":{
            "lecture_id": this.lecture_id
          }
        }
      });
      this.del_data = response.data.body;
    },

    open_update(){
      this.upatt_show = !this.upatt_show;
    },

    open_adder(){
      this.adder_show = !this.adder_show;
    },

    open_del(){
      this.del_show = !this.del_show;
    },
  }
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
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
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
