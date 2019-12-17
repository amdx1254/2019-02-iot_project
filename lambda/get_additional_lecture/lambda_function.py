import json
import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb')
lecturetable = dynamodb.Table('Lecture')
userstable = dynamodb.Table('Users')
cognito = boto3.client('cognito-idp')
print('Loading function')
USER_POOL_ID = 'yonom-userpool'
CLIENT_ID = 'kl25vtfc3jnpeb2akm4p8k379'

def lambda_handler(event, context):
    access_token = event['headers']['access_token']
    
    userid = cognito.get_user(
        AccessToken=access_token
    )['Username']
    
    userinfo = userstable.query(
        KeyConditionExpression=Key('id').eq(userid)
    )['Items'][0]
    i = 0
    res = []
    for item in userinfo['lecture_id']:
        response = lecturetable.scan(
            FilterExpression=Attr('lecture_id').eq(item)
        )
        result = {}
        
        result['lecture_id'] = response['Items'][0]['lecture_id']
        result['classroom'] = response['Items'][0]['classroom']
        result['lecture_name'] = response['Items'][0]['lecture_name']
        result['professor'] = response['Items'][0]['professor']
        for add in response['Items'][0]['additional_lectures']:
            result['index'] = i
            result['add'] = add
            i+=1
            res.append(result)
    return {
        'statusCode': 200, 
        'headers': {}, 
        'body': res
    }
