#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__APP_CONFIG__ = {
  API_URL: '${VITE_API_URL}',
}
EOF

: "${BACKEND_URL:=backend:8000}"
export BACKEND_URL

envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /tmp/nginx.conf

exec nginx -c /tmp/nginx.conf -g "daemon off;"
