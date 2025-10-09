FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy nginx configuration
COPY nginx.cloudrun.conf /etc/nginx/templates/nginx.conf.template
COPY swagger-ui.html /usr/share/nginx/html/swagger-ui.html

# Copy OpenAPI spec
COPY ../cpp-api/openapi.yaml /etc/nginx/openapi/openapi.yaml 2>/dev/null || echo "OpenAPI spec not found"

# Copy database files
COPY ../database /usr/share/nginx/html/data 2>/dev/null || echo "Database files not found"

# Create startup script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'export CPP_API_URL=${CPP_API_URL:-http://localhost:8080}' >> /docker-entrypoint.sh && \
    echo 'envsubst "\$CPP_API_URL" < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 8080

CMD ["/docker-entrypoint.sh"]
