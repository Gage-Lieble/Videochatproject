from django.urls import path
from . import views

app_name = 'videoapp'
urlpatterns = [
    path('', views.index, name="index"),
    path('room/', views.room, name='room'),
    path('gettoken/', views.getToken, name='gettoken'),
    path('create_member/', views.createMember, name='createmember'),
    path('get_member/', views.getMember, name='getmember'),
    path('delete_member/', views.deleteMember, name='deletemember'),
]
