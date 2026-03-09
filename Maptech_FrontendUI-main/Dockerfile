# ── Frontend Dockerfile (Vite build → Nginx static serve) ──

# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build-time env: API URL will be set via Railway env var
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Railway injects PORT; nginx:alpine image supports envsubst via templates
ENV PORT=80
EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]
