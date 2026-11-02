/**
 * City-zone linking for newly filed documents.
 *
 * Covers:
 *   - `accident.add` resolves a `city_zone` from the accident location when the
 *     client did not send one
 *   - a client-supplied `cityZoneId` is preserved
 *   - an out-of-zone accident stays unlinked
 *   - `backfillCityZones` links pre-existing accidents and incident reports and
 *     is idempotent
 *
 * Run: deno test -A test/city-zone-link-test.ts
 */

import "./city_zone_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type Document, jwt, ObjectId } from "@deps";
import { assert as structAssert, create as structCreate } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	accident,
	city_zone,
	coreApp,
	getAtcsWithServices,
	incident_report,
	user,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
const SEED = Number(RUN.split("_")[1]);

// A unique square per run, so rows left by earlier runs never fall inside it.
// The test database persists between runs; geometry, not a cleanup step, is
// what keeps the two backfill assertions honest.
const WIDTH = 0.0001;
const BASE_LON = 51 + (SEED % 1_000_000) / 200_000;
const BASE_LAT = 35 + ((SEED * 7919) % 1_000_000) / 200_000;
const ZONE_A = {
	lon: [BASE_LON, BASE_LON + WIDTH] as const,
	lat: [BASE_LAT, BASE_LAT + WIDTH] as const,
};
const ZONE_B = {
	lon: [BASE_LON + WIDTH * 2, BASE_LON + WIDTH * 3] as const,
	lat: [BASE_LAT, BASE_LAT + WIDTH] as const,
};

type GeoMultiPolygon = {
	type: "MultiPolygon";
	coordinates: [number, number][][][];
};

type GeoPoint = {
	type: "Point";
	coordinates: [number, number];
};

const square = (zone: typeof ZONE_A): GeoMultiPolygon => ({
	type: "MultiPolygon",
	coordinates: [[[
		[zone.lon[0], zone.lat[0]],
		[zone.lon[1], zone.lat[0]],
		[zone.lon[1], zone.lat[1]],
		[zone.lon[0], zone.lat[1]],
		[zone.lon[0], zone.lat[0]],
	]]],
});

const point = (zone: typeof ZONE_A): GeoPoint => ({
	type: "Point",
	coordinates: [
		(zone.lon[0] + zone.lon[1]) / 2,
		(zone.lat[0] + zone.lat[1]) / 2,
	],
});

const makeToken = async (userId: string) =>
	await jwt.create({ alg: "HS512", typ: "JWT" }, {
		_id: userId,
		exp: jwt.getNumericDate(60 * 60),
	}, jwtTokenKey);

const runAct = async (
	schema: string,
	actName: string,
	details: { set: Document; get: Document },
	userId?: ObjectId,
) => {
	const headers = new Headers();
	if (userId) headers.set("token", await makeToken(userId.toString()));
	coreApp.contextFns.addContexts({ Headers: headers } as never);
	const act = getAtcsWithServices().main[schema][actName];
	assertExists(act, `act ${schema}.${actName} is not registered`);
	for (const pre of act.preAct ?? []) await pre();
	const validated = act.validationRunType === "create"
		? structCreate(details, act.validator as never)
		: (structAssert(details, act.validator as never), details);
	return await act.fn({
		service: "main",
		model: schema,
		act: actName,
		details: validated,
	} as never);
};

const insertUser = async (level: string): Promise<ObjectId> => {
	const created = await user.insertOne({
		doc: {
			first_name: "کاربر",
			last_name: `آزمون${SEED}`,
			mobile: `0913${String(10000000 + SEED)}`,
			gender: "Male",
			email: `cz_${RUN}@test.local`,
			level,
			is_active: true,
			failed_login_attempts: 0,
			roles: [],
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

const insertZone = async (name: string, zone: typeof ZONE_A) => {
	const created = await city_zone.insertOne({
		doc: {
			name,
			area: square(zone),
			population: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

let managerId: ObjectId;
let zoneAId: ObjectId;
let zoneBId: ObjectId;

Deno.test("seed fixtures", async () => {
	managerId = await insertUser("Manager");
	zoneAId = await insertZone(`zone-a-${RUN}`, ZONE_A);
	zoneBId = await insertZone(`zone-b-${RUN}`, ZONE_B);
});

Deno.test("accident.add — resolves city_zone from location", async () => {
	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `cz-auto-${RUN}`,
			location: point(ZONE_A),
		},
		get: { _id: 1, city_zone: { _id: 1 } },
	}, managerId) as { city_zone?: { _id?: ObjectId } };

	assertEquals(created.city_zone?._id?.toString(), zoneAId.toString());
});

Deno.test("accident.add — keeps a client-supplied cityZoneId", async () => {
	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `cz-explicit-${RUN}`,
			location: point(ZONE_A),
			cityZoneId: zoneBId.toString(),
		},
		get: { _id: 1, city_zone: { _id: 1 } },
	}, managerId) as { city_zone?: { _id?: ObjectId } };

	assertEquals(created.city_zone?._id?.toString(), zoneBId.toString());
});

Deno.test("accident.add — leaves an out-of-zone accident unlinked", async () => {
	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `cz-outside-${RUN}`,
			location: {
				type: "Point",
				coordinates: [10, 10],
			},
		},
		get: { _id: 1, city_zone: { _id: 1 } },
	}, managerId) as { city_zone?: { _id?: ObjectId } };

	assertEquals(created.city_zone, undefined);
});

Deno.test("backfillCityZones — links missing accident and incident_report rows", async () => {
	const missingAccident = await accident.insertOne({
		doc: {
			location: point(ZONE_A),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {},
		projection: { _id: 1 },
	});
	const missingReport = await incident_report.insertOne({
		doc: {
			form_definition_id: new ObjectId(),
			form_title: "form",
			client_report_uuid: `cz-report-${RUN}`,
			location: point(ZONE_A),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {},
		projection: { _id: 1 },
	});

	const first = await runAct("city_zone", "backfillCityZones", {
		set: { model: "both" },
		get: { summary: 1 },
	}, managerId) as { summary: Record<string, number> };

	assert(
		first.summary.linked >= 2,
		`expected at least the two fixtures linked, got ${
			JSON.stringify(first.summary)
		}`,
	);

	const linkedAccident = await accident.findOne({
		filters: { _id: missingAccident!._id },
		projection: { _id: 1, city_zone: { _id: 1 } },
	}) as { city_zone?: { _id?: ObjectId } };
	assertEquals(linkedAccident.city_zone?._id?.toString(), zoneAId.toString());

	const linkedReport = await incident_report.findOne({
		filters: { _id: missingReport!._id },
		projection: { _id: 1, city_zone: { _id: 1 } },
	}) as { city_zone?: { _id?: ObjectId } };
	assertEquals(linkedReport.city_zone?._id?.toString(), zoneAId.toString());

	const second = await runAct("city_zone", "backfillCityZones", {
		set: { model: "both" },
		get: { summary: 1 },
	}, managerId) as { summary: Record<string, number> };

	assertEquals(
		second.summary.linked,
		0,
		`backfill must be idempotent, got ${JSON.stringify(second.summary)}`,
	);
});
