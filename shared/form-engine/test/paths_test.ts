import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { countPath, resolvePath, resolveScoped } from "../src/paths.ts";
import type { AnswerTree, AnswerValue } from "../src/types.ts";

// A tree shaped like the QA accident form.
const tree: AnswerTree = {
	severity: "خسارتی",
	traffic: "انسداد کامل",
	emergency: ["حریق یا دود شدید", "مصدوم"],
	vehicles: [
		{
			type: "سواری",
			mobility: "قابل حرکت",
			driver: { health: "سالم", presence: "در صحنه حضور دارد" },
			passengers: [{ health: "مصدوم" }, { health: "سالم" }],
		},
		{
			type: "کامیون",
			mobility: "نیاز به جرثقیل",
			driver: { health: "فوتی در صحنه", presence: "در صحنه فوت شده" },
			passengers: [],
		},
	],
	pedestrians: [{ health: "سالم" }],
	damages: [],
};

Deno.test("resolvePath — plain key", () => {
	assertEquals(resolvePath(tree, "severity"), ["خسارتی"]);
	assertEquals(resolvePath(tree, "traffic"), ["انسداد کامل"]);
});

Deno.test("resolvePath — missing key yields no matches", () => {
	assertEquals(resolvePath(tree, "nope"), []);
});

Deno.test("resolvePath — array field keeps the array whole", () => {
	assertEquals(resolvePath(tree, "emergency"), [
		["حریق یا دود شدید", "مصدوم"],
	]);
});

Deno.test("resolvePath — [key] iterates one level", () => {
	assertEquals(resolvePath(tree, "vehicles[].type"), ["سواری", "کامیون"]);
});

Deno.test("resolvePath — [key] through a nested object", () => {
	assertEquals(resolvePath(tree, "vehicles[].driver.health"), [
		"سالم",
		"فوتی در صحنه",
	]);
});

Deno.test("resolvePath — [] iterates recursively", () => {
	// passengers across both vehicles, flattened into one list
	assertEquals(resolvePath(tree, "vehicles[].passengers[].health"), [
		"مصدوم",
		"سالم",
	]);
});

Deno.test("resolvePath — empty repeatable yields no matches", () => {
	assertEquals(resolvePath(tree, "damages[].type"), []);
});

Deno.test("resolvePath — empty nested repeatable yields no matches", () => {
	// vehicle 2 has no passengers
	assertEquals(resolvePath(tree, "vehicles[].passengers[].health"), [
		"مصدوم",
		"سالم",
	]);
});

Deno.test("resolvePath — explicit index selects one row", () => {
	assertEquals(resolvePath(tree, "vehicles[0].type"), ["سواری"]);
	assertEquals(resolvePath(tree, "vehicles[1].driver.health"), ["فوتی در صحنه"]);
});

Deno.test("resolvePath — two explicit indices", () => {
	assertEquals(resolvePath(tree, "vehicles[0].passengers[0].health"), [
		"مصدوم",
	]);
});

Deno.test("resolvePath — index out of range yields no matches", () => {
	assertEquals(resolvePath(tree, "vehicles[9].type"), []);
});

Deno.test("resolvePath — iterating a non-array yields no matches", () => {
	assertEquals(resolvePath(tree, "severity[].x"), []);
});

Deno.test("resolvePath — key lookup on a scalar yields no matches", () => {
	assertEquals(resolvePath(tree, "severity.length"), []);
});

Deno.test("countPath — counts array length at a key", () => {
	assertEquals(countPath(tree, "vehicles"), 2);
	// A multi-select value is itself an array, so counting counts its choices.
	assertEquals(countPath(tree, "emergency"), 2);
});

Deno.test("countPath — counts across iterated parents", () => {
	assertEquals(countPath(tree, "vehicles[].passengers[]"), 2);
	assertEquals(countPath(tree, "damages[]"), 0);
});

Deno.test("countPath — counts across explicitly indexed parents", () => {
	assertEquals(countPath(tree, "vehicles[0].passengers[]"), 2);
	assertEquals(countPath(tree, "vehicles[1].passengers[]"), 0);
});

const rowAt = (i: number): AnswerValue =>
	(tree.vehicles as AnswerValue[])[i];

Deno.test("resolveScoped — resolves relative to a repeatable row", () => {
	// Inside vehicle row 1, a bare `type` must not leak other rows' values.
	assertEquals(resolveScoped(tree, "type", [rowAt(1)]), ["کامیون"]);
	assertEquals(resolveScoped(tree, "driver.health", [rowAt(1)]), [
		"فوتی در صحنه",
	]);
});

Deno.test("resolveScoped — absolute paths still work inside a scope", () => {
	// A rule referencing `severity` must see the top-level answer.
	assertEquals(resolveScoped(tree, "severity", [rowAt(0)]), ["خسارتی"]);
});

Deno.test("resolveScoped — a row-local key shadows the tree for that path", () => {
	// Inside a damage row, `vehicleId` must read the row's own value even though
	// `vehicleId` also exists on every vehicle row deeper in the tree.
	const damage: AnswerValue = { type: "گاردریل", vehicleId: "v1" };
	const otherDamage: AnswerValue = { type: "تابلو علامت", vehicleId: "v2" };
	assertEquals(
		resolveScoped(tree, "vehicleId", [otherDamage, damage]),
		["v1"],
	);
});

Deno.test("resolveScoped — unrelated top-level paths are not shadowed", () => {
	// The scope has no `damages` key, so resolution falls through to the tree,
	// which holds an empty damages group.
	const damage: AnswerValue = { type: "گاردریل" };
	assertEquals(resolveScoped(tree, "damages[].type", [damage]), []);
});