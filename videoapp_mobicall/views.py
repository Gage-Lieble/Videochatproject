from django.shortcuts import render
from django.http import JsonResponse
from agora_token_builder import RtcTokenBuilder
import random
import time
import json
from .models import *
from django.views.decorators.csrf import csrf_exempt

# Create your views here.

def getToken(request):
    appId = '140ae2d8a4934597a0301643f0b072de'
    appCertificate = '97a4f5a29ab44520a38b00dfcf29fce1'
    channelName = request.GET.get('channel')
    uid = random.randint(1, 230)
    expirationTimeInSecs = 3600 * 24
    currentTimeStamp = int(time.time())
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSecs
    role = 1
    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    context = {
        'token': token,
        'uid': uid
    }
    return JsonResponse(context, safe=False)


def index(request):
    return render(request, 'mobicall/index.html')

def room(request):
        return render(request, 'mobicall/room.html')

@csrf_exempt
def createMember(request):
    data = json.loads(request.body)
    member, created = RoomMember.objects.get_or_create(
        name = data['name'],
        uid = data['UID'],
        room_name = data['room_name']
    )
    return JsonResponse({'name':data['name']}, safe=False)


def getMember(request):
    uid = request.GET.get('UID')
    room_name = request.GET.get('room_name')

    member = RoomMember.objects.get(
        uid=uid,
        room_name=room_name
    )

    name = member.name
    return JsonResponse({'name':member.name}, safe=False)

@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)
    member = RoomMember.objects.get(
        name = data['name'],
        uid=data['UID'],
        room_name=data['room_name']
    )
    member.delete()
    return JsonResponse('Member deleted', safe=False)

