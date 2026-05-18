FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy frontend build/source
COPY frontend /usr/share/nginx/html
