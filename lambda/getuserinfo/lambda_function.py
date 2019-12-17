import boto3
import botocore.exceptions
import hmac
import hashlib
import base64
import json
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb')
USER_POOL_ID = 'yonom-userpool'
CLIENT_ID = 'kl25vtfc3jnpeb2akm4p8k379'
userstable = dynamodb.Table('Users')
def lambda_handler(event, context):
    client = boto3.client('cognito-idp')
    access_token = event['headers']['access_token']
    response = client.get_user(
        AccessToken=access_token
    )
    userid = response['Username']
    userinfo = userstable.query(
        KeyConditionExpression=Key('id').eq(userid)
    )['Items'][0]
    
    return {
        'statusCode': 200, 
        'headers': {}, 
        'body': userinfo
    }
