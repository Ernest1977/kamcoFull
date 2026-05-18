from rest_framework import status
from rest_framework.test import APITestCase

from .models import Partenaire


class PartnersPublicApiTests(APITestCase):
    def test_public_partners_list_returns_visible_partners_only(self):
        Partenaire.objects.create(
            nom='Visible Partner',
            type_partenaire='AUTRE',
            est_visible=True,
        )
        Partenaire.objects.create(
            nom='Hidden Partner',
            type_partenaire='AUTRE',
            est_visible=False,
        )

        response = self.client.get('/api/partners/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nom'], 'Visible Partner')
