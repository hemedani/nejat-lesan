# Temporal Severity Analytics Implementation

## Overview

This document describes the implementation of the "Temporal Comparison of the Share of Fatal Accidents from Severe Accidents" chart feature. This new standalone Next.js page displays time-series data showing the percentage of fatal accidents among severe accidents over different time periods.

## Files Created/Modified

### New Files Created

1. **`src/app/charts/temporal/severity-analytics/page.tsx`**
   - Main page component for the temporal severity analytics
   - Implements the complete page layout with filters, chart, and analytics panels
   - Handles data fetching using the existing server action
   - Includes demo data fallback for development/testing

2. **`src/components/charts/TemporalSeverityChart.tsx`**
   - Reusable chart component using ApexCharts
   - Configured specifically for percentage data with proper Y-axis formatting
   - Implements line chart with smooth curves and data point markers
   - Responsive design with mobile optimization

### Modified Files

3. **`src/components/navigation/ChartNavigation.tsx`**
   - Added "سهم تصادفات فوتی از شدید" to the temporal section navigation
   - Updated the `getChartNavigation` function for the temporal section

4. **`src/app/charts/temporal/page.tsx`**
   - Added new navigation card for the severity analytics chart
   - Updated grid layout to accommodate the new chart option
   - Added appropriate icon and description

## Route Structure

The new page is accessible at:
```
/charts/temporal/severity-analytics
```

This follows the existing pattern:
- Main Charts tab → Temporal Comparison sub-tab → Severity Analytics chart

## API Integration

### Server Action
Uses the existing server action:
```typescript
temporalSeverityAnalytics(details: ReqType["main"]["accident"]["temporalSeverityAnalytics"])
```

### Request Parameters
The API accepts the following filter parameters:
- `dateOfAccidentFrom` / `dateOfAccidentTo`: Date range filters
- `province`: Array of province names
- `city`: Array of city names
- `lightStatus`: Array of lighting conditions
- `collisionType`: Array of collision types
- `roadDefects`: Array of road defects
- `roadSurfaceConditions`: Array of road surface conditions

### Response Format
Expected API response structure:
```json
{
  "body": {
    "analytics": {
      "categories": ["1401-01", "1401-02", ...],
      "series": [{
        "name": "سهم تصادفات فوتی از شدید",
        "data": [12.5, 15.3, 18.2, ...]
      }]
    }
  },
  "success": true
}
```

## Chart Configuration

### Chart Type
- **Line Chart** with smooth curves
- Configured for percentage data display
- Y-axis formatted to show percentage values
- Data labels enabled showing percentages

### Features
- Interactive tooltips with percentage formatting
- Zoom and pan capabilities
- Download functionality
- Responsive design for mobile devices
- Data point markers for better visibility

### Color Scheme
- Primary line color: Red (#EF4444) - emphasizing the severity nature
- Supporting colors: Orange, Green, Blue for additional metrics

## Component Architecture

### Page Component (`TemporalSeverityAnalyticsPage`)
- **State Management**:
  - Chart data state
  - Loading state
  - Error handling
  - Demo mode for fallback data
- **Data Fetching**:
  - Initial load on component mount
  - Filter-based data refresh
  - Error handling with demo data fallback
- **UI Layout**:
  - Filter sidebar integration
  - Main chart area
  - Statistics and insights panels
  - Responsive design

### Chart Component (`TemporalSeverityChart`)
- **Props Interface**:
  ```typescript
  interface TemporalSeverityChartProps {
    data: TemporalSeverityData | null
    isLoading: boolean
  }
  ```
- **Features**:
  - Loading state with skeleton animation
  - Empty state handling
  - Statistics calculation and display
  - ApexCharts integration with custom configuration

## Filter Integration

### Filter Configuration
```typescript
const getFilterConfig = () => {
  return {
    disableSeverityFilter: false,
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: true // Lock to severe accidents for severity analysis
  }
}
```

### Supported Filters
- Date range selection
- Province and city selection
- Light status conditions
- Collision types
- Road defects
- Road surface conditions

## Statistics and Analytics

### Calculated Metrics
- **Average Percentage**: Mean of all time periods
- **Maximum Percentage**: Highest value and its period
- **Minimum Percentage**: Lowest value and its period
- **Range**: Difference between max and min values
- **Period Count**: Total number of time periods analyzed

### Insights Panel
- Data summary with key statistics
- Recommendations based on patterns
- Period analysis with peak identification

## Error Handling and Fallback

### Demo Data
Includes realistic demo data for development and testing:
```typescript
const DEMO_DATA: TemporalSeverityData = {
  categories: ["1401-01", "1401-02", ...],
  series: [{
    name: "سهم تصادفات فوتی از شدید",
    data: [12.5, 15.3, 18.2, ...]
  }]
}
```

### Error States
- Network error handling with demo data fallback
- API failure handling with user-friendly messages
- Loading states with proper UX indicators

## Navigation Integration

### Breadcrumbs
```
داشبورد → نمودارها → مقایسه زمانی → سهم تصادفات فوتی از شدید
```

### Tab Navigation
- Integrated into the main Charts tab
- Part of the Temporal Comparison sub-section
- Consistent with existing navigation patterns

## User Experience Features

### Interactive Elements
- Filter sidebar toggle
- Data refresh button
- API retry functionality in demo mode
- Responsive design for all screen sizes

### Visual Feedback
- Loading spinners during data fetch
- Success/warning/error status messages
- Color-coded statistics (red for max, green for min)
- Progressive disclosure of analytics panels

## Build and Deployment

### Build Status
✅ Successfully builds without errors
✅ Route generated: `/charts/temporal/severity-analytics`
✅ Bundle size: 6.97 kB First Load JS

### Type Safety
- Full TypeScript integration
- Type-safe API request/response interfaces
- Proper component prop typing

## Testing and Validation

### Manual Testing
- Page loads correctly
- Navigation works properly
- Chart renders with demo data
- Filters integrate correctly
- Responsive design functions

### Future Testing Recommendations
- Unit tests for chart component
- Integration tests for data fetching
- E2E tests for user workflows
- Performance testing for large datasets

## Usage Instructions

1. **Access the Chart**:
   - Navigate to Charts → Temporal Comparison
   - Click on "سهم تصادفات فوتی از شدید" card

2. **Apply Filters**:
   - Use the sidebar filters to select date ranges, provinces, etc.
   - Click "اعمال فیلتر" to refresh data

3. **Interact with Chart**:
   - Hover over data points for detailed information
   - Use zoom and pan features for detailed analysis
   - Download chart using the toolbar options

4. **Analyze Results**:
   - Review statistics in the insights panel
   - Check recommendations for actionable insights
   - Compare different time periods

## Future Enhancements

### Potential Improvements
- Add data export functionality
- Implement chart comparison features
- Add more granular time period options
- Include trend analysis calculations
- Add alert system for significant changes

### Performance Optimizations
- Implement data caching
- Add pagination for large datasets
- Optimize chart rendering for mobile devices
- Add lazy loading for heavy computations

## Conclusion

The Temporal Severity Analytics feature has been successfully implemented following the existing application patterns and architecture. It provides a comprehensive view of fatal accident trends over time with full integration into the navigation system and consistent user experience across the application.
