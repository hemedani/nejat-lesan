# Accident Severity Chart Feature

## Overview

The Accident Severity Chart is a new feature that displays the distribution of accident severity types using a doughnut chart. This chart shows the percentage breakdown of accidents by severity: Fatal (فوتی), Injury (جرحی), and Damage-only (خسارتی).

## Location

- **Route**: `/charts/overall/accident-severity`
- **Page File**: `front/src/app/charts/overall/accident-severity/page.tsx`
- **Chart Component**: `front/src/components/dashboards/charts/AccidentSeverityChart.tsx`

## Key Features

### 1. Dynamic Chart Display Logic
The chart has two display modes based on severity filter settings:

- **Default Mode (Include Damage)**: Shows all three types (Fatal, Injury, Damage) with percentages calculated from the total of all three
- **Severe Accidents Only**: Shows only Fatal and Injury accidents with percentages calculated from their sum

### 2. Filter Integration
The chart integrates with the `ChartsFilterSidebar` component and respects all standard filters:
- Date range filtering
- Geographic filtering (Province, City)
- Lighting conditions
- Collision types
- Road surface conditions
- Road defects
- Severity constraints (minimum death/injury counts)

### 3. Responsive Design
- Mobile-friendly responsive layout
- Collapsible filter sidebar
- Loading states and error handling
- Empty state management

## File Structure

```
front/src/
├── app/charts/overall/accident-severity/
│   └── page.tsx                          # Main page component
├── components/dashboards/charts/
│   └── AccidentSeverityChart.tsx         # Chart visualization component
├── app/actions/accident/
│   └── accidentSeverityAnalytics.ts      # Server action (existing)
└── components/navigation/
    └── ChartNavigation.tsx               # Updated with new route
```

## Technical Implementation

### Data Flow

1. **Server Action**: `accidentSeverityAnalytics()` fetches data from backend
2. **Response Format**: `{ analytics: [{ name: string, count: number }] }`
3. **Client Processing**: Frontend calculates percentages based on filter state
4. **Visualization**: ApexCharts doughnut chart displays the processed data

### Key Components

#### AccidentSeverityChart.tsx
- **Props**:
  - `data`: Array of severity data from API
  - `isLoading`: Loading state boolean
  - `isDamageActive`: Boolean indicating if damage-only accidents should be included
- **Features**:
  - Conditional data processing based on `isDamageActive`
  - Color-coded severity types (Red for Fatal, Orange for Injury, Green for Damage)
  - Interactive tooltip with count formatting
  - Data summary table with percentages
  - Filter status information panel

#### page.tsx
- **State Management**: Handles loading, error states, and filter application
- **Filter Logic**: Determines if damage-only accidents should be included based on severity constraints
- **Integration**: Connects ChartsFilterSidebar with AccidentSeverityChart

### Logic for Damage Filter Detection

The system determines whether to include damage-only accidents based on severity filter constraints:

```typescript
// If no minimum death/injury counts are set (or they are 0), include damage-only accidents
const noMinimumDeathCount = !filters.deadCountMin || filters.deadCountMin === 0
const noMinimumInjuryCount = !filters.injuredCountMin || filters.injuredCountMin === 0
const damageActive = noMinimumDeathCount && noMinimumInjuryCount
```

### Chart Calculation Logic

```typescript
if (isDamageActive) {
  // Show all three types if damage filter is active
  totalCount = fatal + injury + damage
  chartSeries = [fatal, injury, damage]
  chartLabels = ['فوتی', 'جرحی', 'خسارتی']
} else {
  // Show only fatal and injury if damage filter is not active
  totalCount = fatal + injury
  chartSeries = [fatal, injury]
  chartLabels = ['فوتی', 'جرحی']
}
```

## API Integration

### Server Action Parameters
The feature uses the existing `accidentSeverityAnalytics` server action with the following structure:

```typescript
{
  set: {
    dateOfAccidentFrom?: string
    dateOfAccidentTo?: string
    officer?: string
    province?: string[]
    city?: string[]
    road?: string[]
    lightStatus?: string[]
    collisionType?: string[]
    roadSituation?: string[]
    roadSurfaceConditions?: string[]
    humanReasons?: string[]
    roadDefects?: string[]
    vehicleSystem?: string[]
    driverSex?: string[]
    driverLicenceType?: string[]
  },
  get: {
    analytics: 1
  }
}
```

### Expected Response Format
```typescript
{
  success: boolean
  body: {
    analytics: Array<{
      name: string  // "فوتی", "جرحی", or "خسارتی"
      count: number
    }>
  }
  error?: string
}
```

## Navigation Integration

The chart has been added to the Overall Charts section navigation:

```typescript
case 'overall':
  return [
    { id: 'road-defects', label: 'نقص راه', href: '/charts/overall/road-defects' },
    { id: 'monthly-holiday', label: 'تحلیل ماهانه تعطیلات', href: '/charts/overall/monthly-holiday' },
    { id: 'hourly-day-of-week', label: 'تحلیل ساعتی روز هفته', href: '/charts/overall/hourly-day-of-week' },
    { id: 'collision-analytics', label: 'تحلیل انواع برخورد', href: '/charts/overall/collision-analytics' },
    { id: 'accident-severity', label: 'سهم شدت تصادفات', href: '/charts/overall/accident-severity' }
  ]
```

## Usage Instructions

1. **Access**: Navigate to Charts → Overall View → "سهم شدت تصادفات"
2. **Apply Filters**: Use the sidebar to filter data by location, time, conditions, etc.
3. **Severity Control**:
   - Leave death/injury minimums empty or at 0 to include all accident types
   - Set minimums > 0 to focus only on severe accidents (fatal + injury)
4. **View Results**: The chart updates automatically with percentage breakdowns

## Styling and Colors

- **Fatal (فوتی)**: Red (`#EF4444`)
- **Injury (جرحی)**: Orange (`#F59E0B`)
- **Damage (خسارتی)**: Green (`#10B981`)

## Error Handling

- Network errors display user-friendly messages
- Empty data states show informative placeholders
- Loading states with spinners during data fetching
- Validation of required API response fields

## Future Enhancements

Possible improvements for future versions:
- Export chart data to CSV/Excel
- Time-based comparison views
- Drill-down capabilities by region
- Integration with map visualizations
- Advanced statistical calculations (trends, predictions)
