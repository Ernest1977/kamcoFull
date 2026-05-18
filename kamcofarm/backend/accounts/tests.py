from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from produits.models import ProduitAgricole

User = get_user_model()


class AccountsApiTests(APITestCase):
    def setUp(self):
        self.username = 'testuser'
        self.password = 'Password123!'
        self.user = User.objects.create_user(
            username=self.username,
            email='testuser@example.com',
            password=self.password,
        )
        self.admin = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='AdminPass123!',
            role='ADMIN',
            is_staff=True,
            is_superuser=False,
        )
        self.token_url = '/api/auth/token/'
        self.me_url = '/api/accounts/me/'
        self.utilisateurs_url = '/api/accounts/utilisateurs-disponibles/'
        self.profile_url = '/api/accounts/modifier-profil/'
        self.password_url = '/api/accounts/changer-mot-de-passe/'
        self.user_create_url = '/api/accounts/users/'
        self.product_list_url = '/api/produits/'

    def authenticate(self, username, password):
        response = self.client.post(self.token_url, {
            'username': username,
            'password': password,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    def test_public_docs_and_schema_are_available(self):
        response = self.client.get('/api/docs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get('/api/schema/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_obtain_token_with_valid_credentials(self):
        response = self.client.post(self.token_url, {
            'username': self.username,
            'password': self.password,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_me_requires_authentication(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_authenticated_user_data(self):
        self.authenticate(self.username, self.password)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.username)
        self.assertEqual(response.data['email'], 'testuser@example.com')

    def test_modifier_profil_updates_user_information(self):
        self.authenticate(self.username, self.password)
        response = self.client.patch(self.profile_url, {
            'first_name': 'Jean',
            'last_name': 'Dupont',
            'email': 'jean.dupont@example.com',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Jean')
        self.assertEqual(response.data['email'], 'jean.dupont@example.com')

    def test_change_password_flow(self):
        self.authenticate(self.username, self.password)
        response = self.client.post(self.password_url, {
            'ancien_mot_de_passe': self.password,
            'nouveau_mot_de_passe': 'NewPassword123!',
            'confirmation': 'NewPassword123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

        self.client.credentials()  # clear old auth
        response = self.client.post(self.token_url, {
            'username': self.username,
            'password': 'NewPassword123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_user_creation_requires_admin_role(self):
        self.authenticate(self.username, self.password)
        response = self.client.post(self.user_create_url, {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'UserPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_user_via_api(self):
        self.authenticate('adminuser', 'AdminPass123!')
        response = self.client.post(self.user_create_url, {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'UserPass123!',
            'role': 'COMM',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newuser')
        self.assertEqual(response.data['role'], 'COMM')

    def test_product_list_is_public(self):
        ProduitAgricole.objects.create(
            nom='Test produit',
            type_produit='ANANAS',
            description_fr='Un produit agricole test.',
            prix_unitaire_fcfa='1000.00',
            stock_kg=10,
        )

        response = self.client.get(self.product_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nom'], 'Test produit')
