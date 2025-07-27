# Charts Filter Sidebar Refactoring

## Overview

This document outlines the comprehensive refactoring of the `ChartsFilterSidebar` component to make it **dynamic and context-aware**. The sidebar now only renders the specific filters required by each chart page, instead of displaying all possible filters regardless of context.

## Key Architectural Changes

### 1. Single Source of Truth
- The list of required filters for any chart is now defined by its backend endpoint's validator
- In the frontend, this "source of truth" is the type definition for the `set` object of each action in `selectInp.ts`
- The sidebar's logic is driven by these types through the new `enabledFilters` prop

### 2. Prop-Driven Rendering
- The sidebar now accepts an `enabledFilters` prop: `Array<keyof RoadDefectsFilterState>`
- Each string in this array corresponds to a filter key (e.g., `"province"`, `"deadCountMin"`, `"collisionType"`)
- The sidebar uses this array to determine which filter controls to render

### 3. Centralized Logic
- All filter display logic is now centralized within the sidebar component
- Pages no longer need complex conditional logic for filters
- Filter management is consistent across the entire application

## Implementation Details

### Updated `ChartsFilterSidebar.tsx`

#### New Props Interface
```typescript
interface SidebarProps {
  config: ChartFilterConfig;
  onApplyFilters: (filters: RoadDefectsFilterState) => void;
  title?: string;
  description?: string;
  initialFilters?: Partial<RoadDefectsFilterState>;
  dynamicCheckboxFilter?: DynamicCheckboxFilter;
  enabledFilters: Array<keyof RoadDefectsFilterState>; // NEW PROP
}
```

#### Conditional Rendering Pattern
Every filter control is now wrapped in conditional rendering:

```typescript
{enabledFilters.includes("province") && (
  <MyAsyncMultiSelect
    name="province"
    label="استان"
    // ... other props
  />
)}
```

For grouped filters:
```typescript
{(enabledFilters.includes("deadCountMin") || enabledFilters.includes("deadCountMax")) && (
  <div className="grid grid-cols-2 gap-4">
    {enabledFilters.includes("deadCountMin") && (
      <MyInput name="deadCountMin" ... />
    )}
    {enabledFilters.includes("deadCountMax") && (
      <MyInput name="deadCountMax" ... />
    )}
  </div>
)}
```

### Chart Filters Utility (`src/utils/chartFilters.ts`)

A comprehensive utility that provides:

#### Common Filter Sets
```typescript
export const COMMON_FILTER_SETS = {
  BASIC: ["dateOfAccidentFrom", "dateOfAccidentTo", "province", "city", "officer"],
  GEOGRAPHIC: [...], // For spatial analysis
  SEVERITY: [...],   // For severity analysis
  ALL: [...]         // All available filters
};
```

#### Chart-Specific Filter Sets
```typescript
export const CHART_SPECIFIC_FILTERS = {
  SPATIAL_LIGHT_ANALYTICS: [...],
  COLLISION_ANALYTICS: [...],
  ROAD_DEFECTS_ANALYTICS: [...],
  // ... more chart types
};
```

#### Helper Functions
- `getEnabledFiltersForChart(chartType)` - Get filters for a specific chart
- `combineFilterSets(...filterSets)` - Combine multiple filter sets
- `createCustomFilterSet(baseSet, additions, removals)` - Create custom filter combinations

## Usage Examples

### Basic Usage
```typescript
import { getEnabledFiltersForChart } from "@/utils/chartFilters";

// Get enabled filters for a specific chart type
const ENABLED_FILTERS = getEnabledFiltersForChart("SPATIAL_LIGHT_ANALYTICS");

// Use in component
<ChartsFilterSidebar
  onApplyFilters={handleApplyFilters}
  config={getFilterConfig()}
  enabledFilters={ENABLED_FILTERS}
/>
```

### Custom Filter Set
```typescript
import { createCustomFilterSet, COMMON_FILTER_SETS } from "@/utils/chartFilters";

// Create custom set based on basic filters, add lightStatus, remove officer
const CUSTOM_FILTERS = createCustomFilterSet(
  COMMON_FILTER_SETS.BASIC,
  ["lightStatus"],
  ["officer"]
);
```

### Multiple Filter Sets
```typescript
import { combineFilterSets, COMMON_FILTER_SETS } from "@/utils/chartFilters";

// Combine basic and geographic filters
const COMBINED_FILTERS = combineFilterSets(
  COMMON_FILTER_SETS.BASIC,
  COMMON_FILTER_SETS.GEOGRAPHIC
);
```

## Migration Guide

### For Existing Chart Pages

1. **Add the import:**
```typescript
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
```

2. **Define enabled filters:**
```typescript
// Get enabled filters for your specific chart type
const ENABLED_FILTERS = getEnabledFiltersForChart("YOUR_CHART_TYPE");
```

3. **Update the sidebar component:**
```typescript
<ChartsFilterSidebar
  // ... existing props
  enabledFilters={ENABLED_FILTERS}
/>
```

### For New Chart Pages

1. **Determine your chart type** from the available options in `CHART_SPECIFIC_FILTERS`
2. **If your chart type doesn't exist**, add it to `chartFilters.ts`
3. **Follow the usage examples** above

## Available Chart Types

The following chart types are predefined in the utility:

- `SPATIAL_LIGHT_ANALYTICS` - For light condition spatial analysis
- `COLLISION_ANALYTICS` - For collision type analysis
- `ROAD_DEFECTS_ANALYTICS` - For road defects analysis
- `HUMAN_REASON_ANALYTICS` - For human factor analysis
- `VEHICLE_REASON_ANALYTICS` - For vehicle factor analysis
- `AREA_USAGE_ANALYTICS` - For area usage analysis
- `ACCIDENT_SEVERITY_ANALYTICS` - For severity analysis
- `MONTHLY_HOLIDAY_ANALYTICS` - For temporal analysis
- `HOURLY_DAY_ANALYTICS` - For hourly/daily analysis
- `COMPANY_PERFORMANCE_ANALYTICS` - For vehicle company analysis
- `TOTAL_REASON_ANALYTICS` - For comprehensive reason analysis
- `HOTSPOTS_ANALYTICS` - For geographic hotspot analysis
- `REGIONAL_ANALYTICS` - For regional comparison
- `SAFETY_INDEX_ANALYTICS` - For safety assessment

## Migration Script

A migration script is available at `front/scripts/update-chart-filters.js` to help automate the process:

```bash
cd front
node scripts/update-chart-filters.js
```

This script will:
- Find all chart pages that need updating
- Add the necessary imports
- Add the enabled filters constant
- Add the `enabledFilters` prop to `ChartsFilterSidebar` components

## Benefits

### 1. **Cleaner UI**
- Only relevant filters are shown to users
- Reduces cognitive load and improves user experience
- Faster page loading due to fewer rendered components

### 2. **Better Maintainability**
- Centralized filter logic
- Type-safe filter definitions
- Easy to add new chart types or modify existing ones

### 3. **Consistency**
- All charts follow the same pattern
- Standardized approach to filter management
- Easier onboarding for new developers

### 4. **Flexibility**
- Easy to create custom filter combinations
- Reusable filter sets across different charts
- Simple to modify filters for existing charts

## Type Safety

The refactoring maintains full TypeScript safety:

```typescript
// All filter keys are type-checked against RoadDefectsFilterState
type EnabledFilters = Array<keyof RoadDefectsFilterState>;

// Helper functions provide proper type inference
const filters = getEnabledFiltersForChart("SPATIAL_LIGHT_ANALYTICS");
// filters is automatically typed as Array<keyof RoadDefectsFilterState>
```

## Future Enhancements

1. **Dynamic Filter Dependencies**
   - Implement logic where certain filters appear based on other filter selections
   - Example: Show city filter only when province is selected

2. **Filter Validation**
   - Add runtime validation to ensure required filters are present
   - Warn developers about missing critical filters

3. **Performance Optimization**
   - Lazy load filter options for better performance
   - Cache filter results to reduce API calls

4. **User Preferences**
   - Allow users to save preferred filter combinations
   - Remember user's last used filters per chart type

## Testing

When testing the refactored components:

1. **Verify Filter Visibility**
   - Ensure only enabled filters are visible
   - Check that disabled filters are completely hidden

2. **Test Filter Functionality**
   - Confirm all visible filters work correctly
   - Verify form submission includes only enabled filter values

3. **Type Safety**
   - Run TypeScript compilation to catch any type errors
   - Ensure no runtime errors related to missing filters

## Troubleshooting

### Common Issues

1. **Missing enabledFilters prop**
   - Error: `Property 'enabledFilters' is missing`
   - Solution: Add the `enabledFilters` prop to your `ChartsFilterSidebar` component

2. **Wrong chart type**
   - Issue: Incorrect filters showing for your chart
   - Solution: Verify you're using the correct chart type in `getEnabledFiltersForChart()`

3. **Import errors**
   - Error: Cannot resolve '@/utils/chartFilters'
   - Solution: Ensure the path is correct and the file exists

### Getting Help

If you encounter issues during migration:
1. Check this documentation first
2. Review the example implementations in the codebase
3. Run the migration script to automate common changes
4. Consult the TypeScript compiler for type-related issues
