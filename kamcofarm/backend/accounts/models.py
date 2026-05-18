from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('DIR', 'Directeur Général'),
        ('RH', 'Ressources Humaines'),
        ('COMPTA', 'Comptable'),
        ('COMM', 'Commercial'),
        ('LOG', 'Logistique'),
        ('AGRI', 'Agent terrain'),
        ('VISITOR', 'Visiteur'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='VISITOR')
    phone = models.CharField(max_length=30, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"