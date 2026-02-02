from django.db import models
import uuid

class Case(models.Model):
    PRIORITY_CHOICES = [
        ('P1', 'P1'),
        ('P2', 'P2'),
        ('P3', 'P3'),
        ('P4', 'P4'),
    ]
    STATUS_CHOICES = [
        ('active', 'active'),
        ('assigned', 'assigned'),
        ('resolved', 'resolved'),
    ]
    CATEGORY_CHOICES = [
        ('medical', 'medical'),
        ('fire', 'fire'),
        ('trapped', 'trapped'),
        ('shelter', 'shelter'),
        ('food', 'food'),
        ('water', 'water'),
        ('mental', 'mental'),
        ('other', 'other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    language = models.TextField(default='en')
    location = models.TextField(null=True, blank=True)
    priority = models.CharField(max_length=2, choices=PRIORITY_CHOICES, default='P4')
    urgency_score = models.IntegerField(default=0)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    escalation_needed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    assigned_to = models.TextField(null=True, blank=True)
    last_message = models.TextField(null=True, blank=True)
    triage_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # New columns from migration
    location_text = models.TextField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_source = models.TextField(default='fallback', null=True, blank=True)

    class Meta:
        db_table = 'cases'
        managed = False  # Assume schema is managed by Supabase, but we can set True if we want Django to handle it (but need to be careful with Enums)

    def __str__(self):
        return f"{self.priority} - {self.category} ({self.id})"


class Message(models.Model):
    SENDER_CHOICES = [
        ('user', 'user'),
        ('assistant', 'assistant'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        managed = False

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}"
