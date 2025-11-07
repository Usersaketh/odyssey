# --- Stage 1: Build React app ---
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package*.json ./

# Install deps (show logs for debugging)
RUN npm ci

# Copy the rest of the build inputs
COPY tsconfig*.json ./
COPY vite.config.* ./
COPY tailwind.config.* ./
COPY postcss.config.* ./
COPY components.json ./
COPY index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# --- Stage 2: Nginx server ---
FROM nginx:stable-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built dist files
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
