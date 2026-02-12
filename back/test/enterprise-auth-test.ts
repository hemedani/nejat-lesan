/**
 * Test file to verify enterprise user authorization and default filter functionality
 */

import {
	assertEquals,
	assertThrows,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { checkEnterpriseChartAccess } from "../utils/authorization.ts";

// Mock context for testing
const createMockContext = (level: string, settings?: any) => ({
	user: {
		level,
		settings: settings || {},
	},
});

Deno.test("Enterprise user with allowed chart access", async () => {
	const context = createMockContext("Enterprise", {
		provinces: [{ name: "Tehran" }, { name: "Isfahan" }],
		cities: [{ name: "Tehran City" }],
		availableCharts: ["roadDefectsAnalytics"],
	});

	const result = await checkEnterpriseChartAccess(
		context,
		"roadDefectsAnalytics",
	);

	assertEquals(result.hasAccess, true);
	assertEquals(result.defaultFilters?.province, ["Tehran", "Isfahan"]);
	assertEquals(result.defaultFilters?.city, ["Tehran City"]);
});

Deno.test("Enterprise user without allowed chart access", async () => {
	const context = createMockContext("Enterprise", {
		provinces: [{ name: "Tehran" }],
		cities: [{ name: "Tehran City" }],
		availableCharts: ["otherChart"],
	});

	const result = await checkEnterpriseChartAccess(
		context,
		"roadDefectsAnalytics",
	);

	assertEquals(result.hasAccess, false);
});

Deno.test("Manager user access", async () => {
	const context = createMockContext("Manager");

	const result = await checkEnterpriseChartAccess(
		context,
		"roadDefectsAnalytics",
	);

	assertEquals(result.hasAccess, true);
	assertEquals(result.defaultFilters, undefined);
});

Deno.test("Enterprise user with no settings", async () => {
	const context = createMockContext("Enterprise");

	const result = await checkEnterpriseChartAccess(
		context,
		"roadDefectsAnalytics",
	);

	assertEquals(result.hasAccess, true);
	assertEquals(result.defaultFilters, undefined);
});

console.log(
	"All tests defined. Run with: deno test test/enterprise-auth-test.ts",
);
