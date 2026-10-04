import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import {
	DEFAULT_FORM_ICON,
	FORM_ICON_GROUP_KEYS,
	FORM_ICON_GROUP_LABELS,
	FORM_ICON_GROUPS,
	FORM_ICON_NAMES,
	isFormIconName,
	phosphorComponentName,
	validateIconNames,
} from "../src/icons.ts";

Deno.test("icons — every name is a unique non-empty string", () => {
	const seen = new Set<string>();
	for (const name of FORM_ICON_NAMES) {
		// Phosphor's React exports are PascalCase identifiers; a name that is not
		// kebab-or-camel would break the derived component name in both apps.
		if (!/^[a-z][a-zA-Z]*$/.test(name)) {
			throw new Error(`icon name is not camelCase: ${name}`);
		}
		if (seen.has(name)) throw new Error(`duplicate icon name: ${name}`);
		seen.add(name);
	}
	assertEquals(seen.size, FORM_ICON_NAMES.length);
});

Deno.test("icons — every grouped icon is declared in FORM_ICON_NAMES", () => {
	// The picker is the only way an author picks an icon, so an undeclared name in a
	// group would render as nothing on one platform only.
	for (const group of FORM_ICON_GROUPS) {
		for (const icon of group.icons) {
			if (!isFormIconName(icon)) {
				throw new Error(`group ${group.key} lists undeclared icon: ${icon}`);
			}
		}
	}
});

Deno.test("icons — every declared icon appears in exactly one group", () => {
	const grouped = new Set<string>();
	for (const group of FORM_ICON_GROUPS) {
		for (const icon of group.icons) {
			if (grouped.has(icon)) {
				throw new Error(`icon appears in two groups: ${icon}`);
			}
			grouped.add(icon);
		}
	}
	const missing = FORM_ICON_NAMES.filter((name) => !grouped.has(name));
	assertEquals(missing, [], "icons missing from the picker");
});

Deno.test("icons — group keys and labels line up", () => {
	assertEquals(
		FORM_ICON_GROUPS.map((group) => group.key),
		[...FORM_ICON_GROUP_KEYS],
	);
	for (const group of FORM_ICON_GROUPS) {
		assertEquals(group.label, FORM_ICON_GROUP_LABELS[group.key]);
	}
});

Deno.test("icons — isFormIconName only accepts declared names", () => {
	assertEquals(isFormIconName("car"), true);
	assertEquals(isFormIconName("trafficSign"), true);
	assertEquals(isFormIconName("traffic-sign"), false);
	assertEquals(isFormIconName("Car"), false);
	assertEquals(isFormIconName(""), false);
	assertEquals(isFormIconName(undefined), false);
	assertEquals(isFormIconName(42), false);
});

Deno.test("icons — phosphorComponentName derives the PascalCase export", () => {
	// Web appends `Icon`, native uses this directly; both come from here.
	assertEquals(phosphorComponentName("car"), "Car");
	assertEquals(phosphorComponentName("trafficSign"), "TrafficSign");
	assertEquals(phosphorComponentName("cloudLightning"), "CloudLightning");
	assertEquals(`${phosphorComponentName("warningOctagon")}Icon`, "WarningOctagonIcon");
});

Deno.test("icons — validateIconNames reports every offender, ignoring empty slots", () => {
	assertEquals(validateIconNames(["car", null, undefined, "", "cloudRain"]), []);
	assertEquals(
		validateIconNames(["car", "nope", "cloud", "traffic-sign"]),
		["nope", "traffic-sign"],
		"all bad names are reported so one pass fixes the whole definition",
	);
});

Deno.test("icons — the default icon is itself declared", () => {
	assertEquals(isFormIconName(DEFAULT_FORM_ICON), true);
});
