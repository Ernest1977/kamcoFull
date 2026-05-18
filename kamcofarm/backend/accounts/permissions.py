from rest_framework.permissions import BasePermission

class IsAdminOrDirector(BasePermission):
    """
    Seuls ADMIN et DIR peuvent accéder
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['ADMIN', 'DIR']
        )

class IsFinance(BasePermission):
    """
    Seuls ADMIN, DIR et COMPTA peuvent accéder
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['ADMIN', 'DIR', 'COMPTA']
        )

class IsHR(BasePermission):
    """
    Seuls ADMIN, DIR et RH
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['ADMIN', 'DIR', 'RH']
        )

class IsLogistique(BasePermission):
    """
    ADMIN, DIR et LOG peuvent accéder
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['ADMIN', 'DIR', 'LOG']
        )

class IsCommercial(BasePermission):
    """
    ADMIN, DIR et COMM peuvent accéder
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['ADMIN', 'DIR', 'COMM']
        )

class IsCommercialeOuLogistique(BasePermission):
    """
    ADMIN, DIR, COMM et LOG peuvent accéder
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['ADMIN', 'DIR', 'COMM', 'LOG']
        )
    
class IsLocationManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'DIR', 'LOG', 'COMM']