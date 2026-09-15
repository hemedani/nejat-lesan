/**
 * Charts / analytics legacy-compatibility regression tests.
 *
 * THE BUG THIS GUARDS AGAINST
 * ---------------------------
 * `accident.incident_type` is the discriminator of the polymorphic incident
 * report model and was introduced *after* the historic accident corpus already
 * existed. Every legacy accident therefore has NO `incident_type` field, and the
 * model contract states plainly that such docs are accidents
 * (see `models/accident.ts`).
 *
 * When the 25 chart modules were updated to "exclude non-accident reports", they
 * used a plain equality match (`incident_type: "accident"`). That silently
 * excluded the entire legacy corpus, so every chart returned 0 / [] while still
 * answering HTTP 200 — a silent, total analytics outage.
 *
 * The fix routes every chart through `accidentOnlyFilter`
 * (`src/accident/charts/accidentScope.ts`), which expresses the contract as
 * `{ incident_type: { $in: ["accident", null] } }` — `null` inside `$in`
 * matching both an explicit null AND a missing field.
 *
 * Runs against an isolated MongoDB database so dev data is never touched.
 *
 * Run: deno test -A test/charts-legacy-compat-test.ts
 */

import "./charts_test_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { accident } from "../mod.ts";
import { incidentTypeFilter } from "@lib";
import { accidentOnlyFilter } from "../src/accident/charts/accidentScope.ts";
import { roadDefectsAnalyticsFn } from "../src/accident/charts/roadDefectsAnalytics/roadDefectsAnalytics.fn.ts";
import { getsFn } from "../src/accident/gets/gets.fn.ts";

// ---------------------------------------------------------------------------
// Fixtures — inserted straight through the model so we control the raw shape.
// The `add` act would set `incident_type` explicitly; the whole point here is a
// document that genuinely lacks the field, like the pre-existing corpus.
// ---------------------------------------------------------------------------

const insertLegacyAccident = async (tag: string) => {
	const doc = await accident.insertOne({
		doc: { seri: tag } as never,
		projection: { _id: 1, seri: 1, incident_type: 1 },
	});
	assertExists(doc, "failed to insert legacy accident fixture");
	return doc;
};

const insertNonAccident = async (tag: string) => {
	const doc = await accident.insertOne({
		doc: {
			seri: tag,
			incident_type: "road_breakdown",
			incident_payload: { description: tag },
		} as never,
		projection: { _id: 1, seri: 1, incident_type: 1 },
	});
	assertExists(doc, "failed to insert non-accident fixture");
	return doc;
};

// ---------------------------------------------------------------------------
// 1. The shared filter expresses the documented contract
// ---------------------------------------------------------------------------

Deno.test("accidentOnlyFilter keeps legacy docs (no incident_type) and drops non-accident reports", async () => {
	const tag = `charts-legacy-${Date.now()}`;

	const legacy = await insertLegacyAccident(`${tag}-legacy`);
	const breakdown = await insertNonAccident(`${tag}-breakdown`);

	// A legacy doc really is missing the field — not stored as null.
	const raw = await accident.findOne({
		filters: { _id: legacy._id },
		projection: { incident_type: 1 },
	});
	assertEquals(
		"incident_type" in (raw as Record<string, unknown>),
		false,
		"fixture must not carry an incident_type field",
	);

	// The shared filter counts the legacy accident...
	assertEquals(
		await accident.countDocument({
			filter: { ...accidentOnlyFilter, seri: `${tag}-legacy` },
		}),
		1,
		"legacy accident must be treated as an accident",
	);

	// ...and still excludes the non-accident report.
	assertEquals(
		await accident.countDocument({
			filter: { ...accidentOnlyFilter, seri: `${tag}-breakdown` },
		}),
		0,
		"non-accident reports must stay out of accident analytics",
	);

	// Document WHY the constant exists: the naive equality match loses legacy data.
	assertEquals(
		await accident.countDocument({
			filter: { incident_type: "accident", seri: `${tag}-legacy` },
		}),
		0,
		"a plain equality match is expected to miss legacy docs — that was the bug",
	);

	await accident.deleteOne({ filter: { _id: legacy._id } });
	await accident.deleteOne({ filter: { _id: breakdown._id } });
});

// ---------------------------------------------------------------------------
// 2. An actual chart act reflects legacy accidents
// ---------------------------------------------------------------------------

Deno.test("roadDefectsAnalytics counts a legacy accident and ignores non-accident reports", async () => {
	const runChart = async () =>
		await roadDefectsAnalyticsFn({
			service: "main",
			model: "accident",
			act: "roadDefectsAnalytics",
			details: { set: {}, get: {} },
		} as never) as { defectDistribution: { withoutDefect: number } };

	// `seri` is a raw pure field we can filter on to isolate our fixtures.
	const before = (await runChart()).defectDistribution.withoutDefect;

	const legacy = await insertLegacyAccident(
		`charts-act-legacy-${Date.now()}`,
	);
	const after = (await runChart()).defectDistribution.withoutDefect;

	assertEquals(
		after,
		before + 1,
		"a legacy accident must appear in chart totals",
	);

	const breakdown = await insertNonAccident(
		`charts-act-breakdown-${Date.now()}`,
	);
	const afterNonAccident =
		(await runChart()).defectDistribution.withoutDefect;

	assertEquals(
		afterNonAccident,
		after,
		"a non-accident report must not change chart totals",
	);

	await accident.deleteOne({ filter: { _id: legacy._id } });
	await accident.deleteOne({ filter: { _id: breakdown._id } });
});

// ---------------------------------------------------------------------------
// 3. Guard: every chart module must go through the shared filter
// ---------------------------------------------------------------------------

Deno.test("every chart fn scopes itself via accidentOnlyFilter", async () => {
	const chartsDir = new URL("../src/accident/charts/", import.meta.url);

	const offenders: string[] = [];
	for await (const entry of Deno.readDir(chartsDir)) {
		if (!entry.isDirectory) continue;

		const fnFile = new URL(`${entry.name}/${entry.name}.fn.ts`, chartsDir);
		let source: string;
		try {
			source = await Deno.readTextFile(fnFile);
		} catch {
			// Directory without a matching .fn.ts (e.g. shared helpers).
			continue;
		}

		if (!source.includes("accidentOnlyFilter")) {
			offenders.push(entry.name);
		}
		// A bare equality match is exactly the regression we are preventing.
		if (source.includes('incident_type: "accident"')) {
			offenders.push(`${entry.name} (raw equality match)`);
		}
	}

	assertEquals(
		offenders,
		[],
		`chart modules bypassing accidentOnlyFilter: ${offenders.join(", ")}`,
	);
});

// ---------------------------------------------------------------------------
// 4. "Filter by incident type" lists must also keep legacy accidents
// ---------------------------------------------------------------------------

Deno.test("incidentTypeFilter is legacy-aware for accident and exact for other types", () => {
	assertEquals(incidentTypeFilter("accident"), {
		incident_type: { $in: ["accident", null] },
	});
	// No legacy doc could ever be a non-accident report, so stay exact.
	assertEquals(incidentTypeFilter("road_breakdown"), {
		incident_type: "road_breakdown",
	});
	assertEquals(incidentTypeFilter("road_obstacle"), {
		incident_type: "road_obstacle",
	});
});

Deno.test("accident.gets with incidentType=accident returns legacy accidents", async () => {
	const legacy = await insertLegacyAccident(
		`charts-gets-legacy-${Date.now()}`,
	);

	const rows = (await getsFn({
		service: "main",
		model: "accident",
		act: "gets",
		details: {
			// `page`/`limit` are required by the validator and drive $skip/$limit.
			set: { page: 1, limit: 500, incidentType: "accident" },
			get: { _id: 1, seri: 1 },
		},
	} as never)) as Array<{ _id: unknown }>;

	const ids = rows.map((row) => String(row._id));
	assert(
		ids.includes(String(legacy._id)),
		"filtering by type=accident must not hide legacy accidents",
	);

	// ...while an explicit non-accident type must not match it.
	const breakdownRows = (await getsFn({
		service: "main",
		model: "accident",
		act: "gets",
		details: {
			set: { page: 1, limit: 500, incidentType: "road_breakdown" },
			get: { _id: 1, seri: 1 },
		},
	} as never)) as Array<{ _id: unknown }>;

	assert(
		!breakdownRows.map((row) => String(row._id)).includes(
			String(legacy._id),
		),
		"legacy accidents must not leak into non-accident type filters",
	);

	await accident.deleteOne({ filter: { _id: legacy._id } });
});
