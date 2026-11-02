# ==========================================
# Multi-stage Dockerfile for OmniStream Studio
# ==========================================

# Stage 1: Build Angular Frontend
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Next.js Backend
FROM node:20-bookworm-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install runtime system packages: ffmpeg, python3, ca-certificates, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download standalone yt-dlp binary
RUN mkdir -p /app/backend/bin && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /app/backend/bin/yt-dlp && \
    chmod 755 /app/backend/bin/yt-dlp

# Symlink system ffmpeg into bin for direct resolution
RUN ln -sf $(which ffmpeg) /app/backend/bin/ffmpeg

# Copy built backend
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/.next ./.next
COPY --from=backend-builder /app/backend/public ./public
COPY --from=backend-builder /app/backend/next.config.js ./
COPY --from=backend-builder /app/backend/lib ./lib
COPY --from=backend-builder /app/backend/app ./app

# Copy built frontend static files into backend public/client
COPY --from=frontend-builder /app/frontend/dist/app/browser ./public/client

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["npx", "next", "start", "-p", "10000"]
