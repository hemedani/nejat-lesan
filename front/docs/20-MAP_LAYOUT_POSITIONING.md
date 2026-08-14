# Map Layout Positioning

## Current Layout After Fix

```
┌─────────────────────────────────────────────────────────────┐
│  [+] [-]                                    [🔷] [🔲] [⭕] [🗑️]  │
│  Zoom Controls                              Drawing Controls │
│                                                             │
│                                                             │
│                     MAP AREA                                │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│  [راهنما]                                    [تعداد تصادفات]  │
│  • فوتی                                     ۱٬۰۰۰           │
│  • جرحی                                     زوم: 11 | نقاط   │
│  • خسارتی                                                   │
│  نمایش حرارتی                                              │
│  ابزار ترسیم:                                              │
│  • چندضلعی: کلیک برای نقاط                                │
│  • مستطیل: کشیدن از گوشه                                  │
│  • دایره: کلیک و کشیدن                                    │
│  • جدول جزئیات پس از ترسیم                                │
│  • حذف: انتخاب و Delete                                   │
└─────────────────────────────────────────────────────────────┘
```

## UI Elements Positioning

### Top-Left (Zoom Controls)
- **Position**: Default Leaflet position
- **z-index**: Default Leaflet z-index
- **Content**: Zoom in (+) and Zoom out (-) buttons

### Top-Right (Drawing Controls)
- **Position**: `position="topright"` in EditControl
- **z-index**: Default Leaflet draw z-index
- **Content**:
  - 🔷 Polygon tool
  - 🔲 Rectangle tool
  - ⭕ Circle tool
  - 🗑️ Delete tool

### Bottom-Left (Legend)
- **Position**: `absolute bottom-4 left-4`
- **z-index**: `z-[1000]`
- **Content**:
  - Accident type legend (فوتی, جرحی, خسارتی)
  - Display mode indicator (حرارتی/نقاط)
  - Drawing tool instructions

### Bottom-Right (Stats Overlay) - **MOVED**
- **Position**: `absolute bottom-4 right-4` (moved from top-right)
- **z-index**: `z-[1000]`
- **Content**:
  - Total accidents count
  - Current zoom level
  - Display mode

## Change Log

### Before Fix
```
┌─────────────────────────────────────────────────────────────┐
│  [+] [-]                    [تعداد تصادفات] [🔷] [🔲] [⭕] [🗑️]  │
│  Zoom Controls              ۱٬۰۰۰         Drawing Controls │
│                            زوم: 11 | نقاط                  │
│                            ❌ OVERLAP                       │
```

### After Fix
```
┌─────────────────────────────────────────────────────────────┐
│  [+] [-]                                    [🔷] [🔲] [⭕] [🗑️]  │
│  Zoom Controls                              Drawing Controls │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│  [راهنما]                                    [تعداد تصادفات]  │
│  Legend                                     Stats Overlay   │
│                                            ✅ NO OVERLAP    │
└─────────────────────────────────────────────────────────────┘
```

## Benefits of New Layout

1. **No Overlap**: Stats overlay no longer conflicts with drawing controls
2. **Better Balance**: UI elements are distributed across all four corners
3. **Improved UX**: Users can clearly see all controls without interference
4. **Consistent Spacing**: All overlays use consistent `4` spacing from edges
5. **Clear Hierarchy**: Each corner has a distinct purpose

## Technical Implementation

```typescript
// Legend (Bottom-Left)
<div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">

// Stats Overlay (Bottom-Right) - MOVED
<div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">

// Drawing Controls (Top-Right)
<EditControl position="topright" />

// Zoom Controls (Top-Left)
// Default Leaflet position
```

## Responsive Considerations

- All overlays use `absolute` positioning to maintain layout on different screen sizes
- Consistent padding (`p-3`) and spacing (`bottom-4`, `right-4`, etc.)
- Shadow and background styling for proper contrast
- Z-index coordination to prevent stacking issues

---

**Status**: ✅ Fixed - No more overlap between stats and drawing controls
**Date**: January 2025
**Version**: 1.1
