const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();

// input: lecture_id, student_id, time
// output: update attendance_state, update incoming_time/outgoing_time 
function calcTime(diff)
{
    var msec = diff;
    var hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    var mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    var ss = Math.floor(msec / 1000);
    msec -= ss * 1000;

    console.log("diff: ", hh + ":" + mm + ":" + ss);
}

function get_time_diff(input_time, target_time, is_new)
{
    var date = input_time.toString().split(' ')[0];
    target_time = date + " " + target_time;
    
    var date1 = new Date(input_time);
    var date2 = new Date(target_time);
    //테스트용
    //var date1 = new Date("12/6/2019, 11:00:00 AM");//중간에 들어온 시간
    //var date2 = new Date("12/6/2019, 11:45:00 AM");//수업종료시간
    
    var temp = new Date(date2.getTime());
    var diff;
    var is_saved = false;
    
    // 출석 or 지각 중 하나로 새 row 생성시 사용, target_time = start_time
    if(is_new){
        
        // 수업시작시간 - 30
        var basetime = temp.setMinutes(temp.getMinutes() - 30);
        var base = new Date(new Date(basetime).toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
        if((date2.getTime() >= date1.getTime()) && (date1.getTime() >= base.getTime())) // 시작 시간 전에 들어옴
        {
            is_saved = true;
        }
    }
    
    // 기존 row의 업데이트, target_time = end_time
    else
    {
        if(date2.getTime() <= date1.getTime()) //종료시간 이후에 나감. 
        {
            is_saved = true;
        }
    }
    
    diff = date2.getTime() > date1.getTime() ? date2.getTime() - date1.getTime() : date1.getTime() - date2.getTime();
    calcTime(diff);

    return  is_saved;
}


exports.handler = (event, context, callback) => {
    
    
    var lec_code = event.body.lecture_id;
    var stu_id = event.body.student_id;
    
    process.env.TZ = 'Asia/Seoul';
    var timezoneDate = new Date(Date.now()).toLocaleString("en-US", {timeZone: "Asia/Seoul"});
    console.log(timezoneDate.toString()); //날짜 + 시간
    var IN_date = timezoneDate.split(',')[0]; // 날짜만 따로 뽑음
    var IN_time = timezoneDate.split(' ')[1] + ' ' +  timezoneDate.split(' ')[2]; // 시간만 따로 뽑음

    var itemCount;
    var is_created;

    
    
    console.log(lec_code, stu_id, IN_date);
     // attendance 테이블에 date, student_id, lecture_code 세트 있는지 확인
    var existance = {
        TableName: "attendance",
        FilterExpression: "#l_code = :lec_content AND #s_id = :stu_content AND #d = :date_content",
        ExpressionAttributeNames: {
            "#l_code": "lecture_code",
            "#s_id": "student_id",
            "#d": "date"
        },
        ExpressionAttributeValues: {
            ":lec_content": lec_code,
            ":stu_content": stu_id,
            ":date_content": IN_date
        }
    };
    
    dynamo.scan(existance, (err, data) => { 
        //total attendance item count
        console.log("HOHOHO"+data);
        itemCount = data.ScannedCount;
        
        console.log("total attendance count: ", itemCount);
        
        // 필터된 count
        is_created = data.Count == 0 ? false : true; 
        console.log("iscreated: ", is_created);  
     
     
        // Lecture 테이블에서 lecture_code 맞는거 찾아서 시작, 종료 시간 가져온다.
         var lec_st_time = {
            TableName: 'Lecture',
            FilterExpression: "#l_code = :lec_code_content",
            ExpressionAttributeNames:{
                "#l_code": "lecture_code",
            },
            ExpressionAttributeValues: {
                ":lec_code_content": lec_code
            }
        };
    
     
        //이미 존재할 경우. 나감(run away) 후 (들어옴(출석 or 지각의 기존 상태)->나감 반복)
        //수업종료시간 후에 나갈 경우 기존 상태(출석/지각) 유지. incoming time < start_time 이면 출석
        if(is_created){
            var is_outgoingNULL = data.Items[0].outgoing_time == "NULL" ? true : false;
            var outgoing_time = data.Items[0].outgoing_time;
            var tmp_time = data.Items[0].tmp_time;
            var incoming_time = data.Items[0].incoming_time;
            var keyval = data.Items[0].attendance_id;
            
            // 수업 종료 시간 전에 입력값 들어옴. status가 출석/지각 이면 출튀, status가 출튀이면 기존상태로 업데이트
            dynamo.scan(lec_st_time, (err, data) => { 
                
                var st_time = data.Items[0].start_time;
                var end_time = data.Items[0].end_time;
                var updateval;
                var additional = data.Items[0].additional_lectures;
                var canceled = data.Items[0].canceled_lectures;
                if (additional.Count > 0) {
                    for (var item ; item < additional.Count ; item++) {
                        var add_start_date = new Date(additional[item][0]);
                        var add_end_date = new Date(additional[item][1]);
                        if (add_start_date.getDate() == timezoneDate.getDate() && add_start_date.getFullYear() == timezoneDate.getFullYear() && add_start_date.getMonth() == timezoneDate.getMonth()) {
                            st_time = add_start_date;
                            end_time = add_end_date;
                        }
                        
                    }
                }
                var canceled_lecture = false;
                if (canceled.Count > 0) {
                    for (var item ; item < canceled.Count ; item++) {
                        var canceldate = new Date(canceled[item] + " 00:00:00 AM");
                        if (canceldate.getDate() == timezoneDate.getDate() && canceldate.getFullYear() == timezoneDate.getFullYear() && canceldate.getMonth() == canceldate.getMonth()) {
                            canceled_lecture = true;
                        }
                        
                    }
                }
                if (!canceled_lecture) {
                    // outgoing_time이 NULL이면 시간넣고 -> input시간이 endtime보다 작으면 status출튀/ endtime보다 크면 기존상태 유지(수업끝나고 나감) 
                    if(is_outgoingNULL)
                    {
                        tmp_time = IN_date + ", " + tmp_time;
                        var t1 = new Date(new Date(tmp_time).toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
                        var tzonedate = new Date(timezoneDate)
                        console.log("TZONEDATE, INCOMINGTIME" + t1 + tzonedate)
                        if ((tzonedate.getTime() - t1.getTime()) / 1000 < 10) {
                                callback(null, { 
                                    'statusCode': 200, 
                                    'headers': {}, 
                                    'body': "NOT SUCCESS"
                                }); 
                        }
                        else{
                            var is_saved = get_time_diff(timezoneDate, end_time, false);
    
                            if(!is_saved) //출튀
                            {
                                updateval = {
                                    "TableName": 'attendance',
                                    "Key": {
                                        'attendance_id': keyval
                                    },
                                    "UpdateExpression": "SET outgoing_time = :outTime_content, attendance_state = :state_content, tmp_time = :tmp_time",
                                    "ExpressionAttributeValues":{
                                        ":outTime_content": IN_time,
                                        ":state_content": "출튀",
                                        ":tmp_time": IN_time
                                    }
                                }
                            }
                            else // 수업끝나고 나감
                            {
                                updateval = {
                                    "TableName": 'attendance',
                                    "Key": {
                                        'attendance_id': keyval
                                    },
                                    "UpdateExpression": "SET outgoing_time = :outTime_content, tmp_time = :tmp_time",
                                    "ExpressionAttributeValues":{
                                        ":outTime_content": IN_time,
                                        ":tmp_time": IN_time
                                    }
                                }
                            }
                            
                            dynamo.updateItem(updateval, function(err, data) {
                                if (err) console.log(err);
                                else console.log(data);
                            });
                            callback(null, { 
                                'statusCode': 200, 
                                'headers': {}, 
                                'body': "SUCCESS"
                            }); 
                        }
                        
                    }
                    
                    // outgoing값이 있으면 NULL(다시 들어옴)하고 incoming이랑 start시간 비교해서 기존상태로 업데이트
                    else
                    {
                         incoming_time = IN_date + ", " + incoming_time;
                         tmp_time =  IN_date + ", " + tmp_time;
                         
                         st_time = IN_date + ", " + st_time;
                         var out_time = new Date(new Date(tmp_time).toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
                         var tzonedate = new Date(timezoneDate)
                         var t1 = new Date(new Date(incoming_time).toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
                         var t2 = new Date(new Date(st_time).toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
                         console.log("TZONEDATE, OUTTIME" + out_time + tzonedate)
                         if ((tzonedate.getTime() - out_time.getTime()) / 1000 < 10) {
                                callback(null, { 
                                    'statusCode': 200, 
                                    'headers': {}, 
                                    'body': "NOT SUCCESS"
                                }); 
                        } else{
                            // 출석
                             if(t1.getTime() <= t2.getTime())
                             {
                                 updateval = {
                                    "TableName": 'attendance',
                                    "Key": {
                                        'attendance_id': keyval
                                    },
                                    "UpdateExpression": "SET outgoing_time = :outTime_content, attendance_state = :state_content, tmp_time = :tmp_time",
                                    "ExpressionAttributeValues":{
                                        ":outTime_content": "NULL",
                                        ":state_content": "출석",
                                        ":tmp_time": IN_time
                                    }
                                }
                             }
                             // 지각
                             else
                             {
                                 updateval = {
                                    "TableName": 'attendance',
                                    "Key": {
                                        'attendance_id': keyval
                                    },
                                    "UpdateExpression": "SET outgoing_time = :outTime_content, attendance_state = :state_content, tmp_time = :tmp_time",
                                    "ExpressionAttributeValues":{
                                        ":outTime_content": "NULL",
                                        ":state_content": "지각",
                                        ":tmp_time": IN_time
                                    }
                                }
                             }
                             dynamo.updateItem(updateval, function(err, data) {
                                if (err) console.log(err);
                                else console.log(data);
                            });
                            callback(null, { 
                                'statusCode': 200, 
                                'headers': {}, 
                                'body': "SUCCESS"
                            }); 
                        }
                         
                         
                    }
                }

                
            
            }); 
            
        }
        else // 강의실 처음 들어옴. row생성. 출석 or 지각
        {
            dynamo.scan(lec_st_time, (err, data) => { 
                // lecture 테이블의 lec_code의 시작시간 
                var st_time = data.Items[0].start_time;
                var additional = data.Items[0].additional_lectures;
                var canceled = data.Items[0].canceled_lectures;
                if (additional.Count > 0) {
                    for (var item ; item < additional.Count ; item++) {
                        var add_start_date = new Date(additional[item][0]);
                        if (add_start_date.getDate() == timezoneDate.getDate() && add_start_date.getFullYear() == timezoneDate.getFullYear() && add_start_date.getMonth() == timezoneDate.getMonth()) {
                            st_time = add_start_date;
                        }
                        
                    }
                }
                var canceled_lecture = false;
                if (canceled.Count > 0) {
                    for (var item ; item < canceled.Count ; item++) {
                        var canceldate = new Date(canceled[item] + " 00:00:00 AM");
                        if (canceldate.getDate() == timezoneDate.getDate() && canceldate.getFullYear() == timezoneDate.getFullYear() && canceldate.getMonth() == canceldate.getMonth()) {
                            canceled_lecture = true;
                        }
                        
                    }
                }
                if (!canceled_lecture) {
                    // compare time
                    var is_saved = get_time_diff(timezoneDate, st_time, true);
    
                    var new_row; 
                    // 지각안하고 출석했을 경우
                    if(is_saved){
                        new_row = { 
                            TableName: 'attendance',
                            Item: {
                                "attendance_id": String(itemCount + 1), 
                                "attendance_state": "출석",
                                "date":IN_date,
                                "incoming_time":IN_time,
                                "lecture_code":lec_code,
                                "outgoing_time":"NULL",
                                "student_id":stu_id,
                                "tmp_time":IN_time
                            }
                        }
                    }
                    // 지각
                    else
                    {
                         new_row = { 
                            TableName: 'attendance',
                            Item: {
                                "attendance_id": String(itemCount + 1), 
                                "attendance_state": "지각",
                                "date":IN_date,
                                "incoming_time":IN_time,
                                "lecture_code":lec_code,
                                "outgoing_time":"NULL",
                                "student_id":stu_id,
                                "tmp_time":IN_time
                            }
                        }
                    }
                    
                    dynamo.putItem(new_row, function(err, data) {
                          if (err) {
                            console.log("Error", err);
                          } else {
                            console.log("Success", data);
                          }
                    });
                        callback(null, { 
                            'statusCode': 200, 
                            'headers': {}, 
                            'body': "SUCCESS"
                        }); 
                    

                }
               
            }); 
        }
    }); 

};


// var dateObj = new Date();
// const theDate = dateObj;
// const day = theDate.getUTCDate();
// const month = theDate.getUTCMonth()+1;
// const twoDigitMonth = month<10? "0" + month: month;
// const twoDigitYear = theDate.getUTCFullYear().toString().substr(2);
// const hours = theDate.getUTCHours();
// const mins = theDate.getUTCMinutes();
// const seconds = theDate.getUTCSeconds();
// const formattedDate = `${day}${twoDigitMonth}${twoDigitYear}-${hours}${mins}${seconds}`;

