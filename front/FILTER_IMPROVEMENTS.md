# Filter Improvements for ChartsFilterSidebar Component

This document outlines the comprehensive improvements made to the `ChartsFilterSidebar` component to fully support all filters available in the `mapAccidents` action.

## Overview

The `ChartsFilterSidebar` component has been enhanced to include all filters supported by the `mapAccidents` action as defined in the `ReqType["main"]["accident"]["mapAccidents"]` interface. This ensures that users can access the full range of filtering capabilities when viewing accident data on maps.

## Implemented Filters

### Core Accident Details
- ✅ **Serial Numbers**: `seri` and `serial` - Numeric inputs for accident identification
- ✅ **Date Range**: `dateOfAccidentFrom` and `dateOfAccidentTo` - Date picker inputs
- ✅ **Casualty Counts**:
  - `deadCountMin` and `deadCountMax` - Minimum and maximum fatality counts
  - `injuredCountMin` and `injuredCountMax` - Minimum and maximum injury counts
- ✅ **Officer**: `officer` - Text input for responsible officer name

### Location & Context Filters
- ✅ **Geographic**: `province[]`, `city[]`, `road[]` - Multi-select dropdowns with async loading
- ✅ **Zones**: `trafficZone[]`, `cityZone[]` - Traffic and city zone selections
- ✅ **Accident Classification**: `accidentType[]` - Type of accident multi-select
- ✅ **Position & Ruling**: `position[]`, `rulingType[]` - Position and ruling type filters

### Accident Characteristics
- ✅ **Lighting**: `lightStatus[]` - Lighting conditions during accident
- ✅ **Collision**: `collisionType[]` - Type of collision multi-select
- ✅ **Road Infrastructure**:
  - `roadSituation[]` - Road condition at time of accident
  - `roadRepairType[]` - Type of road repair if applicable
  - `shoulderStatus[]` - Road shoulder status

### Environmental & Reason-based Filters
- ✅ **Area Usage**: `areaUsages[]` - Land use type in accident area
- ✅ **Weather**: `airStatuses[]` - Weather conditions during accident
- ✅ **Road Defects**: `roadDefects[]` - Road infrastructure problems
- ✅ **Human Factors**: `humanReasons[]` - Human-related accident causes
- ✅ **Vehicle Factors**: `vehicleReasons[]` - Vehicle-related accident causes
- ✅ **Road Surface**: `roadSurfaceConditions[]` - Surface condition of the road

### Vehicle & Driver Information
- ✅ **Vehicle System**: `vehicleSystem[]` - Vehicle system type
- ✅ **Vehicle Fault**: `vehicleFaultStatus[]` - Vehicle fault status
- ✅ **Driver Demographics**:
  - `driverSex[]` - Driver gender with checkbox controls
  - `driverLicenceType[]` - Driver license type
  - `driverInjuryType[]` - Driver injury severity with checkbox controls

## Technical Improvements

### 1. Enhanced Interface Structure
Updated `RoadDefectsFilterState` interface to include all `mapAccidents` supported fields:
- Organized filters by category (Location, Accident Characteristics, Environmental, etc.)
- Added proper TypeScript types for all filter fields
- Maintained backward compatibility with existing chart components

### 2. Action Imports
Added imports for all necessary action functions:
```typescript
import { gets as getRoadsAction } from "@/app/actions/road/gets";
import { gets as getTrafficZonesAction } from "@/app/actions/traffic_zone/gets";
import { gets as getCityZonesAction } from "@/app/actions/city_zone/gets";
import { gets as getAccidentTypesAction } from "@/app/actions/type/gets";
import { gets as getPositionsAction } from "@/app/actions/position/gets";
import { gets as getRulingTypesAction } from "@/app/actions/ruling_type/gets";
import { gets as getRoadSituationsAction } from "@/app/actions/road_situation/gets";
import { gets as getRoadRepairTypesAction } from "@/app/actions/road_repair_type/gets";
import { gets as getShoulderStatusesAction } from "@/app/actions/shoulder_status/gets";
import { gets as getHumanReasonsAction } from "@/app/actions/human_reason/gets";
import { gets as getVehicleReasonsAction } from "@/app/actions/vehicle_reason/gets";
import { gets as getVehicleSystemsAction } from "@/app/actions/system/gets";
import { gets as getFaultStatusesAction } from "@/app/actions/fault_status/gets";
import { gets as getLicenceTypesAction } from "@/app/actions/licence_type/gets";
```

### 3. User Interface Enhancements
- **Organized Layout**: Filters are organized into logical sections (Basic Filters, Advanced Filters)
- **Smart Controls**:
  - Async multi-select components for data loaded from the server
  - Checkbox controls for binary/multi-option fields (driver gender, injury type)
  - Numeric inputs for count-based filters
  - Date pickers for temporal filters
- **Progressive Disclosure**: Advanced filters are collapsible to reduce cognitive load
- **Responsive Design**: All filters work properly on different screen sizes

### 4. Data Flow Integration
- **Complete Mapping**: All filter values are properly passed to the `mapAccidents` action
- **Default Values**: Sensible defaults (e.g., last year for date range when no dates provided)
- **Clean Data**: Filters out empty arrays and undefined values before sending to API
- **Polygon Support**: Maintains existing polygon search functionality with new filters

## Filter Categories in UI

### Basic Filters Section
- Date range (from/to)
- Geographic location (province, city, road, traffic zones, city zones)
- Accident type and position
- Ruling type
- Officer field
- Casualty counts (min/max for dead and injured)
- Serial numbers (seri, serial)
- Severity filters with damage sections

### Advanced Filters Section (Collapsible)
- Road and infrastructure conditions
- Environmental factors (weather, air status)
- Road defects and surface conditions
- Human and vehicle factors
- Vehicle system information
- Driver information (demographics, license, injury type)

## Compatibility & Backward Support

### Legacy Filter Support
The interface maintains compatibility with existing chart components by keeping legacy filter fields:
- `vehicleType[]`, `vehicleColor[]`, `vehicleInsuranceCo[]`
- `vehicleBodyInsuranceCo[]`, `vehicleLicenceType[]`
- `vehiclePlaqueType[]`, `vehiclePlaqueUsage[]`
- `vehicleMotionDirection[]`, `vehicleEquipmentDamage[]`
- Additional driver fields: `driverFaultStatus[]`, `driverAge[]`, `driverPosition[]`, `driverRulingType[]`

### AppliedFiltersDisplay Integration
Updated the `AppliedFiltersDisplay` component to handle renamed fields:
- Fixed `vehicleRoadRepairType` → `roadRepairType`
- Added support for all new filter fields
- Maintains visual consistency with existing filter display

## Usage Example

```typescript
// The component now supports all these filters seamlessly
const filters: RoadDefectsFilterState = {
  dateOfAccidentFrom: "1402-01-01",
  dateOfAccidentTo: "1402-12-29",
  province: ["تهران", "اصفهان"],
  city: ["تهران", "اصفهان"],
  road: ["آزادی", "انقلاب"],
  trafficZone: ["منطقه ۱"],
  accidentType: ["تصادف رانندگی"],
  lightStatus: ["روز"],
  collisionType: ["برخورد از جلو"],
  roadSituation: ["خشک"],
  areaUsages: ["مسکونی"],
  airStatuses: ["آفتابی"],
  roadDefects: ["چاله"],
  humanReasons: ["سرعت غیرمجاز"],
  vehicleReasons: ["نقص فنی"],
  vehicleSystem: ["ترمز"],
  driverSex: ["مرد"],
  driverLicenceType: ["رانندگی"],
  driverInjuryType: ["سالم"],
  deadCountMin: 0,
  injuredCountMin: 1,
  officer: "افسر محمدی"
};
```

## Benefits

1. **Complete Coverage**: All `mapAccidents` filters are now accessible through the UI
2. **Better User Experience**: Organized, intuitive interface with progressive disclosure
3. **Data Quality**: More precise filtering leads to more relevant accident data visualization
4. **Performance**: Efficient loading of filter options with async components
5. **Maintainability**: Clean, organized code structure that's easy to extend
6. **Compatibility**: Backward compatible with existing chart implementations

## Future Considerations

1. **Filter Presets**: Consider adding saved filter combinations for common use cases
2. **Smart Defaults**: Implement intelligent default suggestions based on user behavior
3. **Performance Optimization**: Consider implementing filter option caching for frequently accessed data
4. **Advanced Search**: Add text-based search within filter options for large datasets
5. **Filter Analytics**: Track which filters are most commonly used to optimize the UI layout
