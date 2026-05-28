# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package and lock files to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for TypeScript, Vite, and tailwind compilation)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Run the full-stack build script: builds the client SPA and bundles server.ts with esbuild
RUN npm run build

# Stage 2: Minimalist production running environment
FROM node:20-alpine

WORKDIR /app

# Configure Node and Cloud Run environment flags
ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests for installing production-only dependencies
COPY package.json package-lock.json* ./

# Warm up with only production dependencies
RUN npm ci --omit=dev

# Copy distribution folder containing compiled static client side and node server bundle from Stage 1
COPY --from=builder /app/dist ./dist

# Copy crucial Firebase runtime configuration
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Expose port (Cloud Run will override/port-forward via dynamic env vars matching PORT)
EXPOSE 3000

# Launch server
CMD ["npm", "start"]
