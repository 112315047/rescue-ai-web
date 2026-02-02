from rest_framework import serializers
from .models import Case, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class CaseSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
