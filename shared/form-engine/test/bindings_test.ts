import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { buildBindings } from "../src/bindings.ts";
import type { AnswerTree, FieldNode, FormDefinition } from "../src/types.ts";
import { DEFAULT_SCHEMA_VERSION } from "../src/types.ts";

const f = (partial: Partial<FieldNode> & { key: string }): FieldNode => ({
	kind: "field",
	type: "text",
	label: partial.key,
	order: 0,
	...partial,
} as FieldNode);

const def = (nodes: FieldNode[]): FormDefinition => ({
	schemaVersion: DEFAULT_SCHEMA_VERSION,
	name: "x",
	pages: [{
		key: "p",
		title: "p",
		order: 1,
		sections: [{ key: "s", title: "s", order: 1, nodes }],
	}],
});

// ---------------------------------------------------------------------------
// relation
// ---------------------------------------------------------------------------

Deno.test("buildBindings — single relation", () => {
	const out = buildBindings(
		def([
			f({
				key: "collisionTypeId",
				options: { kind: "reference", model: "collision_type" },
				binding: { kind: "relation", path: "collision_type" },
			}),
		]),
		{ collisionTypeId: "abc" },
	);
	assertEquals(out, { collisionTypeId: "abc" });
});

Deno.test("buildBindings — multi relation becomes a pluralised key", () => {
	// Mirrors `mobile/src/domain/process-form.ts:relationSetKey`: road_defects +
	// multi → roadDefectsIds.
	const out = buildBindings(
		def([
			f({
				key: "roadDefects",
				type: "multi_select",
				options: { kind: "reference", model: "road_defect" },
				binding: {
					kind: "relation",
					path: "road_defects",
					multi: true,
				},
			}),
		]),
		{ roadDefects: ["a", "b"] },
	);
	assertEquals(out, { roadDefectsIds: ["a", "b"] });
});

Deno.test("buildBindings — single relation key does not gain the plural suffix", () => {
	const out = buildBindings(
		def([
			f({
				key: "collisionTypeId",
				options: { kind: "reference", model: "collision_type" },
				binding: { kind: "relation", path: "collision_type" },
			}),
		]),
		{ collisionTypeId: "abc" },
	);
	assertEquals(Object.keys(out), ["collisionTypeId"]);
});

// ---------------------------------------------------------------------------
// pure
// ---------------------------------------------------------------------------

Deno.test("buildBindings — pure projection", () => {
	const out = buildBindings(
		def([
			f({
				key: "dateOfAccident",
				binding: { kind: "pure", path: "date_of_accident" },
			}),
		]),
		{ dateOfAccident: "2026-10-01" },
	);
	assertEquals(out, { date_of_accident: "2026-10-01" });
});

// ---------------------------------------------------------------------------
// dto
// ---------------------------------------------------------------------------

Deno.test("buildBindings — a repeatable's field projects into the DTO array", () => {
	// Each vehicle row contributes `vehicle_type` to `vehicle_dtos[i]`.
	const definition: FormDefinition = {
		...def([]),
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
							key: "type",
							options: {
								kind: "reference",
								model: "vehicle_type",
							},
							binding: {
								kind: "dto",
								dto: "vehicle_dtos",
								field: "vehicle_type",
								from: "type",
							},
						}),
					],
				}],
			}],
		}],
	};
	const out = buildBindings(definition, {
		vehicles: [{ type: "v1" }, { type: "v2" }],
	});
	assertEquals(out, {
		vehicle_dtos: [{ vehicle_type: "v1" }, { vehicle_type: "v2" }],
	});
});

Deno.test("buildBindings — a missing row yields no DTO entry", () => {
	const definition: FormDefinition = {
		...def([]),
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
					label: "v",
					order: 1,
					children: [
						f({
							key: "type",
							binding: {
								kind: "dto",
								dto: "vehicle_dtos",
								field: "vehicle_type",
								from: "type",
							},
						}),
					],
				}],
			}],
		}],
	};
	// An empty group produces no `vehicle_dtos` key at all, so a non-accident
	// report never sends accident-only fields (mobile/AGENTS.md:66).
	const out = buildBindings(definition, { vehicles: [] });
	assertEquals(out, {});
});

// ---------------------------------------------------------------------------
// dynamic / unbound
// ---------------------------------------------------------------------------

Deno.test("buildBindings — a dynamic field contributes only to flat answers", () => {
	const out = buildBindings(
		def([f({ key: "notes", binding: { kind: "dynamic" } })]),
		{ notes: "متن" },
	);
	assertEquals(out, {});
});

Deno.test("buildBindings — an unbound field is skipped", () => {
	const out = buildBindings(def([f({ key: "notes" })]), { notes: "متن" });
	assertEquals(out, {});
});

Deno.test("buildBindings — an empty answer is not projected", () => {
	// A required-but-unanswered field must not blank out a typed relation that
	// an earlier attempt already set.
	const out = buildBindings(
		def([
			f({
				key: "collisionTypeId",
				options: { kind: "reference", model: "collision_type" },
				binding: { kind: "relation", path: "collision_type" },
			}),
		]),
		{ collisionTypeId: "" },
	);
	assertEquals(out, {});
});

Deno.test("buildBindings — two fields binding to one relation conflict visibly", () => {
	// Last writer wins, but the definition validator rejects this upstream; here
	// we simply document that the final value is deterministic, not merged.
	const out = buildBindings(
		def([
			f({
				key: "a",
				binding: { kind: "pure", path: "serial" },
			}),
			f({
				key: "b",
				binding: { kind: "pure", path: "serial" },
			}),
		]),
		{ a: "1", b: "2" },
	);
	assertEquals(out, { serial: "2" });
});

Deno.test("buildBindings — an empty definition projects nothing", () => {
	assertEquals(buildBindings(def([]), { a: "1" }), {});
});
