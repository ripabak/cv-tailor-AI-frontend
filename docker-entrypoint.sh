#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__APP_CONFIG__ = {
  API_URL: '${VITE_API_URL:-http://localhost:8000/api}',
}
EOF
exec nginx -c /etc/nginx/nginx.conf -g "daemon off;"
