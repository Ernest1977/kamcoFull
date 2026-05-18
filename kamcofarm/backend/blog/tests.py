from datetime import date
from rest_framework import status
from rest_framework.test import APITestCase

from .models import BlogPost


class BlogPublicApiTests(APITestCase):
    def test_public_blog_list_returns_only_published_posts(self):
        BlogPost.objects.create(
            titre_fr='Article publié',
            extrait_fr='Extrait du post',
            contenu_fr='Contenu du post',
            date_publication=date.today(),
            est_publie=True,
        )
        BlogPost.objects.create(
            titre_fr='Brouillon privé',
            extrait_fr='Extrait brouillon',
            contenu_fr='Contenu brouillon',
            date_publication=date.today(),
            est_publie=False,
        )

        response = self.client.get('/api/blog/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['titre'], 'Article publié')
