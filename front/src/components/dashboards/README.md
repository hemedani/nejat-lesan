# Charts Dashboard System - Nejat Traffic Safety Analysis

## Overview

This directory contains the dashboard components for the Nejat traffic safety analysis system. The implementation provides a comprehensive charts page with professional tab navigation and interactive data visualization components.

## 🏗️ Architecture

### Main Components

1. **Charts Page** (`/src/app/charts/page.tsx`)
   - Main entry point with tab navigation
   - Handles routing between different chart categories
   - Responsive design with formal styling

2. **EffectiveRoadDefectsDashboard** (`EffectiveRoadDefectsDashboard.tsx`)
   - First implemented dashboard under "دید کلی" (Overall View)
   - Contains doughnut and bar charts for road defect analysis
   - Includes summary statistics cards

### Tab Structure

```
Charts Page
├── نمودارها (Charts) [Active by default]
│   ├── دید کلی (Overall View) [Active by default]
│   ├── مقایسه زمانی (Temporal Comparison)
│   ├── مقایسه مکانی (Spatial Comparison)
│   └── روند رویداد (Event Trend)
└── نقشه‌ها (Maps)
```

## 🎯 Key Features

### Design Requirements Met

- ✅ **Persian Language**: All UI text, labels, tooltips in Persian (Farsi)
- ✅ **Formal Design**: Professional styling suitable for law enforcement
- ✅ **Responsive Layout**: Works on all screen sizes
- ✅ **Interactive Charts**: Hover effects and tooltips
- ✅ **Tab Navigation**: Clean navigation between sections

### Technical Implementation

- **Framework**: Next.js 15 with TypeScript
- **Charts**: ApexCharts.js for interactive visualizations
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks for tab navigation

## 📊 Effective Road Defects Dashboard

### Chart 1: Doughnut Chart
- **Purpose**: Shows percentage of accidents with/without road defects
- **Data**: 65% with defects, 35% without defects
- **Features**:
  - Center displays total accidents count (779)
  - Persian tooltips with percentages
  - Formal color scheme (red/green)

### Chart 2: Bar Chart
- **Purpose**: Frequency count of road defect types
- **Features**:
  - Automatic descending sort by frequency
  - **Special Rule**: "سایر موارد" (Other) always appears last
  - Zero values automatically filtered out
  - Persian labels and tooltips

### Data Structure

```typescript
interface RoadDefectItem {
  name: string  // Persian defect type name
  value: number // Frequency count
}

// Example data
const roadDefects = [
  { name: 'نقص علائم عمودی', value: 42 },
  { name: 'لغزندگی سطح راه', value: 31 },
  { name: 'فقدان حفاظ ایمنی', value: 25 },
  // ... more items
  { name: 'سایر موارد', value: 22 } // Always last
]
```

## 🔧 ChartsFilterSidebar Component

### Overview
The `ChartsFilterSidebar` is a dynamic, reusable filtering component that serves as the primary filtering interface for all dashboards in the Nejat traffic analysis application. It provides comprehensive filtering capabilities with configurable behavior based on the current chart context.

### Key Features
- ✅ **Dynamic Configuration**: Filters can be enabled/disabled based on chart requirements
- ✅ **Persian Interface**: All labels, options, and interactions in Farsi
- ✅ **Professional Design**: Formal styling suitable for law enforcement
- ✅ **Collapsible Sections**: Simple and advanced filters organization
- ✅ **Locked States**: Certain filters can be locked to specific values
- ✅ **Cascading Dropdowns**: Geographic area selection with dependency logic
- ✅ **Nested Checkboxes**: Complex filter structures for collision types

### Component Signature

```typescript
interface ChartFilterConfig {
  disableSeverityFilter?: boolean
  disableCollisionTypeFilter?: boolean
  disableLightingFilter?: boolean
  lockToSevereAccidents?: boolean
}

interface SidebarProps {
  config: ChartFilterConfig
  onApplyFilters: (filters: FiltersState) => void
}
```

### Filter Sections

#### Simple Filters (فیلترهای ساده)
Always visible at the top of the sidebar:

1. **Time Range (بازه زمانی)**
   - Radio button group with predefined ranges
   - Custom date range picker option
   - Default: "یک ساله" (One Year)

2. **Geographic Area (محدوده مکانی)**
   - Cascading dropdowns: استان → شهر → پاسگاه
   - Province selection enables city dropdown
   - City selection enables station dropdown

3. **Accident Severity (شدت تصادف)**
   - Checkboxes: فوتی، جرحی، خسارتی
   - Can be disabled via config
   - Can be locked to severe accidents only

#### Advanced Filters (فیلترهای پیشرفته)
Collapsible section with comprehensive filtering options:

1. **Days of Week (روزهای هفته)**: All 7 days with Persian names
2. **Holiday Status (تعطیل و غیر تعطیل)**: Holiday and non-holiday options
3. **Collision Type (نوع برخورد)**: Nested structure with main types and subtypes
4. **Lighting Condition (وضعیت روشنایی)**: 5 lighting conditions
5. **Weather Condition (وضعیت جوی)**: Weather types
6. **Accident Location (محل تصادف)**: Position and land use subcategories

### Configuration Examples

```typescript
// Default configuration - all filters enabled
const defaultConfig = {
  disableSeverityFilter: false,
  disableCollisionTypeFilter: false,
  disableLightingFilter: false,
  lockToSevereAccidents: false
}

// Road defects analysis - lock to severe accidents
const roadDefectsConfig = {
  disableSeverityFilter: false,
  disableCollisionTypeFilter: false,
  disableLightingFilter: false,
  lockToSevereAccidents: true
}

// Lighting analysis - disable collision type
const lightingConfig = {
  disableSeverityFilter: false,
  disableCollisionTypeFilter: true,
  disableLightingFilter: false,
  lockToSevereAccidents: false
}
```

### Usage Example

```tsx
import ChartsFilterSidebar from '@/components/dashboards/ChartsFilterSidebar'

const MyDashboard = () => {
  const [filters, setFilters] = useState(null)

  const config = {
    disableSeverityFilter: false,
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: true
  }

  const handleApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters)
    // Process filters and update charts
  }

  return (
    <div className="flex">
      <div className="flex-1">
        {/* Chart content */}
      </div>
      <ChartsFilterSidebar
        config={config}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  )
}
```

### Demo Page
A comprehensive demo page is available at `/charts-filter-demo` showcasing:
- Different configuration presets
- Real-time filter state visualization
- Interactive configuration switching
- Applied filters summary display

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6, #1F2937)
- **Success**: Green (#059669)
- **Danger**: Red (#DC2626)
- **Warning**: Yellow (#F59E0B)
- **Neutral**: Gray shades (#374151, #6B7280, #E5E7EB)

### Typography
- **Headers**: Bold, 18px-24px
- **Body**: 14px-16px
- **Labels**: 12px-14px
- **Font**: System fonts with Persian support

## 🚀 Usage

### Adding New Dashboards

1. Create new component in `/src/components/dashboards/`
2. Import and add to the charts page tab content
3. Follow the established patterns for:
   - Persian text and labels
   - Formal color scheme
   - Responsive grid layout
   - Summary statistics cards

### Extending Tab Navigation

```tsx
// Add new sub-tab
const chartSubTabs: TabItem[] = [
  { id: 'overall', label: 'دید کلی' },
  { id: 'temporal', label: 'مقایسه زمانی' },
  { id: 'spatial', label: 'مقایسه مکانی' },
  { id: 'trend', label: 'روند رویداد' },
  { id: 'new-tab', label: 'تب جدید' } // New tab
]
```

## 📱 Responsive Behavior

- **Desktop**: 2-column grid for charts
- **Tablet**: Adaptive layout with proper spacing
- **Mobile**: Single column with optimized chart sizes

## 🔧 Development Notes

### Dependencies
- `react-apexcharts`: Chart rendering
- `apexcharts`: Core charting library
- `next/dynamic`: SSR-safe dynamic imports

### Important Implementation Details

1. **SSR Handling**: Charts use `dynamic()` import with `ssr: false`
2. **Data Processing**: Bar chart implements custom sorting logic
3. **TypeScript**: Full type safety for chart configurations
4. **Performance**: Optimized build with proper code splitting

### Mock Data
Currently uses hardcoded mock data for demonstration. In production:
- Replace with API calls
- Implement loading states
- Add error handling
- Cache data appropriately

## 🔜 Future Enhancements

- [ ] Implement remaining sub-tabs (Temporal, Spatial, Trend)
- [ ] Add Maps functionality
- [ ] Connect to real data APIs
- [ ] Add data export features
- [ ] Implement chart filtering and drill-down
- [ ] Add print/PDF export functionality

## 📄 File Structure

```
/src/components/dashboards/
├── README.md (this file)
├── EffectiveRoadDefectsDashboard.tsx
└── [future dashboard components]

/src/app/charts/
└── page.tsx (main charts page)
```
