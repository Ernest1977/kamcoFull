from .tracking import tracker_creation, tracker_modification, tracker_suppression, capturer_etat_avant


class TrackingMixin:
    """
    Mixin pour ajouter le tracking automatique aux ViewSets.
    Ajouter à n'importe quel ModelViewSet pour activer le suivi.
    """

    def perform_create(self, serializer):
        instance = serializer.save()
        tracker_creation(instance, utilisateur=self.request.user, request=self.request)

    def perform_update(self, serializer):
        # Capturer l'état avant
        instance = self.get_object()
        etat_avant = capturer_etat_avant(instance)

        # Sauvegarder
        instance = serializer.save()

        # Tracker la modification
        tracker_modification(instance, etat_avant, utilisateur=self.request.user, request=self.request)

    def perform_destroy(self, instance):
        tracker_suppression(instance, utilisateur=self.request.user, request=self.request)
        instance.delete()