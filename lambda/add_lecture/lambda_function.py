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

    for field in ["lecture_code", "time", "type"]:
        if not event['body'].get(field):
            return {"error": False, "success": True, 'message': f"{field} is not present", "data": None}
    #print("Received event: " + json.dumps(event, indent=2))
    time = event['body']['time']
    lec_code = event['body']['lecture_code']
    type = event['body']['type']
    access_token = event['headers']['access_token']
    
    userid = cognito.get_user(
        AccessToken=access_token
    )['Username']
    
    userinfo = userstable.query(
        KeyConditionExpression=Key('id').eq(userid)
    )['Items'][0]

    if userinfo['type'] == "professor":
        if type == "additional":
            lecturetable.update_item(
                Key={
                    'lecture_id': lec_code
                },
                UpdateExpression='set additional_lectures = list_append(additional_lectures, :val)',
                ExpressionAttributeValues={
                    ':val': [time]
                }
            )
        elif type == "canceled":
            lecturetable.update_item(
                Key={
                    'lecture_id': lec_code
                },
                UpdateExpression='set canceled_lectures = list_append(canceled_lectures, :val)',
                ExpressionAttributeValues={
                    ':val': [time]
                }
            )
        return {
            'statusCode': 200, 
            'headers': {}, 
            'body': 'Successfully processed records.'
        }
    else:
        return {
            'statusCode': 404, 
            'headers': {}, 
            'body': 'Not Authorized'
        }
