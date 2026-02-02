from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, TranscribeView

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='cases')

urlpatterns = [
    path('', include(router.urls)),
    path('transcribe/', TranscribeView.as_view(), name='transcribe'),
]
