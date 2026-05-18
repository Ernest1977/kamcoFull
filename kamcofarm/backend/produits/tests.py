from django.test import TestCase

from .models import ProduitAgricole


class ProduitAgricoleModelTest(TestCase):
    def test_str_returns_product_name(self):
        produit = ProduitAgricole.objects.create(
            nom='Ananas test',
            type_produit='ANANAS',
            description_fr='Description test',
            prix_unitaire_fcfa='1200.00',
            stock_kg=5,
        )
        self.assertEqual(str(produit), 'Ananas test')
