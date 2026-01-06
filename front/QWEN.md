# LESEN Frontend - Traffic Management System

## 🌟 Project Overview

LESEN Frontend is a comprehensive traffic management and accident reporting system built with Next.js 15.3.8. It serves as the user interface for the LESEN backend service, providing tools for managing traffic zones, road conditions, vehicles, and accident records through an interactive map-based interface with extensive analytics and charting capabilities.

### Architecture

- **Framework**: Next.js 15.3.8 with React 19
- **Styling**: Tailwind CSS with custom CSS for RTL and map components
- **Maps**: Leaflet with advanced mapping features (drawing, clustering, heatmaps)
- **State Management**: React Context API with custom hooks
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns-jalali with zaman for Persian calendar support
- **Cookies**: js-cookie for client-side storage
- **Charts**: ApexCharts for data visualization
- **Containerization**: Docker with multi-stage builds

### Core Features

- Interactive map interface for accident visualization
- Advanced search and filtering capabilities
- Polygon-based area selection for accident analysis
- Comprehensive analytics and charting system with multiple visualization types
- RTL (right-to-left) support for Persian language
- User authentication and role-based access control
- Real-time data visualization and statistics
- Responsive design for various screen sizes

## 🛠️ Technologies & Stack

### Frontend Framework

- **Next.js**: 15.3.8 (App Router)
- **React**: 19.x
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x for styling

### Mapping & Visualization

- **Leaflet**: Interactive maps with markers and polygons
- **react-leaflet**: React components for Leaflet
- **Leaflet-draw**: Drawing tools for polygon selection
- **ApexCharts**: Data visualization
- **react-apexcharts**: React wrapper for ApexCharts

### State Management & Forms

- **React Context API**: Authentication and global state
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **js-cookie**: Cookie management

### Date & Localization

- **date-fns-jalali**: Persian calendar date functions
- **zaman**: Persian date picker
- **Vazir Matn Font**: Persian typography

## 📁 Project Structure

```
front/
├── .next/                 # Next.js build output
├── public/                # Static assets
│   ├── fonts/             # Persian fonts
│   └── favicon.ico
├── src/
│   ├── app/               # Next.js app router pages
│   │   ├── actions/       # Server actions for API calls
│   │   ├── admin/         # Admin panel pages
│   │   ├── charts/        # Chart visualization pages (overall, spatial, temporal, trend)
│   │   ├── chatbot/       # Chatbot interface
│   │   ├── graph/         # Graph visualization
│   │   ├── login/         # Login page
│   │   ├── maps/          # Map-related pages
│   │   ├── user/          # User management pages
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services and utilities
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── Dockerfile             # Multi-stage Docker build
├── package.json           # Dependencies and scripts
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## 🚀 Building and Running

### Prerequisites

- Node.js 20.x or higher
- pnpm package manager
- Docker (for containerized deployment)

### Development Setup

```bash
# Install dependencies
pnpm install

# Run development server with Turbopack
pnpm dev

# Or run without Turbopack
pnpm dev -- --no-turbopack
```

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Environment Variables

- `APP_PORT` - Frontend service port (default: 3000)
- `LESAN_URL` - Backend API URL (server-side)
- `NEXT_PUBLIC_LESAN_URL` - Backend API URL (client-side)

### Available Scripts

- `dev` - Start development server with Turbopack
- `build` - Build the application for production
- `start` - Start production server
- `lint` - Run ESLint

### Available Endpoints

- **Frontend UI**: http://localhost:3000
- **API calls**: Forwarded to backend service at LESAN_URL

## 🧪 Development Commands

### Development

- Run development server: `pnpm dev`
- The development server runs with Turbopack enabled by default
- The UI is in Persian (RTL) and runs on port 3000

### Production

- Build for production: `pnpm build`
- Run production server: `pnpm start`
- The production server respects the APP_PORT environment variable

## 🗄️ Key Components

### Map Interface

- Interactive Leaflet map with accident markers
- Polygon drawing tools for area-based searches
- Real-time statistics panel
- Responsive design for different screen sizes

### Authentication System

- Role-based access control (Ghost, Manager, Editor, Normal)
- Cookie-based authentication
- Context provider for global auth state

### Search Functionality

- Advanced search with multiple filters
- Polygon-based location filtering
- Real-time results on the map

### Data Visualization

- Charts and graphs for accident analytics
- Interactive map markers with detailed information
- Statistics panels with Persian number formatting
- Multiple chart types: bar, line, pie, heatmap, tree, etc.

## 🐳 Docker Configuration

### Multi-stage Build

The Dockerfile includes three stages:

1. **Builder**: Builds the Next.js application
2. **Production**: Production-ready container with minimal footprint
3. **Development**: Development container with hot-reload capabilities

### Services

- **Frontend**: Next.js application running on port 3000
- **Uses**: Non-root user (nextjs) for security
- **Environment**: Production or development based on build stage

### Ports

- `3000` - Next.js application port

## 🧱 Customization & Extensibility

### UI Customization

- Modify components in `src/components` directory
- Update styles in `src/app/globals.css`
- Customize Tailwind configuration as needed

### Map Features

- Extend map functionality in `src/components/SimpleDrawing`
- Add new map layers or visualization tools
- Customize marker and popup behavior

### Chart & Analytics Features

- Add new analytics functions in `src/app/actions/accident` directory
- Create new chart pages in `src/app/charts` subdirectories
- Extend filter capabilities in `src/components/dashboards/ChartsFilterSidebar`

### API Integration

- Add new server actions in `src/app/actions`
- Extend API service in `src/services/api.ts`
- Update type definitions in `src/types`

### Authentication

- Modify auth context in `src/context/AuthContext.tsx`
- Extend user roles and permissions
- Customize login flow in `src/app/login`

## 🛡️ Security & Best Practices

### Security

- Non-root user in production containers
- Cookie-based authentication with secure flags
- Server-side rendering for sensitive data
- Input validation with Zod schemas

### Performance

- Dynamic imports for map components to avoid SSR issues
- Efficient state management with React Context
- Optimized bundle size with tree-shaking
- Lazy loading for heavy components

### Accessibility

- RTL support for Persian language
- Semantic HTML structure
- Proper ARIA attributes where needed
- Responsive design for various screen sizes

## 💡 Additional Notes

- The application is designed for Persian (RTL) language support
- Map components are dynamically imported to avoid SSR issues
- Server actions are used for API communication with the backend
- The application uses a custom Vazir Matn font for Persian text
- Environment variables are handled differently for server and client sides
- The application includes comprehensive error handling and loading states
- Polygon drawing functionality allows for area-based accident analysis
- Statistics are calculated and displayed in real-time based on filters
- The application follows Next.js 13+ App Router conventions
- Number formatting uses Persian digits with toLocaleString('fa-IR') for proper localization
- For consistent Persian digit formatting, use the formatNumber utility function from '@/utils/formatters'
- The project includes extensive analytics capabilities with specialized functions for spatial, temporal, and overall accident analysis

This frontend system provides a comprehensive interface for traffic management with a focus on accident visualization and analysis, featuring an interactive map interface with advanced search capabilities and rich charting functionality.

## Project Guidelines

You are a front-end persona highly proficient in Next.js, with deep expertise in UI/UX design. Always prioritize creating the most beautiful, intuitive, and visually stunning website possible, ensuring seamless user experiences, responsive layouts, and elegant aesthetics throughout your suggestions and implementations.

Use `pnpm` instead of `npm` or `yarn` when executing any Node.js-related commands.

For all backend interactions, the actual response or error data is nested within a `body` object. Example success shape (e.g., for login):

```
{
  "success": true,
  "body": {
    "token": "23423423rrsdfsagssfas2342",
    "user": {
      "_id": "sdfsdf3423422344",
      "name": "Amir",
      // ... additional user fields
    }
  }
}
```

Example error shape (e.g., for login):

```
{
  "success": false,
  "body": {
    "message": "Failed"
  }
}
```

If you want to know backend API declaration and type-safety you can read `src/types/declarations/selectInp.ts` file which include all schemas and backend API calls.

If you encounter any problems with the structure of the Lesan library used for the backend, you can use its documentation (here)[https://miaadteam.github.io/lesan/].

Please use the atomic development process to develop this project. You can find its structure in this path: `src/components`

Please strictly follow and use clean code and clean architecture and programming best practices and principles, try to avoid complex code.

Clean up any unnecessary code, such as console.log or unused variables or any other not used statements, and ensure state management is efficient and leak-free.

If you want to use any package please review `package.json` to see what kind of package are available.

### API Calls Best Practice

Please use server actions located in `src/app/actions` for all backend API calls instead of direct API calls from client components. The application has organized all API operations by model (e.g., `src/app/actions/accident`, `src/app/actions/user`, `src/app/actions/city`, `src/app/actions/road`) with standard operations like `add`, `get`, `gets`, `update`, `remove`, and specialized analytics functions.

The project has a strong focus on analytics and chart visualizations, with numerous specialized analytics functions available in the accident model, such as:

- Spatial analytics: `spatialCollisionAnalytics`, `spatialSeverityAnalytics`, `spatialLightAnalytics`, `spatialSafetyIndexAnalytics`
- Temporal analytics: `temporalCollisionAnalytics`, `temporalSeverityAnalytics`, `temporalNightAnalytics`, `hourlyDayOfWeekAnalytics`
- Overall analytics: `accidentSeverityAnalytics`, `collisionAnalytics`, `roadDefectsAnalytics`, `humanReasonAnalytics`, `vehicleReasonAnalytics`
- Specialized analytics: `companyPerformanceAnalytics`, `areaUsageAnalytics`, `monthlyHolidayAnalytics`

Using server actions provides several benefits:

- Proper authentication handling via cookies
- Server-side execution for security-sensitive operations
- Centralized API logic that can be reused across components
- Consistent error handling and response format
- Better separation of concerns between UI and data fetching logic

Example usage:

```ts
// Instead of direct API calls from components
import { gets as getAccidents } from "@/app/actions/accident/gets";

const response = await getAccidents({
  set: {
    limit: 10,
    skip: 0,
  },
  get: {
    _id: 1,
    accidentDate: 1,
    location: 1,
    // ... other fields you want to fetch
  },
});

// For analytics and charts
import { accidentSeverityAnalytics } from "@/app/actions/accident/accidentSeverityAnalytics";

const analyticsResponse = await accidentSeverityAnalytics({
  set: {
    lightStatus: [],
    collisionType: [],
    dateOfAccidentFrom: "",
    dateOfAccidentTo: "",
    // ... other filter parameters
  },
  get: {
    defectDistribution: 1,
    defectCounts: 1,
    // ... other analytics data you want to fetch
  },
});

// When using the response, note that backend returns data directly in response.body
// rather than response.body.data as in some other systems
if (response.success && response.body) {
  const accidents = response.body; // This contains the actual data
  // ... process the accidents
}

if (analyticsResponse.success && analyticsResponse.body) {
  const analyticsData = analyticsResponse.body; // This contains the analytics data
  // ... process the analytics data for charts
}
```

Note: When handling API responses, the backend typically returns the actual data directly in the `response.body` property, rather than nesting it inside `response.body.data`. Always check `response.body` directly for the data you requested.

## Important Backend Integration Notes

1. **Backend Authentication Header Format**:
   - The backend expects the JWT token in a header field called `token`
   - The token should be sent without the `Bearer` prefix
   - Example: `token: "actual-jwt-token-value"` rather than `authorization: "Bearer actual-jwt-token-value"`

2. **API Call Structure for Lesan Framework**:
   - When making API calls to the backend via the `AppApi` service, make sure to include the authentication token properly
   - For operations that don't require pagination, the response may be directly the requested data

3. **Authentication Token Handling**:
   - Tokens are stored in cookies under the key "token"
   - When using the `AppApi` service, pass the token using the second parameter: `AppApi(undefined, token)`
   - The `AppApi` service now handles proper token formatting for backend compatibility

4. **Type Safety Considerations**:
   - When making API calls, the `get` parameter in the request only specifies the fields to return, not the response structure

5. **Using Declared Types for Consistency**:
   - Always use the type definitions from the declarations file (e.g. `src/types/declarations/selectInp.ts`) rather than creating custom interfaces
   - Import and use the exact backend schema types (e.g. `accidentSchema`, `userSchema`, `citySchema`) to ensure consistency with the backend
   - This prevents synchronization issues and ensures type safety between frontend and backend
   - Example: Use `import { accidentSchema } from "@/types/declarations/selectInp";` and then `type Accident = accidentSchema;`

## Development Guidelines

Please follow these guidelines when working with this project:

### Do NOT Automatically Execute

- **DO NOT** run any development server (e.g., `pnpm run dev`, `npm start`, etc.)
- **DO NOT** execute any build commands (e.g., `pnpm run build`, etc.)
- **DO NOT** start any local servers or processes automatically

### Wait for Explicit Instructions

Only run development servers or build commands when I explicitly ask you to do so. For example:

- "Please start the development server"
- "Run the build command"
- "Start the local server"

### Default Behavior

When I ask about development or building, provide the commands that would be used, but do not execute them until I give explicit permission.

### Exception Cases

You may still:

- Analyze project structure and configuration files
- Suggest commands that could be run
- Help debug configuration issues
- Explain what different commands do
