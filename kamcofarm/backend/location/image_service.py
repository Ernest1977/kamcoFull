from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys
import logging

logger = logging.getLogger(__name__)

# Configuration standard
MAX_WIDTH = 1200
MAX_HEIGHT = 900
QUALITY = 85
FORMAT = 'JPEG'


def standardiser_image(image_file, max_width=MAX_WIDTH, max_height=MAX_HEIGHT, quality=QUALITY):
    """
    Standardise une image uploadée :
    - Redimensionne si trop grande (max 1200x900)
    - Compresse en JPEG qualité 85%
    - Corrige l'orientation EXIF
    - Retourne un InMemoryUploadedFile prêt à sauvegarder
    """
    try:
        img = Image.open(image_file)

        # Corriger l'orientation EXIF
        try:
            from PIL import ExifTags
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break

            exif = img._getexif()
            if exif:
                orient = exif.get(orientation)
                if orient == 3:
                    img = img.rotate(180, expand=True)
                elif orient == 6:
                    img = img.rotate(270, expand=True)
                elif orient == 8:
                    img = img.rotate(90, expand=True)
        except Exception:
            pass

        # Convertir en RGB si nécessaire (pour les PNG avec transparence)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Redimensionner si nécessaire
        width, height = img.size
        if width > max_width or height > max_height:
            ratio = min(max_width / width, max_height / height)
            new_size = (int(width * ratio), int(height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        # Sauvegarder en mémoire
        output = BytesIO()
        img.save(output, format=FORMAT, quality=quality, optimize=True)
        output.seek(0)

        # Créer le nom de fichier
        original_name = getattr(image_file, 'name', 'photo.jpg')
        new_name = original_name.rsplit('.', 1)[0] + '.jpg'

        return InMemoryUploadedFile(
            file=output,
            field_name='image',
            name=new_name,
            content_type='image/jpeg',
            size=sys.getsizeof(output),
            charset=None
        )

    except Exception as e:
        logger.error(f"Erreur standardisation image: {e}")
        return image_file