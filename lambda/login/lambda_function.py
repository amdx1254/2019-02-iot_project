import boto3
import botocore.exceptions
import hmac
import hashlib
import base64
import json

CLIENT_ID = 'kl25vtfc3jnpeb2akm4p8k379'

def initiate_auth(client, username, password):
    try:
        resp = client.initiate_auth(
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password},
            ClientId=CLIENT_ID)
    except client.exceptions.NotAuthorizedException:
        return None, "The username or password is incorrect"
    except client.exceptions.UserNotConfirmedException:
        return None, "User is not confirmed"
    except Exception as e:
        return None, e.__str__()
    return resp, None
  
def lambda_handler(event, context):

    client = boto3.client('cognito-idp')
    for field in ["name", "password"]:
        if event.get(field) is None:
            return  {"error": True, 
                "success": False, 
                "message": f"{field} is required", 
                "data": None}
    username = event['name']
    password = event['password']
    print("AAAA")
    print(username)
    print(password)
    
    resp, msg = initiate_auth(client, username, password)
    if msg != None:
        return {'message': msg, 
                "error": True, "success": False, "data": None}
    if resp.get("AuthenticationResult"):
        return {'message': "success", 
                "error": False, 
                "success": True, 
                "data": {
                "id_token": resp["AuthenticationResult"]["IdToken"],
                "refresh_token": resp["AuthenticationResult"]["RefreshToken"],
                "access_token": resp["AuthenticationResult"]["AccessToken"],
                "expires_in": resp["AuthenticationResult"]["ExpiresIn"],
                "token_type": resp["AuthenticationResult"]["TokenType"]
                }}
    else: #this code block is relevant only when MFA is enabled
        return {"error": True, 
                "success": False, 
                "data": None, "message": None}
