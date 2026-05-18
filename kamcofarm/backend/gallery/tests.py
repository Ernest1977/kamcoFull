from rest_framework import status
from rest_framework.test import APITestCase

from .models import GaleriePhoto


class GalleryPublicApiTests(APITestCase):
    def test_public_gallery_list_returns_visible_photos_only(self):
        GaleriePhoto.objects.create(
            titre_fr='Photo visible',
            categorie='PRODUITS',
            est_visible=True,
        )
        GaleriePhoto.objects.create(
            titre_fr='Photo cachée',
            categorie='PRODUITS',
            est_visible=False,
        )

        response = self.client.get('/api/gallery/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['titre'], 'Photo visible')
