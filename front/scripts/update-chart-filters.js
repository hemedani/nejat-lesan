#!/usr/bin/env node

/**
 * Migration script to update all chart pages with enabledFilters prop
 * This script helps automate the process of adding the enabledFilters prop
 * to all ChartsFilterSidebar components across the project.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Chart type mappings based on file paths and names
const CHART_TYPE_MAPPINGS = {
  // Overall charts
  'accident-severity': 'ACCIDENT_SEVERITY_ANALYTICS',
  'area-usage-analytics': 'AREA_USAGE_ANALYTICS',
  'collision-analytics': 'COLLISION_ANALYTICS',
  'company-performance-analytics': 'COMPANY_PERFORMANCE_ANALYTICS',
  'hourly-day-of-week': 'HOURLY_DAY_ANALYTICS',
  'human-reason-analytics': 'HUMAN_REASON_ANALYTICS',
  'monthly-holiday': 'MONTHLY_HOLIDAY_ANALYTICS',
  'road-defects': 'ROAD_DEFECTS_ANALYTICS',
  'total-reason-analytics': 'TOTAL_REASON_ANALYTICS',
  'vehicle-reason-analytics': 'VEHICLE_REASON_ANALYTICS',

  // Spatial charts
  'hotspots': 'HOTSPOTS_ANALYTICS',
  'light-analytics': 'SPATIAL_LIGHT_ANALYTICS',
  'regional': 'REGIONAL_ANALYTICS',
  'safety-index': 'SAFETY_INDEX_ANALYTICS',
  'spatial/collision-analytics': 'COLLISION_ANALYTICS',

  // Default fallback
  'default': 'ALL'
};

/**
 * Determine chart type based on file path
 */
function getChartTypeFromPath(filePath) {
  const pathParts = filePath.split('/');

  // Check for specific chart names in path
  for (const [key, value] of Object.entries(CHART_TYPE_MAPPINGS)) {
    if (filePath.includes(key)) {
      return value;
    }
  }

  // Default to ALL filters for unmatched paths
  return 'ALL';
}

/**
 * Check if file already has enabledFilters prop
 */
function hasEnabledFiltersProp(content) {
  return content.includes('enabledFilters=') || content.includes('enabledFilters:');
}

/**
 * Check if file imports the chartFilters utility
 */
function hasChartFiltersImport(content) {
  return content.includes('from "@/utils/chartFilters"');
}

/**
 * Add import for chartFilters utility
 */
function addChartFiltersImport(content) {
  // Find the existing ChartsFilterSidebar import
  const importRegex = /import ChartsFilterSidebar,?\s*\{[^}]*\}\s*from\s*["']@\/components\/dashboards\/ChartsFilterSidebar["'];?/;
  const match = content.match(importRegex);

  if (match) {
    const importStatement = match[0];
    const newImport = importStatement + '\nimport { getEnabledFiltersForChart } from "@/utils/chartFilters";';
    return content.replace(importStatement, newImport);
  }

  return content;
}

/**
 * Add enabled filters constant
 */
function addEnabledFiltersConstant(content, chartType) {
  // Find a good place to insert the constant (after imports, before component)
  const componentRegex = /const\s+\w+.*?=\s*\(\s*\)\s*=>/;
  const match = content.match(componentRegex);

  if (match) {
    const constantDeclaration = `\n// Get enabled filters for ${chartType.toLowerCase().replace(/_/g, ' ')}\nconst ENABLED_FILTERS = getEnabledFiltersForChart("${chartType}");\n`;
    return content.replace(match[0], constantDeclaration + '\n' + match[0]);
  }

  return content;
}

/**
 * Add enabledFilters prop to ChartsFilterSidebar
 */
function addEnabledFiltersProp(content) {
  // Find ChartsFilterSidebar components without enabledFilters prop
  const sidebarRegex = /<ChartsFilterSidebar[\s\S]*?(?:\/?>|<\/ChartsFilterSidebar>)/g;

  return content.replace(sidebarRegex, (match) => {
    // Skip if already has enabledFilters prop
    if (match.includes('enabledFilters=')) {
      return match;
    }

    // Add enabledFilters prop before the closing
    if (match.endsWith('/>')) {
      return match.replace('/>', '\n              enabledFilters={ENABLED_FILTERS}\n            />');
    } else if (match.endsWith('>')) {
      return match.replace('>', '\n              enabledFilters={ENABLED_FILTERS}\n            >');
    }

    return match;
  });
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has enabledFilters prop
    if (hasEnabledFiltersProp(content)) {
      console.log(`✓ Skipped ${filePath} (already has enabledFilters)`);
      return;
    }

    // Skip if doesn't contain ChartsFilterSidebar
    if (!content.includes('ChartsFilterSidebar')) {
      return;
    }

    console.log(`📝 Processing ${filePath}`);

    let updatedContent = content;
    const chartType = getChartTypeFromPath(filePath);

    // Add import if missing
    if (!hasChartFiltersImport(updatedContent)) {
      updatedContent = addChartFiltersImport(updatedContent);
    }

    // Add enabled filters constant
    updatedContent = addEnabledFiltersConstant(updatedContent, chartType);

    // Add enabledFilters prop
    updatedContent = addEnabledFiltersProp(updatedContent);

    // Write the file if changes were made
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated ${filePath} with chart type: ${chartType}`);
    } else {
      console.log(`⚠️  No changes needed for ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Starting chart filters migration...\n');

  // Find all TypeScript/TSX files in the charts directory
  const chartFiles = glob.sync('src/app/charts/**/*.tsx', {
    cwd: process.cwd(),
    absolute: true
  });

  console.log(`Found ${chartFiles.length} chart files to process\n`);

  // Process each file
  chartFiles.forEach(processFile);

  console.log('\n🎉 Migration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the changes in each file');
  console.log('2. Run TypeScript compilation to check for errors');
  console.log('3. Test the filter functionality on each page');
  console.log('4. Adjust chart types in CHART_TYPE_MAPPINGS if needed');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  processFile,
  getChartTypeFromPath,
  CHART_TYPE_MAPPINGS
};
