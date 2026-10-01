import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { applyCascades } from "../src/cascade.ts";
import type { AnswerTree, FieldNode, FormDefinition } from "../src/types.ts";
import { DEFAULT_SCHEMA_VERSION } from "../src/types.ts";

const f = (partial: Partial<FieldNode> & { key: string }): FieldNode => ({
	kind: "field",
	type: "text",
	label: partial.key,
	order: 0,
	...partial,
} as FieldNode);

/**
 * The QA form's plate switch: picking a plate type must discard the parts that
 * belong to the previous type, because `ملی` has 4 parts and `موتورسیکلت` has 2
 * and the shapes are incompatible.
 */
const plateDefinition: FormDefinition = {
	schemaVersion: DEFAULT_SCHEMA_VERSION,
	name: "پلاک",
	pages: [{
		key: "p",
		title: "پلاک",
		order: 1,
		sections: [{
			key: "s",
			title: "پلاک",
			order: 1,
			nodes: [
				f({
					key: "plateType",
					label: "نوع پلاک",
					options: {
						kind: "literal",
						items: [
							{ value: "ملی", label: "ملی" },
							{ value: "موتورسیکلت", label: "موتورسیکلت" },
						],
					},
					clearOnChange: ["plate"],
				}),
				f({ key: "plate", type: "plate", label: "پلاک" }),
				f({ key: "driverName", label: "نام راننده" }),
			],
		}],
	}],
};

Deno.test("applyCascades — clears dependents when the switch changes", () => {
	const before: AnswerTree = {
		plateType: "ملی",
		plate: { parts: ["12", "ب", "345", "67"] },
		driverName: "رضا",
	};
	const after = applyCascades(
		plateDefinition,
		before,
		"plateType",
		"موتورسیکلت",
	);
	assertEquals(after.plate, undefined);
	// Unrelated answers survive.
	assertEquals(after.driverName, "رضا");
	assertEquals(after.plateType, "موتورسیکلت");
});

Deno.test("applyCascades — does not clear dependents when the value is unchanged", () => {
	const before: AnswerTree = {
		plateType: "ملی",
		plate: { parts: ["12", "ب", "345", "67"] },
	};
	const after = applyCascades(plateDefinition, before, "plateType", "ملی");
	assertEquals(after.plate, { parts: ["12", "ب", "345", "67"] });
});

Deno.test("applyCascades — a field with no clearOnChange changes nothing", () => {
	const before: AnswerTree = { driverName: "رضا" };
	const after = applyCascades(plateDefinition, before, "driverName", "سارا");
	assertEquals(after.driverName, "سارا");
});

Deno.test("applyCascades — returns a new object rather than mutating", () => {
	const before: AnswerTree = { plateType: "ملی", plate: { parts: ["1"] } };
	const after = applyCascades(
		plateDefinition,
		before,
		"plateType",
		"موتورسیکلت",
	);
	assertEquals(before.plate, { parts: ["1"] });
	assert(after !== before);
});

Deno.test("applyCascades — clears a plain top-level key", () => {
	const definition: FormDefinition = {
		...plateDefinition,
		pages: [{
			key: "p",
			title: "p",
			order: 1,
			sections: [{
				key: "s",
				title: "s",
				order: 1,
				nodes: [
					f({ key: "kind", label: "kind", clearOnChange: ["cargo"] }),
					f({ key: "cargo", label: "cargo" }),
				],
			}],
		}],
	};
	const after = applyCascades(
		definition,
		{ kind: "a", cargo: "fuel" },
		"kind",
		"b",
	);
	assertEquals(after.cargo, undefined);
});

Deno.test("applyCascades — clears inside a repeatable row", () => {
	// Changing the plate type of vehicle 0 must not touch vehicle 1.
	const definition: FormDefinition = {
		...plateDefinition,
		pages: [{
			key: "p",
			title: "p",
			order: 1,
			sections: [{
				key: "s",
				title: "s",
				order: 1,
				nodes: [{
					kind: "repeatable",
					key: "vehicles",
					label: "وسایل",
					order: 1,
					children: [
						f({
							key: "plateType",
							label: "نوع پلاک",
							clearOnChange: ["plate"],
						}),
						f({ key: "plate", type: "plate", label: "پلاک" }),
					],
				}],
			}],
		}],
	};
	const before: AnswerTree = {
		vehicles: [
			{ plateType: "ملی", plate: { parts: ["12"] } },
			{ plateType: "ملی", plate: { parts: ["98"] } },
		],
	};
	const after = applyCascades(
		definition,
		before,
		"vehicles[0].plateType",
		"موتورسیکلت",
	);
	const rows = after.vehicles as Array<Record<string, unknown>>;
	assertEquals(rows[0].plate, undefined);
	assertEquals(rows[0].plateType, "موتورسیکلت");
	// The other vehicle is untouched.
	assertEquals(rows[1].plate, { parts: ["98"] });
});

Deno.test("applyCascades — cascades transitively", () => {
	// a → b → c: changing a must clear both b and c.
	const definition: FormDefinition = {
		...plateDefinition,
		pages: [{
			key: "p",
			title: "p",
			order: 1,
			sections: [{
				key: "s",
				title: "s",
				order: 1,
				nodes: [
					f({ key: "a", label: "a", clearOnChange: ["b"] }),
					f({ key: "b", label: "b", clearOnChange: ["c"] }),
					f({ key: "c", label: "c" }),
				],
			}],
		}],
	};
	const after = applyCascades(
		definition,
		{ a: "1", b: "2", c: "3" },
		"a",
		"9",
	);
	assertEquals(after.b, undefined);
	assertEquals(after.c, undefined);
});

Deno.test("applyCascades — a cycle terminates instead of hanging", () => {
	const definition: FormDefinition = {
		...plateDefinition,
		pages: [{
			key: "p",
			title: "p",
			order: 1,
			sections: [{
				key: "s",
				title: "s",
				order: 1,
				nodes: [
					f({ key: "a", label: "a", clearOnChange: ["b"] }),
					f({ key: "b", label: "b", clearOnChange: ["a"] }),
				],
			}],
		}],
	};
	const after = applyCascades(definition, { a: "1", b: "2" }, "a", "9");
	assertEquals(after.a, "9");
	assertEquals(after.b, undefined);
});

Deno.test("applyCascades — an unknown field changes nothing", () => {
	const before: AnswerTree = { plateType: "ملی", plate: { parts: ["1"] } };
	const after = applyCascades(plateDefinition, before, "nonexistent", "x");
	assertEquals(after.plate, { parts: ["1"] });
});
