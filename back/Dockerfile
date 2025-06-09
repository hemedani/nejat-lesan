# Stage 1: Dependencies caching and development
FROM denoland/deno:alpine AS base

# Create app directory and use it as the working directory
WORKDIR /app

# The deno user and group already exist in the base image
# No need to create them again

# Cache dependencies
COPY deps.ts .
RUN deno cache deps.ts

# Stage 2: Production build
FROM base AS production

# Copy application code
COPY . .

# Cache all dependencies
RUN deno cache mod.ts

# Set permissions for the non-root user
RUN chown -R deno:deno /app

# Use the non-root user
USER deno

# Set environment variables
ENV ENV=production
ENV APP_PORT=1404

# Expose the application port
EXPOSE ${APP_PORT}

# Run the application
CMD ["deno", "run", "-A", "./mod.ts"]

# Stage 3: Development
FROM base AS development

# Set permissions for the non-root user
RUN chown -R deno:deno /app

# Use the non-root user
USER deno

# Set environment variables
ENV ENV=development
ENV APP_PORT=1404

# Expose the application port
EXPOSE ${APP_PORT}

# Run the application with watch mode
CMD ["deno", "run", "-A", "--watch", "--watch-exclude=declarations", "--no-clear-screen", "./mod.ts"]
