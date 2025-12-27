# LESEN - Traffic Management System Context

## 🌟 Project Overview

LESEN is a comprehensive traffic management and accident reporting system built with a microservices architecture. The project combines a Deno-based backend API service with a Next.js frontend application to provide tools for managing traffic zones, road conditions, vehicles, and accident records.

### Architecture
- **Backend**: Custom Deno framework with MongoDB persistence and Redis caching
- **Frontend**: Next.js 15.3.2 application with React 19, TypeScript, and Tailwind CSS
- **Database**: MongoDB for persistent data storage
- **Cache**: Redis for inline caching
- **Containerization**: Docker & Docker Compose for service orchestration

### Core Features
- Multi-service architecture supporting both development and production environments
- RESTful API structure with proper error handling and validation
- Traffic zone management and mapping
- Accident reporting and analysis
- Road condition monitoring
- Vehicle and user management
- Real-time data visualization

## 🛠️ Technologies & Stack

### Backend (Deno)
- **Framework**: Custom Deno framework based on LESEN v0.1.22
- **Language**: TypeScript
- **Database**: MongoDB with ODM integration
- **Cache**: Redis integration
- **Authentication**: JWT for token-based authentication
- **Dev Tools**: Deno's built-in development server with hot-reload capabilities

### Frontend (Next.js)
- **Framework**: Next.js 15.3.2
- **Language**: TypeScript
- **UI Libraries**: React 19, Headless UI, Tailwind CSS
- **Mapping**: Leaflet with advanced mapping features (drawing, clustering, heatmaps)
- **Charts**: ApexCharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns-jalali with zaman for Persian calendar support
- **Cookies**: js-cookie for client-side storage

## 📁 Project Structure

```
lesan/
├── back/                   # Deno-based backend service
│   ├── deps.ts            # External dependencies
│   ├── deno.json          # Deno configuration
│   ├── mod.ts             # Main backend entry point
│   ├── models/            # Data models and schemas
│   │   ├── accident.ts
│   │   ├── city.ts
│   │   ├── road.ts
│   │   ├── user.ts
│   │   └── ... (20+ model files)
│   ├── src/               # Backend source code
│   └── utils/             # Backend utilities
├── front/                  # Next.js frontend service
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   ├── package.json       # Node.js dependencies
│   ├── next.config.ts     # Next.js configuration
│   └── tsconfig.json      # TypeScript configuration
├── docker-compose.yml     # Production Docker Compose
├── docker-compose.dev.yml # Development Docker Compose
├── .env.backend           # Backend environment variables
├── .env.frontend          # Frontend environment variables
└── README.md              # Project documentation
```

## 🚀 Building and Running

### Prerequisites
- Docker 24.x or higher
- Docker Compose Plugin
- (Optional) MongoDB Compass for database visualization

### Development Setup
```bash
# Clone the repository
git clone https://github.com/your-username/lesan.git
cd lesan

# Environment Configuration (Optional)
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Or run backend in development mode directly
cd back
deno task bc-dev
```

### Production Setup
```bash
# Build and start production services
docker-compose up -d

# Monitor logs
docker-compose logs -f
```

### Available Endpoints
- **Backend API**: http://localhost:1404
- **Frontend UI**: http://localhost:3000
- **MongoDB**: mongo://localhost:27017/
- **Redis**: redis://localhost:6379

## 🧪 Development Commands

### Backend (Deno)
- Run development server: `deno task bc-dev`
- The backend runs on port 1404 (configurable via SERVER_PORT environment variable)

### Frontend (Next.js)
- Development server: `npm run dev` (or `pnpm dev`, `yarn dev`)
- Build for production: `npm run build`
- Run production server: `npm run start`
- The frontend runs on port 3000 (configurable via APP_PORT environment variable)

## 🗄️ Data Models

The backend includes extensive data models for traffic management including:
- **Users & Drivers**: user.ts, driver.ts
- **Geographic**: province.ts, city.ts, township.ts, traffic_zone.ts, city_zone.ts
- **Accidents**: accident.ts with detailed accident reporting
- **Roads & Infrastructure**: road.ts, road_defect.ts, road_repair_type.ts
- **Vehicles**: vehicle.ts with various vehicle-related data
- **Incidents**: collision_types, fault_statuses, equipment_damages
- **Files**: file.ts for managing uploads

## 🐳 Docker Configuration

### Services
| Service   | Port | Description                      |
|-----------|------|----------------------------------|
| backend   | 1404 | Deno-based API service           |
| frontend  | 3000 | Next.js application              |
| mongo     | 27017| MongoDB persistent storage       |
| redis     | 6379 | Redis inline caching             |

### Environment Variables
- `SERVER_PORT` - Backend service port (default: 1404)
- `APP_PORT` - Frontend service port (default: 3000)
- `MONGO_URI` - MongoDB connection string
- `REDIS_URI` - Redis connection string
- `LESAN_URL` - Backend URL for frontend API calls
- `CORS_ORIGINS` - Allowed CORS origins

## 🧱 Customization & Extensibility

### Backend Customization
- Modify `back/deno.json` for Deno-specific configurations
- Add new models to the `back/models` directory
- Extend the API with new functions in `back/src/mod.ts`

### Frontend Customization
- Customize UI components in `front/src`
- Modify Next.js configuration in `front/next.config.ts`
- Update styling in Tailwind CSS configuration

### Docker Customization
- Modify `docker-compose.yml` for production service configurations
- Adjust `Dockerfile` in each service for build requirements
- Use environment variables for runtime configuration

## 🛡️ Production vs Development

| Feature          | Production               | Development               |
|------------------|--------------------------|---------------------------|
| Build Mode       | Production target        | Development target        |
| Port Mapping     | Fixed ports              | Same ports for consistency|
| Live Reload      | ❌ Disabled               | ✅ Enabled (via Turbopack) |
| Debugging Tools  | Enabled                  | Enhanced debugging        |

## 🛑 Stopping Services

```bash
# Stop production services
docker-compose down

# Stop development services
docker-compose -f docker-compose.dev.yml down
```

## 💡 Additional Notes

- Data persistence: MongoDB and Redis use Docker volumes to retain data
- Caching: Development builds share node_modules caching between containers
- Optimized builds: Multi-stage Docker builds reduce image size
- Security: Non-root users in containers for production services
- File uploads: The backend handles file uploads with dedicated storage in the "uploads" directory
- API Playground: Backend includes an API playground for testing endpoints
- Type generation: Automatic TypeScript type generation for API contracts

This system is designed for comprehensive traffic management with robust data models for accident reporting, traffic analysis, and geographic information systems.

## Git commit

When I say `git commit` please do the following:
```
Please act as an expert Git commit assistant. Your task is to carefully review the recent project changes (e.g., via git diff or staged files) and generate a series of clear, conventional commit messages following best practices. Use Gitmoji emojis at the start of each commit message to make them more expressive and readable (e.g., :sparkles: for new features, :bug: for fixes).
Key guidelines:
Conventional structure: Each commit message should start with a Gitmoji, followed by a type (e.g., feat, fix, refactor, docs, test, chore), a scope in parentheses if applicable (e.g., (ui)), a colon, and a concise description. Include a body if needed for more details, and reference issues if relevant.
Grouping: Break changes into logical, atomic commits. Group related files or changes together (e.g., one commit for UI updates, another for bug fixes), rather than lumping everything into a single commit. Avoid overly large or unrelated groupings.
Exclusions: Do not include any "Co-authored-by" lines, such as Co-authored-by: Qwen-Coder <qwen-coder@alibabacloud.com>, in the commit messages.
Execution: Directly output and execute the necessary Git shell commands (e.g., git add for specific files, followed by git commit -m "message") to apply these commits. Do not ask for confirmation, additional input, or perform unrelated actions like rebasing, squashing, or amending existing commits. Only create new commits on the current branch.
Best practices: Ensure messages are imperative, concise (50 chars for subject), and descriptive. Focus on what changed and why, not how.
Proceed step-by-step: First, analyze the changes, then propose the grouped commits, and finally execute the Git commands in sequence.
```
