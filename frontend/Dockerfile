# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# Copy source and build
COPY . .
RUN npm run build

# ─── Production stage (Nginx) ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove the default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy compiled assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our nginx config (template; will be processed at container start)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy entrypoint and install envsubst (gettext)
COPY entrypoint.sh /entrypoint.sh
RUN apk add --no-cache gettext && chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
