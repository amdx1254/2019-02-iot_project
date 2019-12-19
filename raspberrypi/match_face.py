import face_recognition
import json
import cv2
import numpy as np
from datetime import datetime
import os, time
from threading import Thread, Lock
import requests
from PIL import Image
from six import StringIO
import boto3
from botocore.exceptions import ClientError
import json
from os import environ
location = "전B07"

client=boto3.client('rekognition', "ap-northeast-2")

# 얼굴 가여조기
def match_face(imagefile, lecture_num):
    img =  open('savedImage/'+imagefile+'.jpg','rb')
    try:
        response=client.search_faces_by_image(CollectionId=lecture_num,
                                Image={'Bytes':img.read()},
                                FaceMatchThreshold=50,
                                MaxFaces=2)

        faceMatches=response['FaceMatches']
        print ('Matching faces')
        max = 0
        maxindex = -1
        for match in range(len(faceMatches)):
            if max < faceMatches[match]['Similarity']:
                max = faceMatches[match]['Similarity']
                maxindex = match
        if maxindex != -1:
            print ('ExternalId: ' + faceMatches[maxindex]['Face']['ExternalImageId'])
            print ('Similarity: ' + "{:.2f}".format(faceMatches[maxindex]['Similarity']) + "%")
            return faceMatches[maxindex]['Face']['ExternalImageId']
        else:
            print ('Unknown')
            return "Unknown"
        print ()
        img.close()
    except:
        pass

def checkAttence(curtime):
    url = "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/login"
    data = json.dumps({"name":"device", "password":"1Q2w3E4r!@#$"})
    res = requests.post(url, data=data)
    res = res.json()
    id_token = res['data']['id_token']
    access_token = res['data']['access_token']
    headers = {'Authorization':id_token, 'access_token':access_token}
    url = "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/get_lecture_info?location="+location
    res = requests.get(url, headers=headers)
    res = res.json()
    lecture_code = res['body']['lecture_code']
    student_id = match_face(curtime, lecture_code)
    if student_id != "Unknown":
        url = "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test/api/check_attendance"
        data = json.dumps({"lecture_id":lecture_code, "student_id":student_id})
        print(student_id)
        res = requests.post(url, data=data, headers=headers)

video_capture = cv2.VideoCapture(0)

url = "https://ccrvpag5hc.execute-api.ap-northeast-2.amazonaws.com/yonom_test"

# Initialize some variables
face_locations = []
face_encodings = []
face_names = []
tmp_face_len = 0
tmp_time = datetime.now().strftime("%Y%m%d%H%M%S%f")
while True:
    # Grab a single frame of video
    ret, frame = video_capture.read()

    # Resize frame of video to 1/4 size for faster face recognition processing
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)

    # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
    rgb_small_frame = small_frame[:, :, ::-1]

    # Only process every other frame of video to save time
        # Find all the faces and face encodings in the current frame of video
    face_locations = face_recognition.face_locations(rgb_small_frame)

    #process_this_frame = not process_this_frame
    process_this_frame = True

    # Display the results
    if(len(face_locations) == 0):
        tmp_face_len = 0
    for (top, right, bottom, left) in face_locations:
        # Scale back up face locations since the frame we detected in was scaled to 1/4 size
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4
        x = left
        y = top
        w = right - x
        h = bottom - y
        r = max(w, h) / 2
        centerx = x + w / 2
        centery = y + h / 2
        nx = int(centerx - r)
        ny = int(centery - r)
        nr = int(r * 2)
        newimage = frame[ny:ny+nr, nx:nx+nr]
        font = cv2.FONT_HERSHEY_DUPLEX
        now = datetime.now()
        curtime = now.strftime("%Y%m%d%H%M%S%f")
        try:
            if len(face_locations) != tmp_face_len and int(curtime) - int(tmp_time) > 3:
                tmp_face_len = len(face_locations)
                tmp_time = curtime
                cv2.imwrite('savedImage/'+curtime+'.jpg', newimage)
            
                t1 = Thread(target=checkAttence, args=(curtime, ))
                t1.daemon = True
                t1.start()
                    
        except OSError as err:
            os.remove('savedImage/'+curtime+'.jpg')
        else:
            pass
    # Hit 'q' on the keyboard to quit!
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release handle to the webcam
video_capture.release()
cv2.destroyAllWindows()
