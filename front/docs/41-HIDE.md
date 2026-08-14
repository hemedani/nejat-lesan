# Temporarily Hidden Pages

The following chart pages are **temporarily hidden** for presentations until their data is fixed:

| Page | Route |
|------|-------|
| Company Performance Analytics | `/charts/overall/company-performance-analytics` |
| Single Vehicle Analytics | `/charts/spatial/single-vehicle-analytics` |
| Safety Index | `/charts/spatial/safety-index` |

## How to Hide a Page

1. Open `src/components/navigation/ChartNavigation.tsx`
2. Find the chart entry in the relevant section (`overall` or `spatial` case in `getChartNavigation`)
3. Comment out the entire navigation item object
4. Also comment out its mapping in `navigationIdToPermissionKey`

## How to Unhide a Page

Uncomment the corresponding blocks in `src/components/navigation/ChartNavigation.tsx`:

**Permission mapping** — around lines 33, 50-51:
```ts
// "company-performance-analytics": "companyPerformanceAnalytics", // Temporarily hidden
```

**Navigation entry (overall)** — around lines 155-159:
```ts
// {
//   id: "company-performance-analytics",
//   label: "مقایسه عملکرد کمپانیهای سازنده خودرو",
//   href: "/charts/overall/company-performance-analytics",
// }, // Temporarily hidden
```

**Navigation entry (spatial)** — around lines 228-237:
```ts
// {
//   id: "single-vehicle-analytics",
//   label: "تصادفات تک وسیله ای",
//   href: "/charts/spatial/single-vehicle-analytics",
// }, // Temporarily hidden
// {
//   id: "safety-index",
//   label: "شاخص ناحیه‌ای ایمنی",
//   href: "/charts/spatial/safety-index",
// }, // Temporarily hidden
```

## Note

The page files themselves still exist and are accessible via direct URL. To fully block access, you would also need to add server-side redirect checks in the page components or middleware.
