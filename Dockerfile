# Base build image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies to compile TypeScript)
RUN npm ci

# Copy application source
COPY . .

# Build application
RUN npm run build

# Production runner image
FROM node:22-alpine AS runner

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build artifacts from builder
COPY --from=builder /app/dist ./dist

# Expose port (default NestJS 4000)
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Run the app
CMD ["node", "dist/main"]
