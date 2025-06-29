# Chart Navigation Structure Documentation

## Overview

This document describes the new chart page structure implemented for the Lesan traffic analytics application. The structure has been redesigned to provide better navigation, separation of concerns, and scalability for future chart types.

## Directory Structure

```
lesan/front/src/app/
├── charts/
│   ├── page.tsx                     # Redirects to /charts/overall
│   ├── overall/
│   │   ├── page.tsx                 # Overall charts dashboard
│   │   ├── road-defects/
│   │   │   └── page.tsx             # Road defects analysis
│   │   └── monthly-holiday/
│   │       └── page.tsx             # Monthly holiday analysis
│   ├── temporal/
│   │   ├── page.tsx                 # Temporal analysis overview
│   │   ├── time-series/
│   │   │   └── page.tsx             # Time series analysis
│   │   └── seasonal/
│   │       └── page.tsx             # Seasonal analysis
│   ├── spatial/
│   │   └── page.tsx                 # Spatial analysis overview
│   └── trend/
│       └── page.tsx                 # Trend analysis overview
├── maps/
│   └── page.tsx                     # Maps overview
└── components/navigation/
    └── ChartNavigation.tsx          # Unified navigation component
```

## Navigation Component

### ChartNavigation.tsx

A unified navigation component that provides:

- **Breadcrumb navigation**: Shows current location in hierarchy
- **Main tab navigation**: Charts vs Maps
- **Section navigation**: Overall, Temporal, Spatial, Trend
- **Chart-specific navigation**: Individual charts within each section

#### Props
```typescript
interface ChartNavigationProps {
  currentSection?: string    // 'overall' | 'temporal' | 'spatial' | 'trend'
  currentChart?: string      // specific chart identifier
}
```

#### Features
- Automatic active state detection based on pathname
- Dynamic breadcrumb generation
- Section-specific chart navigation
- Responsive design with proper RTL support

## Page Structure

### Main Sections

#### 1. Overall Charts (`/charts/overall`)
- **Purpose**: Comprehensive view of accident data and analytics
- **Features**:
  - Combined dashboard with multiple chart types
  - Quick navigation to individual charts
  - Statistics overview
  - Real-time data loading
- **Individual Charts**:
  - Road Defects (`/charts/overall/road-defects`)
  - Monthly Holiday Analysis (`/charts/overall/monthly-holiday`)

#### 2. Temporal Analysis (`/charts/temporal`)
- **Purpose**: Time-based analysis and trends
- **Status**: Placeholder implementation
- **Planned Charts**:
  - Time Series (`/charts/temporal/time-series`)
  - Seasonal Analysis (`/charts/temporal/seasonal`)

#### 3. Spatial Analysis (`/charts/spatial`)
- **Purpose**: Geographic and location-based analysis
- **Status**: Placeholder implementation
- **Planned Features**:
  - Regional comparison
  - Hotspot identification
  - Geographic clustering

#### 4. Trend Analysis (`/charts/trend`)
- **Purpose**: Long-term trends and predictions
- **Status**: Placeholder implementation
- **Planned Features**:
  - Monthly trends
  - Yearly trends
  - Predictive analytics

#### 5. Maps (`/maps`)
- **Purpose**: Interactive geographic visualization
- **Status**: Placeholder implementation
- **Planned Features**:
  - Heat maps
  - Interactive markers
  - Layer management
  - Spatial filtering

## Implementation Details

### Common Page Structure

Each page follows a consistent structure:

```typescript
const PageComponent = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Filter handling
  const handleFilterSubmit = async (filters: RoadDefectsFilterState) => {
    // API calls and data updates
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ChartNavigation currentSection="..." currentChart="..." />
      <div className="flex">
        {showFilterSidebar && <ChartsFilterSidebar />}
        <div className="flex-1 p-6">
          {/* Page content */}
        </div>
      </div>
    </div>
  )
}
```

### Filter Integration

- All pages integrate with `ChartsFilterSidebar`
- Consistent filter configuration interface
- Shared filtering logic across components

### Data Loading Patterns

- Async data loading with loading states
- Error handling and user feedback
- Retry mechanisms for failed requests

## Key Features

### 1. Hierarchical Navigation
- Three-level navigation: Main > Section > Chart
- Clear visual hierarchy with breadcrumbs
- Consistent navigation patterns

### 2. Progressive Enhancement
- Core functionality implemented first (Overall section)
- Placeholder pages for future development
- Extensible architecture

### 3. Responsive Design
- Mobile-friendly navigation
- Collapsible sidebar
- Adaptive layouts

### 4. RTL Support
- Proper right-to-left layout
- Persian/Farsi text support
- Reversed flex layouts where appropriate

## API Integration

### Current Implementation
- Road defects analytics via `roadDefectsAnalytics()`
- Monthly holiday analytics via `monthlyHolidayAnalytics()`
- Filter state management through `RoadDefectsFilterState`

### Future APIs
- Time series data endpoints
- Spatial analysis endpoints
- Trend analysis endpoints
- Map data services

## Development Status

### ✅ Completed
- Navigation component with full hierarchy
- Overall section with working charts
- Individual chart pages (road defects, monthly holiday)
- Filter integration with proper API mapping
- Responsive design
- Error handling
- API parameter fixes (set/get structure)
- Data access corrections (result.body)
- ChartsFilterSidebar prop corrections

### 🚧 In Progress
- Placeholder pages with feature descriptions
- Temporal analysis implementation
- Spatial analysis implementation
- Trend analysis implementation

### 📋 Planned
- Spatial analysis with map integration
- Trend analysis with predictive models
- Advanced filtering options
- Export functionality
- Real-time data updates
</thinking>

### ✅ Recently Fixed Issues
- **API Parameter Structure**: Fixed API calls to use correct `set`/`get` structure
- **Data Access**: Updated to use `result.body` instead of `result.data`
- **Filter Props**: Corrected `ChartsFilterSidebar` props (`config` and `onApplyFilters`)
- **Interface Compatibility**: Updated `MonthlyHolidayAnalyticsData` interface
- **Error Handling**: Improved error messages and loading states

## Usage Examples

### Basic Navigation
```typescript
// Navigate to overall section
<ChartNavigation currentSection="overall" />

// Navigate to specific chart
<ChartNavigation currentSection="overall" currentChart="road-defects" />
```

### Filter Integration
```typescript
const handleFilterSubmit = async (filters: RoadDefectsFilterState) => {
  setIsLoading(true)
  try {
    const result = await roadDefectsAnalytics({
      severityIds: filters.severityIds,
      collisionTypeIds: filters.collisionTypeIds,
      lightingIds: filters.lightingIds,
      startDate: filters.startDate,
      endDate: filters.endDate
    })
    if (result.success) {
      setChartData(result.data)
    }
  } catch (error) {
    setError('خطا در بارگذاری داده‌ها')
  } finally {
    setIsLoading(false)
  }
}
```

## Future Enhancements

### Short Term
1. Complete temporal analysis implementation
2. Add more chart types to overall section
3. Implement basic map functionality
4. Add export/download features

### Medium Term
1. Advanced spatial analysis with GIS integration
2. Machine learning-based trend prediction
3. Real-time data streaming
4. Advanced filtering and search

### Long Term
1. Interactive dashboard builder
2. Custom report generation
3. API for third-party integrations
4. Mobile application

## Best Practices

### Page Development
1. Follow the established page structure pattern
2. Use consistent error handling
3. Implement proper loading states
4. Include accessibility features

### Navigation Updates
1. Update `ChartNavigation.tsx` for new sections
2. Add proper route definitions
3. Update breadcrumb logic
4. Test navigation flow

### Data Integration
1. Use consistent API patterns
2. Implement proper error boundaries
3. Add data validation
4. Include retry mechanisms

## Troubleshooting

### Common Issues (RESOLVED)
1. ✅ **API Parameter Errors**: Fixed by using proper `set`/`get` structure
2. ✅ **ChartsFilterSidebar Props**: Fixed prop names (`config`, `onApplyFilters`)
3. ✅ **Data Access Issues**: Fixed by using `result.body` instead of `result.data`
4. ✅ **Interface Mismatches**: Updated data interfaces to match API responses

### Current Issues
1. **404 Errors**: Ensure all route directories have `page.tsx` files
2. **Navigation Issues**: Check `currentSection` and `currentChart` props
3. **Styling Issues**: Ensure Tailwind classes are properly applied

### Debugging Tips
1. Use browser dev tools to inspect navigation state
2. Check console for API errors
3. Verify filter state in React DevTools
4. Test responsive design at different breakpoints

### Fixed API Structure
```typescript
// Correct API call structure
const result = await roadDefectsAnalytics({
  set: {
    province: filters.province || [],
    lightStatus: filters.lightStatus || [],
    // ... other filters
  },
  get: {
    defectDistribution: 1,
    defectCounts: 1
  }
})

// Correct data access
if (result.success) {
  setChartData(result.body)
}
```
