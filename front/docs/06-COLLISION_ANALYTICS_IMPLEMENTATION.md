# Collision Analytics Dashboard Implementation

## Overview

This document describes the implementation of the **Collision Type Analytics** dashboard, a comprehensive multi-chart visualization system that analyzes collision types, single-vehicle subtypes, and other miscellaneous collision events within the Next.js application.

## 📁 File Structure

### Main Page
- **Location**: `src/app/charts/overall/collision-analytics/page.tsx`
- **Route**: `/charts/overall/collision-analytics`
- **Description**: Main page component that handles data fetching, state management, and layout

### Dashboard Components
- **Main Dashboard**: `src/components/dashboards/CollisionAnalyticsDashboard.tsx`
- **Individual Charts**:
  - `src/components/dashboards/charts/MainCollisionChart.tsx` - دoughnut chart for main collision types
  - `src/components/dashboards/charts/SingleVehicleChart.tsx` - doughnut chart for single-vehicle accidents
  - `src/components/dashboards/charts/OtherCollisionTypesChart.tsx` - bar chart for other collision types

## 🚀 Features

### 1. Multi-Chart Dashboard
- **Main Collision Types**: Doughnut chart showing distribution of primary collision types
- **Single Vehicle Accidents**: Doughnut chart displaying single-vehicle collision subtypes
- **Other Collision Types**: Horizontal bar chart for miscellaneous collision events

### 2. Interactive Elements
- **Filter Sidebar**: Full integration with `ChartsFilterSidebar` component
- **Real-time Data Loading**: Async data fetching with loading states
- **Responsive Design**: Mobile-first responsive layout
- **Error Handling**: Comprehensive error states and user feedback

### 3. Data Visualization
- **ApexCharts Integration**: Modern, interactive charts with tooltips and legends
- **Persian Language Support**: RTL layout and Persian labels
- **Color-coded Categories**: Distinct color schemes for each chart type
- **Summary Statistics**: Key metrics and insights display

### 4. User Experience
- **Loading States**: Smooth loading animations during data fetch
- **Empty States**: Informative messages when no data is available
- **Success Indicators**: Visual feedback when data loads successfully
- **Quick Navigation**: Integration with overall charts navigation

## 🔧 Technical Implementation

### Data Flow
1. **Server Action**: Uses `collisionAnalytics` from `src/app/actions/accident/collisionAnalytics.ts`
2. **Type Safety**: Implements custom `CollisionAnalyticsResponse` interface
3. **State Management**: React useState hooks for data, loading, and error states
4. **Filter Integration**: Seamless integration with existing filter system

### API Integration
```typescript
// Request structure
{
  set: {
    dateOfAccidentFrom?: string;
    dateOfAccidentTo?: string;
    province?: string[];
    city?: string[];
    road?: string[];
    accidentType?: string[];
    collisionType?: string[];
    lightStatus?: string[];
    roadSituation?: string[];
  },
  get: {
    mainChart: 1,
    singleVehicleChart: 1,
    otherTypesChart: 1
  }
}

// Response structure
{
  mainChart: Array<{ name: string, count: number }>,
  singleVehicleChart: Array<{ name: string, count: number }>,
  otherTypesChart: Array<{ name: string, count: number }>
}
```

### Component Architecture
- **Page Component**: Handles routing, state, and layout
- **Dashboard Component**: Orchestrates multiple charts and summary statistics
- **Individual Chart Components**: Specialized components for each chart type
- **Shared Filter Component**: Reuses existing `ChartsFilterSidebar`

## 📊 Chart Specifications

### Main Collision Chart (نحوه برخورد)
- **Type**: Doughnut Chart
- **Library**: ApexCharts
- **Features**: Center total, percentage labels, responsive legend
- **Colors**: Blue-based color palette

### Single Vehicle Chart (تصادفات تک وسیله‌ای)
- **Type**: Doughnut Chart
- **Library**: ApexCharts
- **Features**: Center total, percentage labels, responsive legend
- **Colors**: Yellow/Orange-based color palette

### Other Collision Types Chart (شمار سایر انواع برخورد)
- **Type**: Horizontal Bar Chart
- **Library**: ApexCharts
- **Features**: Data labels, sorted by count, responsive design
- **Colors**: Purple-based color scheme

## 🎨 UI/UX Features

### Summary Statistics Cards
- Total accidents count
- Main collision types count
- Single vehicle accidents count
- Other types count

### Key Insights Panel
- Most common main collision type
- Most common single vehicle accident type
- Automatic calculation and display

### Data Tables
- Sortable data summaries for each chart
- Percentage calculations
- Color-coded indicators
- Scrollable lists for large datasets

## 🔗 Navigation Integration

### Quick Access Card
Added to the main overall charts page (`/charts/overall`) with:
- Orange-themed styling
- Lightning bolt icon
- Direct link to collision analytics page

### Breadcrumb Path
```
Charts (نمودارها) → Overall View (دید کلی) → Collision Analytics (تحلیل انواع برخورد)
```

## 🛠 Filter Configuration

### Supported Filters
- Date range (from/to)
- Province selection
- City selection
- Collision type filtering
- Light status filtering
- And other standard filters from `ChartsFilterSidebar`

### Filter Configuration
```typescript
const getFilterConfig = () => ({
  disableSeverityFilter: false,
  disableCollisionTypeFilter: false,
  disableLightingFilter: false,
  lockToSevereAccidents: false
});
```

## 🚦 Error Handling

### Loading States
- Individual chart loading spinners
- Page-level loading indicators
- Skeleton loading patterns

### Error States
- Network error handling
- Empty data states
- User-friendly error messages in Persian

### Success States
- Data loading confirmation
- Summary statistics display
- Visual success indicators

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Single column layout
- **Tablet**: Two-column grid for doughnut charts
- **Desktop**: Optimized multi-column layout

### Mobile Optimizations
- Touch-friendly interactions
- Optimized chart sizing
- Collapsible filter sidebar
- Responsive typography

## 🔍 Usage Instructions

### Accessing the Dashboard
1. Navigate to the main charts page
2. Click on "تحلیل انواع برخورد" in the quick access section
3. Or directly visit `/charts/overall/collision-analytics`

### Using Filters
1. Open the filter sidebar (shown by default)
2. Select desired date range, provinces, cities, etc.
3. Click apply to refresh data
4. Use the reload button for manual refresh

### Interpreting Charts
- **Doughnut Charts**: Show proportional distribution with percentages
- **Bar Chart**: Shows absolute counts sorted by frequency
- **Summary Cards**: Provide quick overview statistics
- **Data Tables**: Offer detailed breakdowns with percentages

## 🔮 Future Enhancements

### Potential Improvements
- Export functionality (PDF, Excel)
- Advanced filtering options
- Time-series comparison views
- Drill-down capabilities
- Custom date range presets

### Performance Optimizations
- Chart data caching
- Lazy loading for large datasets
- Progressive data loading
- Memory usage optimization

## 📋 Dependencies

### Core Libraries
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- ApexCharts & react-apexcharts
- Tailwind CSS

### Internal Dependencies
- `ChartsFilterSidebar` component
- `ChartNavigation` component
- Collision analytics server action
- Type definitions from `selectInp.ts`

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: ✅ Complete and Ready for Production
