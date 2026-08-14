# Total Reason Analytics Treemap Implementation

## Overview

This document describes the implementation of the "Distribution of Ultimate Cause in Severe Accidents" (توزیع علت تامه تصادفات در بروز تصادفات شدید) page, which displays the top 10 causes of severe accidents using a treemap visualization.

## File Structure

```
front/src/
├── app/charts/overall/total-reason-analytics/
│   └── page.tsx                                    # Main page component
├── components/charts/
│   └── TotalReasonTreemapChart.tsx                # Reusable treemap chart component
└── app/actions/accident/
    └── totalReasonAnalytics.ts                    # Server action (existing)
```

## Key Features

### 1. **Treemap Visualization**
- Professional color-coded treemap using ApexCharts.js
- Hierarchical data representation where size represents frequency
- 6-tier color scale from light yellow to dark brown
- Responsive design with mobile optimization

### 2. **Type-Safe Implementation**
- Full TypeScript integration with `ReqType` definitions
- Type-safe API calls using imported type definitions
- Proper interface definitions for response data

### 3. **Comprehensive Filtering**
- Integration with `ChartsFilterSidebar` component
- Locked to severe accidents (`lockToSevereAccidents: true`)
- Support for geographic, temporal, and categorical filters
- Advanced filtering options (road defects, lighting, collision types, etc.)

### 4. **User Experience**
- Loading states with skeleton UI
- Error handling with user-friendly messages
- Empty state handling
- Success notifications with data summary
- Manual refresh functionality

## Technical Implementation

### Main Page Component (`page.tsx`)

```typescript
interface TotalReasonAnalyticsResponse {
  analytics: Array<{
    name: string
    count: number
  }>
}
```

**Key Features:**
- Client-side component with state management
- Automatic data loading on mount
- Filter submission handling with type-safe API calls
- Error and loading state management
- Responsive layout with collapsible sidebar

### Treemap Chart Component (`TotalReasonTreemapChart.tsx`)

**Data Transformation:**
```typescript
const transformDataForTreemap = (apiData: TotalReasonData[]) => {
  const chartSeriesData = apiData.map(item => ({
    x: item.name,
    y: item.count
  }))
  return [{ data: chartSeriesData }]
}
```

**Chart Configuration:**
- Professional treemap with customized colors
- Persian/Farsi text support
- Responsive design for mobile devices
- Custom tooltip with formatted numbers
- Color legend with value ranges

## Color Coding System

| Range | Color | Hex Code |
|-------|-------|----------|
| 1-10 | Light Yellow | #fef3c7 |
| 11-25 | Yellow | #fcd34d |
| 26-50 | Orange | #f59e0b |
| 51-100 | Dark Orange | #d97706 |
| 101-200 | Brown | #b45309 |
| 201+ | Dark Brown | #92400e |

## API Integration

### Server Action Usage
```typescript
const result = await totalReasonAnalytics({
  set: {
    dateOfAccidentFrom: filters.dateOfAccidentFrom || '',
    dateOfAccidentTo: filters.dateOfAccidentTo || '',
    province: filters.province || [],
    city: filters.city || [],
    // ... other filters
  },
  get: {
    analytics: 1
  }
})
```

### Type Safety
- Uses `ReqType["main"]["accident"]["totalReasonAnalytics"]` for API calls
- Properly typed filter state interface
- Type-safe response handling

## Filter Configuration

The page uses the following filter configuration:
```typescript
{
  disableSeverityFilter: false,
  disableCollisionTypeFilter: false,
  disableLightingFilter: false,
  lockToSevereAccidents: true  // Enforces severe accident filtering
}
```

## User Interface Elements

### Header Section
- Page title in Persian
- Descriptive subtitle
- Refresh button with loading state
- Sidebar toggle button

### Main Content
- Error messages with red styling
- Success notifications with green styling
- Loading states with skeleton UI
- Statistical summary cards

### Statistical Summary
- Total number of identified causes
- Total accident count
- Primary cause identification

## Responsive Design

### Desktop (≥768px)
- Full sidebar with all filters
- Large treemap (500px height)
- Three-column statistical summary

### Mobile (<768px)
- Collapsible sidebar
- Smaller treemap (400px height)
- Single-column statistical layout
- Optimized font sizes

## Performance Considerations

1. **Dynamic Imports**: ApexCharts loaded dynamically to avoid SSR issues
2. **Memoization**: Chart options computed only when needed
3. **Lazy Loading**: Charts only render when data is available
4. **Error Boundaries**: Graceful error handling throughout

## Integration Points

### Navigation
- Integrates with `ChartNavigation` component
- Properly shows "overall" section as active

### Filtering
- Uses existing `ChartsFilterSidebar` component
- Maintains filter state consistency
- Supports all available filter types

## Usage Instructions

1. **Access the Page**: Navigate to `/charts/overall/total-reason-analytics`
2. **Apply Filters**: Use the sidebar to filter data by location, time, conditions
3. **View Results**: Treemap updates automatically with filtered data
4. **Interpret Data**: Larger rectangles represent more frequent causes
5. **Export**: Use chart toolbar to download visualization

## Future Enhancements

1. **Data Export**: Add CSV/Excel export functionality
2. **Drill-down**: Enable clicking on treemap sections for detailed analysis
3. **Comparison Mode**: Compare different time periods or regions
4. **Animation**: Add smooth transitions for data updates
5. **Accessibility**: Enhance keyboard navigation and screen reader support

## Dependencies

- **ApexCharts**: ^4.7.0 - Chart visualization library
- **React ApexCharts**: ^1.7.0 - React wrapper for ApexCharts
- **Next.js**: 15.3.2 - Framework
- **TypeScript**: Full type safety
- **Tailwind CSS**: Styling framework

## Maintenance Notes

- Chart colors follow the application's design system
- Persian number formatting using `toLocaleString('fa-IR')`
- All text content is in Persian/Farsi
- Component follows the existing codebase patterns and conventions
