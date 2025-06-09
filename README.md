# LESEN - Traffic Management System

## 🌟 Project Overview
A comprehensive traffic management and accident reporting system with Deno-based backend and Next.js frontend. The project provides tools for managing traffic zones, road conditions, vehicles, and accident records.

## 🧩 Features
- Multi-service architecture with Deno backend and Next.js frontend
- MongoDB and Redis integration for data persistence and caching
- Dockerized services with production-ready configurations
- Development and production environment support
- RESTful API structure with proper error handling and validation

## 🛠️ Technologies Used
- **Language**: TypeScript (Deno for backend, Next.js for frontend)
- **Backend**: Custom Deno framework based on MongoDB persistence
- **Frontend**: Next.js with React, TypeScript, and Tailwind CSS
- **Database**: MongoDB (data storage), Redis (caching)
- **Containerization**: Docker & Docker Compose for service orchestration

## 📦 Project Structure
```bash
lesan/
├── back/               # Deno backend service
├── front/              # Next.js frontend service
├── docker-compose.yml  # Production Docker Compose config
├── docker-compose.dev.yml  # Development Docker Compose config
├── .env.*              # Environment configuration files
└── Dockerfile(s)       # Docker build configurations
```

## 🐳 Docker & Docker Compose Setup

### Prerequisites
- Docker 24.x or higher
- Docker Compose Plugin
- (Optional) MongoDB Compass for database visualization

### Getting Started

**1. Clone the repository**
```bash
git clone https://github.com/your-username/lesan.git
cd lesan
```

**2. Environment Configuration (Optional)**
Copy the environment files to customize:
```bash
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend
```

**3. Build and Start Services**
Using the production configuration:
```bash
docker-compose up -d
```

Using the development configuration (with hot-reload):
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**4. Monitor Logs**
```bash
docker-compose logs -f
```

### 🛥️ Services Overview
| Service   | Port   | Description                      | Environment |
|-----------|--------|----------------------------------|-------------|
| backend   | 1404   | Deno-based API service           | Production  |
| frontend  | 3000   | Next.js application              | Production  |
| mongo     | 27017  | MongoDB persistent storage       | All         |
| redis     | 6379   | Redis inline caching             | All         |

### 🧪 Available endpoints:
- **Backend API**: http://localhost:1404
- **Frontend UI**: http://localhost:3000
- **MongoDB**: mongo://localhost:27017/
- **Redis**: redis://localhost:6379

### 🛠️ Environment Variables
Customize the following in `.env.backend` or `.env.frontend`:
- `APP_PORT` - Service port mapping
- `MONGO_URI` - MongoDB connection string
- `REDIS_URI` - Redis connection string
- `LESAN_URL` - Backend URL for frontend

### 🛡️ Production vs Development
| Feature          | Production               | Development               |
|------------------|--------------------------|---------------------------|
| Build Mode       | `production` target      | `development` target      |
| Port Mapping     | Fixed ports              | Same ports for consistency|
| Live Reload      | ❌                        | ✅ (via Turbopack)         |
| Debugging Tools  | ✅                        | ✅                        |

## 🧱 Customizing Docker Setup
To customize:
1. Modify `docker-compose.yml` for service configurations
2. Adjust `Dockerfile` in each service for build requirements
3. Use environment variables for runtime configuration

## 💡 Additional Tips
- Data persistence: MongoDB and Redis use Docker volumes to retain data
- Caching: Development builds share node_modules caching between containers
- Optimized builds: Multi-stage Docker builds reduce image size
- Security: Non-root users in containers for production services

## 🛑 Stopping the Stack
```bash
docker-compose down
# Or for dev environment
docker-compose -f docker-compose.dev.yml down
```

