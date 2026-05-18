from rest_framework import status
from rest_framework.test import APITestCase

from .models import Testimonial


class TestimonialsPublicApiTests(APITestCase):
    def test_public_testimonials_list_returns_visible_testimonials_only(self):
        Testimonial.objects.create(
            nom_client='Client Visible',
            fonction_client_fr='Fonction',
            contenu_fr='Très bon service.',
            note=5,
            est_visible=True,
        )
        Testimonial.objects.create(
            nom_client='Client Caché',
            fonction_client_fr='Fonction',
            contenu_fr='Hors ligne.',
            note=4,
            est_visible=False,
        )

        response = self.client.get('/api/testimonials/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nom_client'], 'Client Visible')
