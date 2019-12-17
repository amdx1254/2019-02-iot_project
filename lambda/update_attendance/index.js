const doc = require('dynamodb-doc'); 
const dynamo = new doc.DynamoDB(); 
const AWS = require("aws-sdk");
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();




exports.handler = (event, context, callback) => { 
    // 헤더의 access_token을 이용해 사용자 정보를 가져온다.
    var params = {
      AccessToken: event.headers.access_token
    };
    // lecture_id 파라미터가 들어와이써야함.
    var userinfo;
    if (event.body.lecture_id != null) {
            
        cognitoidentityserviceprovider.getUser(params, function(err, userinfo) {
            if(!err) {
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
                    // 학생일 경우!

                     if (userdata.Items[0].type == "student") {
                         
                         var attendance_param = {
                                TableName: 'attendance',
                                FilterExpression: "#stid = :stid and #lccode = :lccode",
                                ExpressionAttributeNames: {
                                    "#lccode": "lecture_code",
                                    "#stid": "student_id"
                                },
                                ExpressionAttributeValues: {
                                    ":lccode": event.body.lecture_id,
                                    ":stid": userinfo.Username
                                }
                            };
                            
                        dynamo.scan(attendance_param, (err, resultdata) => {
                                                
                            // 데이터가 없을 경우
                            if(resultdata.Items.length == 0) {
                                callback(null, { 
                                    'statusCode': 400, 
                                    'headers': {}, 
                                    'body': "No lecture data"
                                }); 
                            }else{
                                callback(null, { 
                                    'statusCode': 200, 
                                    'headers': {}, 
                                    'body': resultdata.Items
                                }); 
                            }
                            
                        });
                        //교수자일경우!
                     } else if(userdata.Items[0].type == "professor") {
                         var attendance_param = {
                                TableName: 'attendance',
                                FilterExpression: "#lccode = :lccode",
                                ExpressionAttributeNames: {
                                    "#lccode": "lecture_code"
                                },
                                ExpressionAttributeValues: {
                                    ":lccode": event.body.lecture_id
                                }
                            };
                        dynamo.scan(attendance_param, (err, resultdata) => {
                            // 데이터가 없을 경우
                            if(resultdata.Items.length == 0) {
                                callback(null, { 
                                    'statusCode': 400, 
                                    'headers': {}, 
                                    'body': "No lecture data"
                                }); 
                            }else{
                                callback(null, { 
                                    'statusCode': 200, 
                                    'headers': {}, 
                                    'body': resultdata.Items
                                }); 
                            }
                        });
                     }
                });
            }
        });
    } else{
        callback(null, { 
            'statusCode': 400, 
            'headers': {}, 
            'body': "No lecture data"
        }); 
    }

};
