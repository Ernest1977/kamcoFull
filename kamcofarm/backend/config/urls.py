"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from django.contrib import admin
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('django-admin/', admin.site.urls),

    # ========================================
    # DOCUMENTATION API
    # ========================================
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    ### Microservices API PUBLIQUES (sans auth - Endpoints de consultation) ###
    
    # 🥭 Produits
    path('api/', include('produits.urls')),
    #  statistics
    path('api/', include('statistiq.urls')),
    # 🤝 Partenaires
    path('api/', include('partners.urls')),
    # 📸 Galerie
    path('api/', include('gallery.urls')),
    # 📚 Blog
    path('api/', include('blog.urls')), 
    # 🗣️ Témoignages
    path('api/', include('testimonials.urls')),



    ### 🔐 Auth & 🧑‍💼 Users ###
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    

    ### MICROSERVICES METIERS PROTEGER PAR AUTHENTIFICATION ###

    # 🛒 Supply Chain
    path('api/supplychain/', include('supplychain.urls')),
    # 🧑‍🤝‍🧑 RH
    path('api/rh/', include('rh.urls')),
    # 💰 Finance
    path('api/finance/', include('finance.urls')),
    # 📄 Contenu
    path('api/content/', include('content.urls')),
    # 📢 Marketing
    path('api/marketing/', include('marketing.urls')),
    # 🏢 Administration
    path('api/administration/', include('administration.urls')),
    # 🚜 Equipements
    path('api/equipements/', include('equipements.urls')),
    # 🚜 Location
    path('api/location/', include('location.urls')),

]


# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)