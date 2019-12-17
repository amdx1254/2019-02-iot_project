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
    # for field in ["lecture_code", "type", "index"]:
    #    if not event['body'].get(field):
    #        return {"error": False, "success": True, 'message': f"{field} is not present", "data": None}
    lec_code = event['body']['lecture_code']
    type = event['body']['type']
    index = event['body']['index']
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
                UpdateExpression="REMOVE additional_lectures[%d]" % (index)
            )
        elif type == "canceled":
            lecturetable.update_item(
                Key={
                    'lecture_id': lec_code
                },
                UpdateExpression="REMOVE canceled_lectures[%d]" % (index)
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
