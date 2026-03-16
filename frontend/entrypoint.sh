#!/bin/sh
set -e

# Build BACKEND_TARGET from BACKEND_URL (preferred) or from components
if [ -n "${BACKEND_URL}" ]; then
	# strip trailing slashes
	BACKEND_URL_STRIPPED=$(printf '%s' "${BACKEND_URL}" | sed 's:/\+$::')
	BACKEND_TARGET=${BACKEND_URL_STRIPPED}
else
	BACKEND_SCHEME=${BACKEND_SCHEME:-http}
	BACKEND_HOST=${BACKEND_HOST:-backend}
	BACKEND_PORT=${BACKEND_PORT:-8000}
	BACKEND_TARGET=${BACKEND_SCHEME}://${BACKEND_HOST}:${BACKEND_PORT}
fi

export BACKEND_TARGET
CLIENT_MAX_BODY_SIZE=${CLIENT_MAX_BODY_SIZE:-250M}
export CLIENT_MAX_BODY_SIZE

# Log computed targets for debugging
echo "==> FRONTEND: computed BACKEND_TARGET=${BACKEND_TARGET}" 1>&2 || true
echo "==> FRONTEND: PORT=${PORT:-<unset>}" 1>&2 || true
echo "==> FRONTEND: CLIENT_MAX_BODY_SIZE=${CLIENT_MAX_BODY_SIZE}" 1>&2 || true

# Substitute BACKEND_TARGET and PORT into nginx config template
# envsubst will replace the listed variables; if you omit the list it replaces all env vars.
envsubst '${BACKEND_TARGET} ${PORT} ${CLIENT_MAX_BODY_SIZE}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Print top of final nginx config for logs (helps diagnose 502/upstream issues)
sed -n '1,120p' /etc/nginx/conf.d/default.conf 1>&2 || true

exec "$@"
