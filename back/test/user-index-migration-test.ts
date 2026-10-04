/**
 * `user` index-migration tests.
 *
 * The regression this covers is invisible to a normal suite: every backend test
 * drops its database, so a stale index left by an older schema is never present
 * in the first place. Asserting "the seed can create seventeen users" would pass
 * against broken code. The old index therefore has to be **recreated
 * deliberately** here, and the collection emptied first — building a unique
 * index over documents that already violate it fails outright.
 *
 * The index in question is `national_number_1`, unique and NOT sparse. Mongo
 * admits exactly one document with a missing value under such an index, so the
 * second user without a national number could never be inserted. `user.
 * seedDemoOrganization` creates seventeen of them and hit precisely that.
 *
 * Run: deno test -A test/user-index-migration-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { type ObjectId } from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import { coreApp, user } from "../mod.ts";
import { applyUserIndexMigrations } from "@model";

const TEST_DB = "nejat_patrol_ops_test";
const LEGACY_INDEX = "national_number_1";

const collection = () => coreApp.odm.getCollection("user");

/** Recreate what an older schema left behind: unique, and not sparse. */
const recreateLegacyIndex = async () => {
	await collection().deleteMany({});
	await collection().createIndex(
		{ national_number: 1 },
		{ unique: true, sparse: false, name: LEGACY_INDEX },
	);
};

const indexNames = async (): Promise<string[]> => {
	const indexes = await collection().indexes();
	return indexes.map((index) => String(index.name));
};

const insertUserWithoutNationalNumber = async (
	seq: number,
): Promise<ObjectId> => {
	const created = await user.insertOne({
		doc: {
			first_name: `نام${seq}`,
			last_name: "خانوادگی",
			father_name: "پدر",
			mobile: `0919${String(10000000 + seq)}`,
			gender: "Male",
			email: `uim_${seq}@test.local`,
			level: "Patrol",
			address: "-",
			is_active: true,
			failed_login_attempts: 0,
			roles: [],
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
			// `national_number` deliberately absent — the field is optional, and
			// omitting it is what the old index made impossible twice over.
		},
		relations: {},
		projection: { _id: 1 },
	});
	return created!._id as ObjectId;
};

Deno.test("the legacy index is present and does block a second national-number-less user", async () => {
	// This asserts the *broken* starting state on purpose. Without it the next
	// test could pass simply because the recreation never took effect.
	await recreateLegacyIndex();
	assert(
		(await indexNames()).includes(LEGACY_INDEX),
		"precondition: the legacy index exists",
	);

	await insertUserWithoutNationalNumber(1);
	let secondRejected = false;
	try {
		await insertUserWithoutNationalNumber(2);
	} catch (error) {
		secondRejected = String((error as Error).message).includes("E11000");
	}
	assert(
		secondRejected,
		"precondition: a non-sparse unique index really does reject the second user",
	);
});

Deno.test("applyUserIndexMigrations drops it", async () => {
	await recreateLegacyIndex();
	assert((await indexNames()).includes(LEGACY_INDEX), "precondition");

	await applyUserIndexMigrations();

	assertEquals(
		(await indexNames()).includes(LEGACY_INDEX),
		false,
		"national_number_1 must be gone",
	);
});

Deno.test("after the migration, many users can omit national_number", async () => {
	// The behavioural assertion, not just the index's absence: nothing in the
	// schema requires a national number, so the data must actually be insertable.
	await recreateLegacyIndex();
	await applyUserIndexMigrations();
	await collection().deleteMany({});

	const ids: ObjectId[] = [];
	for (let seq = 1; seq <= 17; seq++) {
		ids.push(await insertUserWithoutNationalNumber(seq));
	}
	assertEquals(ids.length, 17, "all seventeen inserted");
	assertEquals(
		await collection().countDocuments({}),
		17,
		"and all seventeen persisted",
	);
});

Deno.test("it is idempotent, and tolerates a collection with no such index", async () => {
	await recreateLegacyIndex();
	await applyUserIndexMigrations();
	// Second run must not throw on the now-absent index.
	await applyUserIndexMigrations();
	await applyUserIndexMigrations();
	assertEquals((await indexNames()).includes(LEGACY_INDEX), false);
});

Deno.test("the indexes the schema does declare are untouched", async () => {
	// The migration drops one legacy index, not the live ones. `email` and
	// `personnel_code` are both unique+sparse and must survive.
	const names = await indexNames();
	for (const expected of ["email_1", "personnel_code_1"]) {
		assert(names.includes(expected), `${expected} must still exist`);
	}
});

Deno.test("cleanup test database", async () => {
	await collection().deleteMany({});
});
