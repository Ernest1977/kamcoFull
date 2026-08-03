from rest_framework.permissions import BasePermission


def _role_a_capacite(user, capacite):
    try:
        from .models import Role
        role = Role.objects.filter(code=user.role, est_actif=True).only('permissions').first()
        if role and capacite in (role.permissions or []):
            return True
    except Exception:
        pass
    return False


class IsAdminOrDirector(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR']:
            return True
        return _role_a_capacite(request.user, 'admin') or _role_a_capacite(request.user, 'direction')


class IsFinance(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'COMPTA']:
            return True
        return _role_a_capacite(request.user, 'finance')


class IsHR(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'RH']:
            return True
        return _role_a_capacite(request.user, 'rh')


class IsLogistique(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'LOG']:
            return True
        return _role_a_capacite(request.user, 'logistique')


class IsCommercial(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'DIR', 'COMM']:
            return True
        return _role_a_capacite(request.user, 'commercial')


class IsCommercialeOuLogistique(BasePermission):
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