# Charts Dashboard Refactoring Notes

## Overview

This document describes the comprehensive refactoring of the charts page components to integrate with the new backend `accident.roadDefectsAnalytics` endpoint. The refactoring follows clean architecture principles where the backend is the single source of truth for all data processing.

## Key Architectural Changes

### 1. Backend as Single Source of Truth
- **Before**: Client-side filtering, sorting, and data manipulation with mock data
- **After**: All data processing happens on the backend; frontend only displays results
- **Benefit**: Consistent data, better performance, eliminates client-side business logic

### 2. Component Reusability
- **Before**: Custom input components duplicated across different parts of the app
- **After**: Reuses shared components from `AdvancedSearch` (`MyAsyncMultiSelect`, `MyDateInput`, `MyInput`)
- **Benefit**: Consistent UI/UX, easier maintenance, DRY principle

### 3. Clean Component Separation
- **Before**: Mixed data fetching and presentation logic
- **After**: Clear separation between container and presentational components
- **Benefit**: Easier testing, better code organization, single responsibility

## Components Overview

### ChartsFilterSidebar.tsx
**Role**: Form management and filter state collection

**Key Features**:
- Uses React Hook Form for state management
- Integrates shared UI components (`MyAsyncMultiSelect`, `MyDateInput`, `MyInput`)
- Exports `RoadDefectsFilterState` interface for type safety
- Supports configuration-based behavior (disable filters, lock severity)
- Cleans up filter data before sending to parent

**Props**:
```typescript
interface SidebarProps {
  config: ChartFilterConfig
  onApplyFilters: (filters: RoadDefectsFilterState) => void
}
```

**Usage Example**:
```tsx
<ChartsFilterSidebar
  config={{
    disableSeverityFilter: false,
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: true
  }}
  onApplyFilters={handleApplyFilters}
/>
```

### EffectiveRoadDefectsDashboard.tsx
**Role**: Pure presentational component for displaying chart data

**Key Features**:
- Accepts data via props (no internal data fetching)
- Handles loading, error, and empty states
- Uses ApexCharts for data visualization
- All chart data comes from props, no client-side processing

**Props**:
```typescript
interface DashboardProps {
  data: RoadDefectsAnalyticsData | null
  isLoading: boolean
}
```

**Usage Example**:
```tsx
<EffectiveRoadDefectsDashboard
  data={chartData}
  isLoading={isLoading}
/>
```

### ChartsPage.tsx (Container Component)
**Role**: Data fetching, state orchestration, and layout management

**Key Responsibilities**:
- Manages chart data state and loading states
- Handles API calls to backend endpoint
- Coordinates between filter sidebar and dashboard
- Manages tab navigation and configuration

**Key Functions**:
```typescript
const handleApplyFilters = async (filters: RoadDefectsFilterState) => {
  setIsLoading(true)
  setError(null)

  try {
    // TODO: Replace with actual SDK call
    // const response = await sdk.accident.roadDefectsAnalytics({ set: filters })

    // Mock implementation for now
    const response = await mockApiCall(filters)

    if (response.success) {
      setChartData(response.body)
    }
  } catch (error) {
    setError('خطا در دریافت اطلاعات')
  } finally {
    setIsLoading(false)
  }
}
```

## Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│ ChartsFilter    │───▶│ ChartsPage       │───▶│ EffectiveRoad   │
│ Sidebar         │    │ (Container)      │    │ DefectsDashboard│
│                 │    │                  │    │                 │
│ • Form State    │    │ • API Calls      │    │ • Pure Display  │
│ • Validation    │    │ • Data State     │    │ • Charts        │
│ • User Input    │    │ • Error Handling │    │ • Loading States│
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        ▲
         │                        │                        │
         ▼                        ▼                        │
┌─────────────────┐    ┌──────────────────┐               │
│                 │    │                  │               │
│ User Applies    │    │ Backend API      │───────────────┘
│ Filters         │    │ (roadDefects     │
│                 │    │  Analytics)      │
└─────────────────┘    └──────────────────┘
```

## Backend Integration

### Filter State Structure
The `RoadDefectsFilterState` interface matches the backend validator:

```typescript
export interface RoadDefectsFilterState {
  province?: string[]           // Multi-select provinces
  city?: string[]              // Multi-select cities
  dateOfAccidentFrom?: string  // ISO date string
  dateOfAccidentTo?: string    // ISO date string
  lightStatus?: string[]       // Multi-select light conditions
  collisionType?: string[]     // Multi-select collision types
  roadDefects?: string[]       // Multi-select road defects
  airStatuses?: string[]       // Multi-select weather conditions
  areaUsages?: string[]        // Multi-select area usage types
  roadSurfaceConditions?: string[] // Multi-select road surface conditions
  deadCountMin?: number        // Minimum fatalities filter
  deadCountMax?: number        // Maximum fatalities filter
  injuredCountMin?: number     // Minimum injuries filter
  injuredCountMax?: number     // Maximum injuries filter
  limit?: number              // Pagination limit
  page?: number               // Pagination page
}
```

### API Response Structure
```typescript
interface RoadDefectsAnalyticsData {
  defectDistribution: {
    withDefect: number      // Count of accidents with road defects
    withoutDefect: number   // Count of accidents without road defects
  }
  defectCounts: Array<{
    name: string           // Name of the road defect
    count: number          // Number of accidents with this defect
  }>
  totalAccidents: number   // Total number of accidents analyzed
  summary: {
    mostCommonDefect: string  // Name of most common defect
    defectPercentage: number  // Percentage of accidents with defects
  }
}
```

## Configuration Options

### Chart Filter Config
```typescript
interface ChartFilterConfig {
  disableSeverityFilter?: boolean      // Hide severity filter section
  disableCollisionTypeFilter?: boolean // Hide collision type filter
  disableLightingFilter?: boolean      // Hide lighting condition filter
  lockToSevereAccidents?: boolean      // Force minimum 1 fatality/injury
}
```

**Usage in different chart types**:
- **Road Defects Analysis**: `lockToSevereAccidents: true` (focus on severe accidents)
- **Lighting Analysis**: `disableCollisionTypeFilter: true` (lighting is primary factor)
- **General Analysis**: All filters enabled

## Migration Guide

### From Old to New Structure

**Old Pattern** (Client-side filtering):
```typescript
// ❌ Old way - client-side filtering
const filteredData = rawData
  .filter(item => item.severity === 'fatal')
  .sort((a, b) => b.count - a.count)
```

**New Pattern** (Backend filtering):
```typescript
// ✅ New way - backend filtering
const response = await sdk.accident.roadDefectsAnalytics({
  set: {
    deadCountMin: 1,
    limit: 100
  }
})
// Data comes pre-filtered and sorted from backend
```

### Component Migration

**Old Component** (Mixed responsibilities):
```tsx
// ❌ Old way
const Dashboard = () => {
  const [data, setData] = useState(mockData)
  const [filters, setFilters] = useState({})

  // Client-side filtering logic
  const filteredData = useMemo(() => {
    return data.filter(/* complex filtering logic */)
  }, [data, filters])

  return <Charts data={filteredData} />
}
```

**New Component** (Separated responsibilities):
```tsx
// ✅ New way
const DashboardContainer = () => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFilters = async (filters) => {
    const response = await api.getData(filters)
    setData(response.data)
  }

  return (
    <>
      <FilterSidebar onApplyFilters={handleFilters} />
      <Dashboard data={data} isLoading={isLoading} />
    </>
  )
}

const Dashboard = ({ data, isLoading }) => {
  if (isLoading) return <Loading />
  if (!data) return <NoData />
  return <Charts data={data} />
}
```

## Benefits of Refactoring

1. **Performance**: No client-side data processing for large datasets
2. **Consistency**: Single source of truth for business logic
3. **Maintainability**: Reusable components, clear separation of concerns
4. **Scalability**: Backend can optimize queries and handle large datasets
5. **Type Safety**: Shared interfaces ensure frontend/backend compatibility
6. **User Experience**: Better loading states, error handling, and feedback

## Future Enhancements

1. **Real API Integration**: Replace mock calls with actual SDK implementation
2. **Caching**: Add query caching for better performance
3. **Real-time Updates**: WebSocket integration for live data updates
4. **Export Features**: Add data export functionality
5. **Advanced Filtering**: More sophisticated filter combinations
6. **Responsive Design**: Better mobile experience for charts

## Testing Strategy

### Unit Tests
- Test filter form validation and submission
- Test chart rendering with different data sets
- Test loading and error states

### Integration Tests
- Test complete filter → API → chart flow
- Test different configuration options
- Test error handling and recovery

### E2E Tests
- User workflow: apply filters → view charts → export data
- Cross-browser compatibility for charts
- Performance testing with large datasets

---

**Last Updated**: Current implementation includes mock API calls. Replace with actual backend integration when SDK is available.
