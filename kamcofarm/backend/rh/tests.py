from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date

from accounts.models import User
from .models import Employe, Departement, DemandeConge


class RhApiTests(APITestCase):
    def setUp(self):
        # Create department
        self.departement = Departement.objects.create(
            nom='IT Department',
            description='Information Technology'
        )

        # Create RH user
        self.rh_user = User.objects.create_user(
            username='rhuser',
            email='rh@example.com',
            password='RhPass123!',
            role='RH',
            is_staff=True,
        )

        # Create employee user
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='EmpPass123!',
            role='EMPLOYE',
            first_name='John',
            last_name='Doe'
        )

        # Create employee profile
        self.employee = Employe.objects.create(
            user=self.employee_user,
            poste='Developer',
            departement=self.departement,
            date_embauche=date.today(),
            salaire_base=50000.00
        )

        # Create some leave requests
        self.conge1 = DemandeConge.objects.create(
            employe=self.employee,
            type_conge='ANNUEL',
            date_debut=date(2024, 12, 20),
            date_fin=date(2024, 12, 25),
            nombre_jours=6,
            motif='Vacances de Noël'
        )
        self.conge2 = DemandeConge.objects.create(
            employe=self.employee,
            type_conge='MALADIE',
            date_debut=date(2024, 11, 15),
            date_fin=date(2024, 11, 16),
            nombre_jours=2,
            motif='Grippe'
        )

        self.token_url = '/api/auth/token/'
        self.dashboard_url = '/api/rh/dashboard/'
        self.mes_conges_url = '/api/rh/mes-conges/'

    def authenticate_rh(self):
        response = self.client.post(self.token_url, {
            'username': self.rh_user.username,
            'password': 'RhPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def authenticate_employee(self):
        response = self.client.post(self.token_url, {
            'username': self.employee_user.username,
            'password': 'EmpPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_rh_dashboard_requires_authentication(self):
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rh_dashboard_allows_rh_user(self):
        self.authenticate_rh()
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_employes', response.data)
        self.assertIn('total_departements', response.data)

    def test_mes_conges_requires_authentication(self):
        response = self.client.get(self.mes_conges_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mes_conges_returns_employee_leaves(self):
        self.authenticate_employee()
        response = self.client.get(self.mes_conges_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # Check that the response contains the leave requests
        conge_types = [conge['type_conge'] for conge in response.data]
        self.assertIn('ANNUEL', conge_types)
        self.assertIn('MALADIE', conge_types)
