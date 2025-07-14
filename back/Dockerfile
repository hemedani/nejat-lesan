# Stage 1: Dependencies caching and development
FROM denoland/deno:alpine AS base

# Create app directory and use it as the working directory
WORKDIR /app

# Cache dependencies as root to handle npm binaries correctly
COPY deps.ts .
RUN deno cache deps.ts

# Stage 2: Production build
FROM base AS production

# Copy application code
COPY . .

# As root: Cache all dependencies including npm packages and set up binaries
RUN deno cache mod.ts

# As root: Create uploads directory and set up proper permissions
RUN mkdir -p /app/uploads

# As root: Set proper permissions for the entire app directory and node_modules
RUN chown -R deno:deno /app && \
    chmod -R 755 /app && \
    if [ -d "/app/node_modules" ]; then \
    find /app/node_modules -name "*.js" -type f -exec chmod +x {} \; || true; \
    find /app/node_modules/.bin -type f -exec chmod +x {} \; 2>/dev/null || true; \
    fi

# Switch to non-root user
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

# Copy application code
COPY . .

# As root: Cache all dependencies including npm packages and set up binaries
RUN deno cache mod.ts

# As root: Create uploads directory and set up proper permissions
RUN mkdir -p /app/uploads

# As root: Set proper permissions for the entire app directory and node_modules
RUN chown -R deno:deno /app && \
    chmod -R 755 /app && \
    if [ -d "/app/node_modules" ]; then \
    find /app/node_modules -name "*.js" -type f -exec chmod +x {} \; || true; \
    find /app/node_modules/.bin -type f -exec chmod +x {} \; 2>/dev/null || true; \
    fi

# Switch to non-root user
USER deno

# Set environment variables
ENV ENV=development
ENV APP_PORT=1404

# Expose the application port
EXPOSE ${APP_PORT}

# Run the application with watch mode
CMD ["deno", "run", "-A", "--watch", "--watch-exclude=declarations", "--no-clear-screen", "./mod.ts"]
