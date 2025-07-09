# Stage 1: Dependencies and build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nextjs /app/package*.json ./
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV APP_PORT=3000

# Expose the application port
EXPOSE ${APP_PORT}

# Switch to non-root user
USER nextjs

# Start the application
CMD ["npm", "start"]

# Stage 3: Development
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps
RUN chown -R nextjs:nextjs /app

# Set environment variables
ENV NODE_ENV=development
ENV APP_PORT=3000

# Expose the application port
EXPOSE ${APP_PORT}

# Switch to non-root user
USER nextjs

# Start the application in development mode
CMD ["npm", "run", "dev", "--", "--turbopack"]
