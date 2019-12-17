const doc = require('dynamodb-doc'); 
const dynamo = new doc.DynamoDB(); 
const AWS = require("aws-sdk");
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();




exports.handler = (event, context, callback) => { 
    // 헤더의 access_token을 이용해 사용자 정보를 가져온다.
    process.env.TZ = 'Asia/Seoul';
    var params = {
      AccessToken: event.headers.access_token
    };
    
    // lecture_id 파라미터가 들어와쓸 경우 lecture_id에 해당하는 코드를 가진 강의 정보를 반환해준다.
    var userinfo;

    if (event.body.lecture_id != null) {
            
        var param = {
            TableName: 'Lecture',
            FilterExpression: "#lcid = :lcid",
            ExpressionAttributeNames: {
                "#lcid": "lecture_code"
            },
            ExpressionAttributeValues: {
                ":lcid": event.body.lecture_id
            }
        };
        dynamo.scan(param, (err, lecturedata) => {
            callback(null, { 
                'statusCode': 200, 
                'headers': {}, 
                'body': lecturedata.Items[0]
            }); 
        });
    }
    // 없을경우
    else {
        // 사용자 정보를 가져온다.
        cognitoidentityserviceprovider.getUser(params, function(err, userinfo) {
          if (err) console.log(err, err.stack); // an error occurred
          else{
            //Users 테이블에서 ID에 해당하는 사람의 사용자 정보를 가져온다.
            var params = {
                TableName: 'Users',
                FilterExpression: "#stid = :stid",
                ExpressionAttributeNames: {
                    "#stid": "id"
                },
                ExpressionAttributeValues: {
                     ":stid": userinfo.Username
                }
            };
            dynamo.scan(params, (err, userdata) => {
                if(!err) {
                    // 가져왔는데 데이터가 학생이거나 교수일경우
                    if (userdata.Items[0].type == "student" || userdata.Items[0].type == "professor") {
                        var lecture_array = userdata.Items[0].lecture_id; // 학생이나 교수가 듣는 강의를 배열로 가져옴
                        var lecture_codes = [];
                        var num = 0; // synchronous하게 수행되는것처럼 만들기 위해 사
                        var arraylength = lecture_array.length;
                        // 각각의 강의에 대해서 Lecture정보를 db에서 검색해옴
                        lecture_array.forEach(function(item) {
                            var param = {
                                TableName: 'Lecture',
                                FilterExpression: "#lcid = :lcid",
                                ExpressionAttributeNames: {
                                    "#lcid": "lecture_code"
                                },
                                ExpressionAttributeValues: {
                                    ":lcid": item
                                }
                            };
                            dynamo.scan(param, (err, lecturedata) => {
                                // 검색한 후 lecture_codes 배열에 넣어줌.
                                lecture_codes.push(lecturedata.Items[0]);
                                // synchronous하게 수행하기 위해서 넣은 수 측정
                                num++;
                                // 길이만큼 넣었을 경우 학생이나 교수가 담당하는 강의 정보들 반환
                                if(num == arraylength) {
                                    callback(null, { 
                                            'statusCode': 200, 
                                            'headers': {}, 
                                            'body': lecture_codes
                                         }); 
                                }
                            });
                        });
                    } else { // 학생이나 교수가 아닐경우(기계임)
                    // 시간 계싼을 위한 변수들
                    process.env.TZ = 'Asia/Seoul';
                        var koreatime = 9 * 60 * 60 * 1000;
                        var datetime = new Date(Date.now() + koreatime);
                        var week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        var dayOfWeek = week[datetime.getDay()];
                        var year = datetime.getFullYear();
                        var month = datetime.getMonth();
                        var date = datetime.getDate();
                        var hour = datetime.getHours();
                        var min = datetime.getMinutes();
                        // Lecture테이블의 모든 데이터를 가져온다.(시간 단위로 쿼리수행하는법을 모르겠음)
                        var params = {
                            TableName: 'Lecture',
                        };
                        dynamo.scan(params, (err, lecdata) => {
                            var items = lecdata.Items;
                            // 모든 lecture데이터에 대해
                            items.forEach(function(item) {
                                if(item.classroom == event.body.location) {
                                    // 파라미터로 넘어온 강의실 정보가 강의정보테이블 아이템의 강의실과 일치할 경우
                                    // 날짜를 찾는다.
                                    var found = false; // 찾았는지 확인용도
                                    // 강의실 정보가 리스트형태로 되어있을 경우. 리스트의 값들중 현재 요일과 같은 값이 있는지 확인
                                    if (typeof(item.weekday) == "object") {
                                        item.weekday.forEach(function(weekday) {
                                           if (weekday == dayOfWeek) found = true;
                                        });
                                    }
                                    // 아닐 경우 일반 요일스트링값임. 그 값이 현재 요일과 같은지 확인
                                    else if(item.weekday == dayOfWeek) {
                                        found = true;
                                    }
                                    
                                    // 찾았을경우
                                    if (found == true) {
                                        // 강의 정보의 시작시간, 끝시간을 자바스크립트의 Date형식의 현재날짜를 넣어 만들어줌
                                        // 휴강인가 확인
                                        
                                        var is_canceled = false
                                        var canceled = item.canceled_lectures;
                                        for (var i = 0; i < canceled.Count; i++) {
                                            if ((Number(month)+1)+'/'+date+'/'+year == canceled[i]) {
                                                is_canceled = true
                                            }
                                        }
                                       
                                        if (!is_canceled){
                                             
                    
                                            var startdate = new Date((Number(month)+1)+'/'+date+'/'+year+', '+item.start_time);
                                            var enddate = new Date((Number(month)+1)+'/'+date+'/'+year+', '+item.end_time);
                                            startdate.setMinutes(startdate.getMinutes()-10); // 시작시간 10분전으로 만들어줌
                                            // 시작시간과 끝시간 사이에 현재 시간이 있을 경우 렉처 아이템 반환
                                            if (datetime >= startdate && datetime <= enddate) {
                                                callback(null, { 
                                                    'statusCode': 200, 
                                                    'headers': {}, 
                                                    'body': item
                                                }); 
                                            }
                                        }
                                        
                                    }
                                    // 못찾았을 경우 보강 내역 확인
                                    var add_lectures = item.additional_lectures;
                                    for (var i = 0; i < add_lectures.Count; i++) {
                                        var startdate = new Date(add_lectures[i][0]);
                                        var enddate = new Date(add_lectures[i][1]);
                                        startdate.setMinutes(startdate.getMinutes()-10); // 시작시간 10분전으로 만들어줌
                                        // 시작시간과 끝시간 사이에 현재 시간이 있을 경우 렉처 아이템 반환
                                        if (datetime >= startdate && datetime <= enddate) {
                                            callback(null, { 
                                                'statusCode': 200, 
                                                'headers': {}, 
                                                'body': item
                                            }); 
                                        }
                                    }
                                }
                            });
                            // 안됬을경우 못찾았따고 반환(현재 강의하는 강의가 없음)
                            callback(null, { 
                                'statusCode': 404, 
                                'headers': {}, 
                                'body': "Not found"
                            }); 
                            
                        });
                        
                    }
                }
            });
          }                // successful response
        });
    }

};
