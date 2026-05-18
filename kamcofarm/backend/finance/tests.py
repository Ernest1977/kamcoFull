from datetime import date
from rest_framework import status
from rest_framework.test import APITestCase
from decimal import Decimal

from accounts.models import User
from .models import DemandeDevis, Facture


class FinanceApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='comptauser',
            email='compta@example.com',
            password='ComptaPass123!',
            role='COMPTA',
            is_staff=True,
        )

        # Create some sample invoices
        self.facture1 = Facture.objects.create(
            client_nom='Client A',
            client_entreprise='Entreprise A',
            client_email='clienta@example.com',
            montant_ht=100000.00,
            tva_pourcentage=19.25,
            devise='FCFA',
            date_emission=date.today(),
            date_echeance=date.today(),
            creee_par=self.user
        )
        self.facture2 = Facture.objects.create(
            client_nom='Client B',
            client_entreprise='Entreprise B',
            client_email='clientb@example.com',
            montant_ht=50000.00,
            tva_pourcentage=19.25,
            devise='FCFA',
            date_emission=date.today(),
            date_echeance=date.today(),
            creee_par=self.user
        )

        self.token_url = '/api/auth/token/'
        self.test_url = '/api/finance/test/'
        self.devis_url = '/api/finance/creer-demande-devis/'
        self.factures_url = '/api/finance/factures/'

    def authenticate(self):
        response = self.client.post(self.token_url, {
            'username': self.user.username,
            'password': 'ComptaPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_finance_test_endpoint_requires_finance_role(self):
        response = self.client.get(self.test_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_finance_test_endpoint_allows_compta(self):
        self.authenticate()
        response = self.client.get(self.test_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Confidentiel - Accès Finance OK')
        self.assertEqual(response.data['user'], self.user.username)

    def test_creer_demande_devis_public_endpoint(self):
        response = self.client.post(self.devis_url, {
            'nom_entreprise': 'Ferme Test',
            'nom_contact': 'Pierre',
            'email': 'pierre@example.com',
            'telephone': '+237650000000',
            'produits': 'Ananas, Mangues',
            'quantite_tonnes': '2.50',
            'frequence': 'unique',
            'destination': 'Yaoundé',
            'exigences': 'Livraison rapide',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Demande de devis créée avec succès')
        self.assertTrue(DemandeDevis.objects.filter(nom_contact='Pierre').exists())

    def test_factures_list_requires_authentication(self):
        response = self.client.get(self.factures_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_factures_list_allows_finance_user(self):
        self.authenticate()
        response = self.client.get(self.factures_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Should return both invoices
        # Check that response contains expected fields
        facture_data = response.data[0]
        self.assertIn('numero', facture_data)
        self.assertIn('client_nom', facture_data)
        self.assertIn('montant_ttc', facture_data)

    def test_factures_detail_requires_authentication(self):
        response = self.client.get(f'{self.factures_url}{self.facture1.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_factures_detail_allows_finance_user(self):
        self.authenticate()
        response = self.client.get(f'{self.factures_url}{self.facture1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['numero'], self.facture1.numero)
        self.assertEqual(response.data['client_nom'], 'Client A')
