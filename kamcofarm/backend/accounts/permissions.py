from rest_framework.permissions import BasePermission


def _role_a_capacite(user, capacite):
    """
    Retourne True si le rôle (catalogue) de l'utilisateur possède la capacité
    demandée. Permet aux NOUVEAUX rôles de bénéficier de droits sans modifier
    le code existant. En cas d'erreur, on retombe silencieusement sur False
    (la vérification par code en dur reste la source de vérité principale).
    """
    try:
        from .models import Role
        role = Role.objects.filter(code=user.role, est_actif=True).only('permissions').first()
        if role and capacite in (role.permissions or []):
            return True
    except Exception:
        pass
    return False


class IsAdminOrDirector(BasePermission):
    """Seuls ADMIN et DIR peuvent accéder (ou rôle avec capacité admin/direction)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR']:
            return True
        return _role_a_capacite(request.user, 'admin') or _role_a_capacite(request.user, 'direction')


class IsFinance(BasePermission):
    """ADMIN, DIR et COMPTA (ou rôle avec capacité finance)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'COMPTA']:
            return True
        return _role_a_capacite(request.user, 'finance')


class IsHR(BasePermission):
    """ADMIN, DIR et RH (ou rôle avec capacité rh)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'RH']:
            return True
        return _role_a_capacite(request.user, 'rh')


class IsLogistique(BasePermission):
    """ADMIN, DIR et LOG (ou rôle avec capacité logistique)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'LOG']:
            return True
        return _role_a_capacite(request.user, 'logistique')


class IsCommercial(BasePermission):
    """ADMIN, DIR et COMM (ou rôle avec capacité commercial)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'COMM']:
            return True
        return _role_a_capacite(request.user, 'commercial')


class IsCommercialeOuLogistique(BasePermission):
    """ADMIN, DIR, COMM et LOG (ou rôle avec capacité commercial/logistique)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'COMM', 'LOG']:
            return True
        return _role_a_capacite(request.user, 'commercial') or _role_a_capacite(request.user, 'logistique')


class IsLocationManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'LOG', 'COMM']:
            return True
        return _role_a_capacite(request.user, 'logistique') or _role_a_capacite(request.user, 'commercial')
