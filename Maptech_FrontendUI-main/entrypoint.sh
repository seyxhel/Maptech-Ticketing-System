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

# Substitute BACKEND_TARGET into nginx config template
envsubst '${BACKEND_TARGET}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
