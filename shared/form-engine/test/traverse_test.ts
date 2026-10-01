import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { walkNodes } from "../src/traverse.ts";
import type {
	AnswerTree,
	ContentNode,
	FieldType,
	FormDefinition,
	PageNode,
	RepeatableNode,
} from "../src/types.ts";
import { DEFAULT_SCHEMA_VERSION } from "../src/types.ts";

// A miniature definition exercising every container kind and nesting depth:
// page → section → (field | group | repeatable) with a nested repeatable.
const field = (
	key: string,
	type: FieldType = "text",
	extra: Partial<Extract<ContentNode, { kind: "field" }>> = {},
) => ({
	kind: "field",
	key,
	type,
	label: key,
	order: 0,
	...extra,
}) as ContentNode;

const definition: FormDefinition = {
	schemaVersion: DEFAULT_SCHEMA_VERSION,
	name: "نمونه",
	pages: [
		{
			key: "p1",
			title: "صفحه یک",
			order: 1,
			sections: [
				{
					key: "s1",
					title: "بخش یک",
					order: 1,
					nodes: [
						field("severity", "choice_group"),
						field("hidden1", "text", {
							visibleWhen: {
								op: "eq",
								path: "severity",
								value: "جرحی",
							},
						}),
						{
							kind: "group",
							key: "g1",
							order: 2,
							children: [field("inner", "text")],
						},
						{
							kind: "repeatable",
							key: "vehicles",
							label: "وسایل",
							order: 3,
							children: [
								field("type", "text"),
								{
									kind: "repeatable",
									key: "passengers",
									label: "سرنشینان",
									order: 1,
									children: [field("health", "text")],
								},
							],
						} as RepeatableNode,
					],
				},
			],
		},
		{
			key: "p2",
			title: "صفحه دو",
			order: 2,
			sections: [],
		},
	],
};

const answers: AnswerTree = {
	severity: "جرحی",
	vehicles: [
		{
			type: "سواری",
			passengers: [{ health: "سالم" }, { health: "مصدوم" }],
		},
		{ type: "کامیون", passengers: [] },
	],
};

Deno.test("walkNodes — visits every node instance, repeating per row", () => {
	const seen: string[] = [];
	walkNodes(definition, answers, (node) => {
		seen.push(node.key);
	});
	// Node instances repeat once per repeatable row: two vehicles means two
	// `type` visits, and the two passengers on vehicle 0 mean two `health` visits.
	assertEquals(seen, [
		"severity",
		"hidden1",
		"g1",
		"inner",
		"vehicles",
		"type",
		"passengers",
		"health",
		"health",
		"type",
		"passengers",
	]);
});

Deno.test("walkNodes — reports depth", () => {
	const depths: Record<string, number> = {};
	walkNodes(definition, answers, (node, meta) => {
		depths[node.key] = meta.depth;
	});
	assertEquals(depths.severity, 0);
	assertEquals(depths.vehicles, 0);
	assertEquals(depths.type, 1);
	assertEquals(depths.passengers, 1);
	assertEquals(depths.health, 2);
});

Deno.test("walkNodes — reports the dot path of each node", () => {
	const paths: Record<string, string> = {};
	walkNodes(definition, answers, (node, meta) => {
		paths[node.key] = meta.path;
	});
	assertEquals(paths.severity, "severity");
	assertEquals(paths.vehicles, "vehicles");
	assertEquals(paths.type, "vehicles[].type");
	assertEquals(paths.passengers, "vehicles[].passengers");
	assertEquals(paths.health, "vehicles[].passengers[].health");
});

Deno.test("walkNodes — repeats nested nodes once per parent row", () => {
	const rows: string[] = [];
	walkNodes(
		definition,
		answers,
		(node, meta) => {
			if (node.key === "health") rows.push(meta.instancePath);
		},
	);
	// Two passengers on vehicle 0; vehicle 1 has none.
	assertEquals(rows, [
		"vehicles[0].passengers[0].health",
		"vehicles[0].passengers[1].health",
	]);
});

Deno.test("walkNodes — evaluates rules inside the row scope", () => {
	// `type` must resolve against the current vehicle row, not all of them.
	// `scopeValue` is the enclosing row object, so read `type` off it directly.
	const scoped: unknown[] = [];
	walkNodes(definition, answers, (node, meta) => {
		if (node.key === "type") {
			scoped.push((meta.scopeValue as Record<string, unknown>).type);
		}
	});
	assertEquals(scoped, ["سواری", "کامیون"]);
});

Deno.test("walkNodes — a nested repeatable's scopeValue is the inner row", () => {
	const rows: unknown[] = [];
	walkNodes(definition, answers, (node, meta) => {
		if (node.key === "health") rows.push(meta.scopeValue);
	});
	assertEquals(rows, [{ health: "سالم" }, { health: "مصدوم" }]);
});

Deno.test("walkNodes — top-level fields have no scope", () => {
	let scope: unknown = "unset";
	walkNodes(definition, answers, (node, meta) => {
		if (node.key === "severity") scope = meta.scope;
	});
	assertEquals(scope, []);
});

Deno.test("walkNodes — provides row index for repeatables", () => {
	const indexes: number[] = [];
	walkNodes(definition, answers, (node, meta) => {
		if (node.key === "type") indexes.push(meta.rowIndex ?? -1);
	});
	assertEquals(indexes, [0, 1]);
});

Deno.test("walkNodes — visits nodes inside an invisible group", () => {
	// Visibility of a child is the renderer's concern; the walker still yields it
	// so the caller can decide (the builder needs hidden nodes to edit them).
	let seen = 0;
	walkNodes(definition, answers, (node) => {
		if (node.key === "hidden1") seen++;
	});
	assertEquals(seen, 1);
});

Deno.test("walkNodes — stops when the callback returns false", () => {
	const seen: string[] = [];
	walkNodes(definition, answers, (node) => {
		seen.push(node.key);
		return node.key !== "severity";
	});
	assertEquals(seen, ["severity"]);
});

Deno.test("walkNodes — skips repeatables beyond maxItems", () => {
	const limited: FormDefinition = {
		...definition,
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
					key: "rows",
					label: "ردیف‌ها",
					order: 1,
					minItems: 1,
					maxItems: 1,
					children: [field("v", "text")],
				}],
			}],
		} as PageNode],
	};
	const rows: string[] = [];
	walkNodes(
		limited,
		{ rows: [{ v: "a" }, { v: "b" }, { v: "c" }] },
		(node, meta) => {
			if (node.key === "v") {
				rows.push((meta.scopeValue as Record<string, string>).v);
			}
		},
	);
	assertEquals(rows, ["a"]);
});

Deno.test("walkNodes — a missing repeatable key yields no child visits", () => {
	const seen: string[] = [];
	walkNodes(definition, { severity: "جرحی" }, (node) => {
		seen.push(node.key);
	});
	assertEquals(seen.includes("type"), false);
	assertEquals(seen.includes("passengers"), false);
});

Deno.test("walkNodes — handles an empty definition", () => {
	const seen: string[] = [];
	walkNodes({ schemaVersion: 1, name: "خالی", pages: [] }, {}, (node) => {
		seen.push(node.key);
	});
	assertEquals(seen, []);
});
