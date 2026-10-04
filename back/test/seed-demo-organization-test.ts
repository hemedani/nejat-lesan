/**
 * `user.seedDemoOrganization` — the evidence that a seeded demo organization is
 * usable, not merely present.
 *
 * Everything before this file was verified by scratch scripts that were then
 * deleted, so this is what stays behind. The bar is deliberately higher than
 * "the seed runs": a report has to be fileable against the seeded forms, on
 * **both** models, and the seeded OrgHead's oversight console has to be able to
 * see both. A seed that creates rows nobody can record against has proved
 * nothing.
 *
 * Two things are deliberately *not* taken on trust:
 *
 *  - The seed's own summary is read only to learn which ids to look at. Every
 *    claim is then re-checked against the documents, because a self-report
 *    cannot prove its own idempotency — which is the whole of assertion 8.
 *  - The demo password is asserted under its own key, `demoPassword`, never
 *    `password`: that name is what keeps this response from being mistaken for a
 *    projected credential field. That assertion alone is tautological with
 *    respect to authentication — it compares a constant with a literal — so the
 *    last test actually logs a seeded officer in with it *and* with a wrong one.
 *
 * Run alone: deno test -A test/seed-demo-organization-test.ts
 * Every backend suite shares one database and each empties it at the end.
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
	assertExists,
	assertRejects,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import {
	assert as structAssert,
	create as structCreate,
	type Document,
	jwt,
	MongoClient,
	ObjectId,
} from "@deps";
// NOTE: back/mod.ts must be evaluated before @lib (circular-init ordering).
import {
	accident,
	coreApp,
	device,
	form_definition,
	getAtcsWithServices,
	incident_report,
	organization,
	road,
	unit,
	user,
	vehicle,
} from "../mod.ts";
import { jwtTokenKey } from "@lib";
import { isFormIconName } from "@forms";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

// --- The literal values this suite pins ---------------------------------------
// Written out rather than imported from the seed's own constants: a test that
// reads its expectation from the code under test proves nothing if the constant
// is ever edited.

const DEMO_ORG_CODE = "AHR";
const DEMO_ROAD_NAME = "آزادراه اهواز – بندر امام";
const DEMO_ORG_NAME =
	"شرکت احداث، نگهداری و بهره‌برداری آزادراه اهواز – بندر امام (ره)";
const DEMO_ORG_EN_NAME =
	"Ahvaz – Bandar Imam (RAH) Freeway Construction, Maintenance, and Operation Company";
const DEMO_PASSWORD = "Demo@1404";

const ACCIDENT_FORM_NAME = "گزارش تصادف آزادراه اهواز ـ بندر امام";
const ACCIDENT_FORM_ICON = "car";

/** The three report forms, with the icon each one is published under. */
const REPORT_FORMS: Array<{ name: string; icon: string }> = [
	{ name: "خرابی سطح راه", icon: "roadHorizon" },
	{ name: "مانع در سطح راه", icon: "barricade" },
	{ name: "خرابی روشنایی", icon: "lightbulb" },
];

/** The report form this suite files against. */
const FILED_REPORT_FORM = REPORT_FORMS[0].name;

/** One point on the demo road, used as the capture location for both filings. */
const DEMO_POINT = [48.67, 31.3183];

// --- Harness ------------------------------------------------------------------

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

const str = (value: unknown): string => String(value ?? "");
const oid = (value: unknown): ObjectId => new ObjectId(str(value));

type Rel = { _id?: ObjectId };

type OrgRow = {
	_id: ObjectId;
	code?: string;
	name?: string;
	enName?: string;
	road?: Rel & { name?: string };
	head?: Rel;
};

type UnitRow = {
	_id: ObjectId;
	code?: string;
	name?: string;
	type?: string;
	organization?: Rel;
	road?: Rel;
	head?: Rel;
	officers?: Rel[];
	vehicles?: Rel[];
};

type FormRow = {
	_id: ObjectId;
	name?: string;
	form_kind?: string;
	status?: string;
	icon?: string;
	version?: number;
	organization?: Rel;
};

/** The shape the seed answers with — used only to learn which ids to look at. */
type SeedSummary = {
	demoPassword: string;
	organization: { _id: string; code: string; name: string };
	road: { _id: string; name: string };
	units: Array<{ _id: string; code: string }>;
	orgHead: { _id: string; email: string; level: string };
	unitHeads: Array<{ _id: string; unitCode: string }>;
	officers: Array<{ _id: string; email: string; unitCode: string }>;
	vehicles: Array<{ _id: string; unitCode: string }>;
	forms: Array<{
		_id: string;
		name: string;
		form_kind: string;
		icon: string;
		status: string;
		version: number;
		activated: boolean;
	}>;
	totalCreated: number;
	totalReused: number;
};

// --- Reading the graph back out of the database -------------------------------

const readDemoOrg = async (): Promise<OrgRow> => {
	const row = await organization.findOne({
		filters: { code: DEMO_ORG_CODE },
		projection: {
			_id: 1,
			code: 1,
			name: 1,
			enName: 1,
			"road._id": 1,
			"road.name": 1,
			"head._id": 1,
		},
	}) as unknown as OrgRow | null;
	assertExists(row, `the demo organization (code ${DEMO_ORG_CODE}) exists`);
	return row;
};

const readOrgUnits = async (orgId: ObjectId): Promise<UnitRow[]> =>
	await unit.find({
		filters: { "organization._id": orgId },
		projection: {
			_id: 1,
			code: 1,
			name: 1,
			type: 1,
			"organization._id": 1,
			"road._id": 1,
			"head._id": 1,
			"officers._id": 1,
			"vehicles._id": 1,
		},
	}).toArray() as unknown as UnitRow[];

const readOrgForms = async (orgId: ObjectId): Promise<FormRow[]> =>
	await form_definition.find({
		filters: { "organization._id": orgId },
		projection: {
			_id: 1,
			name: 1,
			form_kind: 1,
			status: 1,
			icon: 1,
			version: 1,
			"organization._id": 1,
		},
	}).toArray() as unknown as FormRow[];

/**
 * The collections this suite writes and reads, emptied by `deleteMany`.
 *
 * `deleteMany`, never `drop`: `back/mod.ts` fires `createIndex` un-awaited at
 * boot, and dropping a collection while its index is still building aborts the
 * build with «Index build failed … is being dropped».
 *
 * `module_config` is deliberately **not** on this list. It holds one singleton
 * document written by `setModuleConfig` through `findOneAndUpdate`, so emptying
 * the collection makes the next `app_modules.setModules` fail with
 * «can not update this doc» — the licence row is installation state, not suite
 * state, and it is enabled again in the setup test either way.
 *
 * `device` is on this list because a device-scoped `user.login` registers one,
 * and `device.device_id` is uniquely indexed: leaving it behind would make the
 * next run of this suite fail on a duplicate key rather than on anything about
 * the demo.
 */
const SUITE_COLLECTIONS = [
	"user",
	"device",
	"organization",
	"road",
	"unit",
	"vehicle",
	"form_definition",
	"form_response",
	"accident",
	"incident_report",
];

const emptyDocuments = async () => {
	const client = await new MongoClient(
		Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/",
	).connect();
	const db = client.db(Deno.env.get("DB_NAME") ?? "nejat_patrol_ops_test");
	for (const name of SUITE_COLLECTIONS) {
		await db.collection(name).deleteMany({});
	}
	await client.close();
};

const insertUser = async (level: string, tag: string) =>
	(await user.insertOne({
		doc: {
			first_name: `نام_${tag}`,
			last_name: `خانوادگی_${tag}`,
			mobile: `0915${tag === "ghost" ? "00000" : "11111"}${
				RUN.slice(-4)
			}`,
			gender: "Male",
			email: `${tag}_${RUN}@test.local`,
			level,
			is_active: true,
			is_verified: true,
			failed_login_attempts: 0,
			settings: { cities: [], provinces: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	}))!._id as ObjectId;

let ghostId: ObjectId;
let managerId: ObjectId;
let seed: SeedSummary;
let formRow: FormRow | undefined;
let filedAccidentId: ObjectId;
let filedReportId: ObjectId;

// ---------------------------------------------------------------------------
// 1. Seed in order
// ---------------------------------------------------------------------------

Deno.test("seeds in order — user.seedShared, then user.seedDemoOrganization, both as a Manager", async () => {
	// Start from empty documents, so every count below is this suite's own work.
	await emptyDocuments();

	ghostId = await insertUser("Ghost", "ghost");
	managerId = await insertUser("Manager", "manager");

	// Every module on, turned on by the Ghost. A test database boots with an empty
	// module set, and without this `form_definition.*` — which the seed needs to
	// publish its four forms — is refused before it is ever reached.
	const { MODULE_KEYS } = await import("../src/app_modules/constants.ts");
	await runAct("app_modules", "setModules", {
		set: { modules: MODULE_KEYS.map((key) => ({ key, enabled: true })) },
		get: {},
	}, ghostId);

	// Order is a hard requirement, not a convention: `form_definition.activate`
	// refuses a definition whose reference model holds no records, and
	// `seedShared` is the only thing that populates them. Both acts are
	// Manager-gated, and both throwing fails this test.
	await runAct("user", "seedShared", { set: {}, get: {} }, managerId);
	seed = await runAct("user", "seedDemoOrganization", {
		set: {},
		get: {},
	}, managerId) as SeedSummary;

	// The shared demo password comes back under its own key, so the response can
	// never be read as a projected `password` field.
	assertEquals(seed.demoPassword, DEMO_PASSWORD);
	assertEquals(seed.organization.code, DEMO_ORG_CODE);
});

// ---------------------------------------------------------------------------
// 2. The graph — the relations, not the counts
// ---------------------------------------------------------------------------

Deno.test("the demo organization is the Ahvaz–Bandar Imam freeway company, bound to its own road", async () => {
	const stored = await readDemoOrg();

	assertEquals(stored.code, DEMO_ORG_CODE);
	assertEquals(stored.name, DEMO_ORG_NAME);
	assertEquals(stored.enName, DEMO_ORG_EN_NAME);

	// `organization.code` is required and uniquely indexed, so this only fails if
	// that index is gone — in which case a second copy of the demo would be
	// invisible to every count below.
	assertEquals(
		await organization.countDocument({ filter: { code: DEMO_ORG_CODE } }),
		1,
		"exactly one organization carries the demo code",
	);

	// A roadless organization has no console: `getOrgReportBase` reaches reports
	// filed before the `organization` link existed through `organization.road`.
	assertExists(stored.road?._id, "the demo organization is bound to a road");
	assertEquals(stored.road?.name, DEMO_ROAD_NAME);

	// The reverse link Lesan auto-creates from `organization.road` — the other
	// direction `ensureDemoRoad` searches, and the one `resolveFilingOrgId`
	// falls back to when an officer spans several units.
	const roadRow = await road.findOne({
		filters: { _id: stored.road._id },
		projection: { _id: 1, name: 1, "organization._id": 1 },
	}) as unknown as
		| { _id: ObjectId; name?: string; organization?: Rel }
		| null;
	assertExists(roadRow, "the demo road exists");
	assertEquals(roadRow!.name, DEMO_ROAD_NAME);
	assertEquals(
		str(roadRow!.organization?._id),
		str(stored._id),
		"the road points back at the demo organization",
	);
});

Deno.test("all six units belong to the demo organization and to *its* road", async () => {
	const org = await readDemoOrg();
	const units = await readOrgUnits(org._id);

	assertEquals(units.length, 6, "six units");

	const orgRoadId = str(org.road?._id);
	assert(
		orgRoadId.length > 0,
		"the demo organization has a road id to compare",
	);
	for (const row of units) {
		// Presence is asserted before equality on purpose. `str(undefined)` is `""`
		// on both sides, so a projection that silently returned nothing would make
		// every equality below pass while proving nothing.
		assert(
			str(row.organization?._id).length > 0,
			`unit ${row.code} has an organization relation at all`,
		);
		assert(
			str(row.road?._id).length > 0,
			`unit ${row.code} has a road relation at all`,
		);
		assertEquals(
			str(row.organization?._id),
			str(org._id),
			`unit ${row.code} belongs to the demo organization`,
		);
		// A real invariant, and one nothing checks for the seeder: `unit.add`
		// refuses a unit whose road differs from its organization's, but the
		// seeder inserts directly. A unit on the wrong road would put its
		// officers' reports in an org console that cannot see them.
		assertEquals(
			str(row.road?._id),
			orgRoadId,
			`unit ${row.code} sits on the organization's own road`,
		);
	}
});

Deno.test("each unit has a head, and the six heads are six distinct people", async () => {
	const org = await readDemoOrg();
	const units = await readOrgUnits(org._id);

	const headIds = units.map((row) => str(row.head?._id));
	assert(
		headIds.every((id) => id.length > 0),
		`every unit has a head, got: ${JSON.stringify(headIds)}`,
	);
	assertEquals(
		new Set(headIds).size,
		6,
		"the six heads are six distinct people, not one person wearing six hats",
	);

	const heads = await user.find({
		filters: { _id: { $in: units.map((row) => oid(row.head?._id)) } },
		projection: {
			_id: 1,
			level: 1,
			"organizations._id": 1,
			"headedUnits._id": 1,
		},
	}).toArray() as unknown as Array<
		{
			_id: ObjectId;
			level?: string;
			organizations?: Rel[];
			headedUnits?: Rel[];
		}
	>;
	assertEquals(heads.length, 6);
	for (const head of heads) {
		assertEquals(
			head.level,
			"UnitHead",
			"a unit head is a UnitHead-level user",
		);
		assertEquals(
			(head.organizations ?? []).map((entry) => str(entry._id)),
			[str(org._id)],
			"a unit head is a member of the demo organization",
		);
		assertEquals(
			(head.headedUnits ?? []).length,
			1,
			"a unit head heads exactly one of the six units",
		);
	}
});

Deno.test("the organization has a head, and it is the seeded OrgHead", async () => {
	const org = await readDemoOrg();

	assertEquals(
		str(org.head?._id),
		seed.orgHead._id,
		"the organization's head is the OrgHead the seed reported",
	);

	const head = await user.findOne({
		filters: { _id: oid(seed.orgHead._id) },
		projection: { _id: 1, level: 1, email: 1, roles: 1, is_active: 1 },
	}) as unknown as
		| {
			_id: ObjectId;
			level?: string;
			email?: string;
			is_active?: boolean;
			roles?: Array<
				{ name?: string; scopeType?: string; scopeId?: string }
			>;
		}
		| null;
	assertExists(head, "the OrgHead exists");
	assertEquals(head!.level, "OrgHead");
	assertEquals(head!.is_active, true);
	assertEquals(head!.email, seed.orgHead.email);

	// This scope is the whole audience of the oversight console: `getOrgReportBase`
	// rejects every role that is not OrgHead/UnitHead, so without an
	// organization-scoped role the console refuses to show anything at all.
	assert(
		(head!.roles ?? []).some((role) =>
			role.scopeType === "organization" &&
			role.scopeId === str(org._id)
		),
		`the OrgHead is scoped to the demo organization, got: ${
			JSON.stringify(head!.roles)
		}`,
	);
});

Deno.test("every patrol officer sits in exactly one unit", async () => {
	const org = await readDemoOrg();
	const units = await readOrgUnits(org._id);

	const seatCount = new Map<string, number>();
	for (const row of units) {
		for (const officer of row.officers ?? []) {
			const id = str(officer._id);
			seatCount.set(id, (seatCount.get(id) ?? 0) + 1);
		}
	}

	assertEquals(
		[...seatCount.values()].reduce((total, seats) => total + seats, 0),
		10,
		"ten patrol officers, seated 2/2/2/2/1/1 across the six units",
	);
	assertEquals(seatCount.size, 10, "ten distinct officers");

	// The invariant the whole feature rests on. `resolveFilingOrgId` resolves an
	// organization only when the actor's unit set yields a single org, so an
	// officer in two units would file reports that no console can attribute — and
	// every other assertion here would still pass.
	for (const [officerId, seats] of seatCount) {
		assertEquals(seats, 1, `officer ${officerId} sits in exactly one unit`);
	}

	// The reverse single relation `user.unit` has to agree with `unit.officers`:
	// adding the same officer to a second unit moves `user.unit` silently while the
	// first unit's array still lists them.
	const officers = await user.find({
		filters: { _id: { $in: [...seatCount.keys()].map(oid) } },
		projection: {
			_id: 1,
			level: 1,
			"unit._id": 1,
			"organizations._id": 1,
		},
	}).toArray() as unknown as Array<
		{
			_id: ObjectId;
			level?: string;
			unit?: Rel;
			organizations?: Rel[];
		}
	>;
	assertEquals(officers.length, 10);
	for (const officer of officers) {
		assertEquals(
			officer.level,
			"Patrol",
			"every seated officer is a Patrol",
		);
		const seat = units.find((row) =>
			(row.officers ?? []).some((entry) =>
				str(entry._id) === str(officer._id)
			)
		);
		assertExists(seat, `officer ${officer._id} is listed by a unit`);
		assertEquals(
			str(officer.unit?._id),
			str(seat!._id),
			`officer ${officer._id}'s own unit is the unit that lists them`,
		);
		assertEquals(
			(officer.organizations ?? []).map((entry) => str(entry._id)),
			[str(org._id)],
			"each officer is a member of the demo organization",
		);
	}

	// And nobody is a Patrol member of this organization without a seat.
	assertEquals(
		await user.countDocument({
			filter: { "organizations._id": org._id, level: "Patrol" },
		}),
		10,
		"the organization has exactly ten patrol members, all of them seated",
	);
});

Deno.test("every vehicle is attached to a unit, and each unit's vehicles are that unit's", async () => {
	const org = await readDemoOrg();
	const units = await readOrgUnits(org._id);

	const vehiclesByUnit = new Map<string, Set<string>>();
	for (const row of units) {
		vehiclesByUnit.set(
			str(row._id),
			new Set((row.vehicles ?? []).map((entry) => str(entry._id))),
		);
	}
	const attached = [...vehiclesByUnit.values()].flatMap((ids) => [...ids]);

	assertEquals(attached.length, 12, "twelve vehicles attached to units");
	assertEquals(
		new Set(attached).size,
		12,
		"no vehicle attached to two units",
	);

	const rows = await vehicle.find({
		filters: { _id: { $in: seed.vehicles.map((entry) => oid(entry._id)) } },
		projection: { _id: 1, plaque_no: 1, "unit._id": 1 },
	}).toArray() as unknown as Array<
		{ _id: ObjectId; plaque_no?: string[]; unit?: Rel }
	>;
	assertEquals(rows.length, 12, "the seed's twelve vehicles all exist");

	// The two directions have to be inverses of each other: a vehicle pointing at a
	// unit that does not list it would be invisible to anything reading the unit.
	const attachedIds = new Set(attached);
	for (const row of rows) {
		const unitId = str(row.unit?._id);
		assert(
			unitId.length > 0 && vehiclesByUnit.has(unitId),
			`vehicle ${row._id} points at one of the demo's units, got ${unitId}`,
		);
		assert(
			vehiclesByUnit.get(unitId)!.has(str(row._id)),
			`unit ${unitId} lists vehicle ${row._id} back`,
		);
		assert(
			attachedIds.has(str(row._id)),
			`vehicle ${row._id} is one of the attached twelve`,
		);
	}
});

// ---------------------------------------------------------------------------
// 3. + 4. The four published forms
// ---------------------------------------------------------------------------

Deno.test("the QA accident form is active for the org, and it is the only active accident form", async () => {
	const org = await readDemoOrg();
	const forms = await readOrgForms(org._id);

	const activeAccidentForms = forms.filter((form) =>
		form.form_kind === "accident" && form.status === "active"
	);
	assertEquals(
		activeAccidentForms.length,
		1,
		`exactly one active accident form, counted from the documents: ${
			JSON.stringify(forms.map((form) => [form.name, form.status]))
		}`,
	);
	assertEquals(activeAccidentForms[0].name, ACCIDENT_FORM_NAME);
	assertEquals(activeAccidentForms[0].icon, ACCIDENT_FORM_ICON);
	assertEquals(
		str(activeAccidentForms[0].organization?._id),
		str(org._id),
		"the accident form belongs to the demo organization",
	);

	// The same claim the database would answer, through the partial unique index
	// rather than through the seed's summary.
	assertEquals(
		await form_definition.countDocument({
			filter: {
				"organization._id": org._id,
				form_kind: "accident",
				status: "active",
			},
		}),
		1,
		"counted directly, there is still exactly one active accident form",
	);
});

Deno.test("the three report forms are active incident_report forms, each with a shared icon", async () => {
	const org = await readDemoOrg();
	const activeReports = (await readOrgForms(org._id)).filter((form) =>
		form.form_kind === "incident_report" && form.status === "active"
	);

	assertEquals(
		activeReports.length,
		3,
		`three active report forms, got: ${
			JSON.stringify(activeReports.map((form) => form.name))
		}`,
	);

	const byName = new Map(activeReports.map((form) => [form.name, form]));
	for (const expected of REPORT_FORMS) {
		const form = byName.get(expected.name);
		assertExists(
			form,
			`${expected.name} is active for the demo organization`,
		);
		assertEquals(form!.form_kind, "incident_report");
		assertEquals(form!.icon, expected.icon);
		// The shared vocabulary: an icon outside it renders as a blank box on the
		// officer's phone, which `isFormIconName` is the registry's own answer for.
		assert(
			isFormIconName(form!.icon),
			`${expected.name}'s icon comes from the shared icon vocabulary`,
		);
		assertEquals(
			str(form!.organization?._id),
			str(org._id),
			`${expected.name} belongs to the demo organization`,
		);
	}
});

// ---------------------------------------------------------------------------
// 5. + 6. Filing real reports through the real acts
// ---------------------------------------------------------------------------

Deno.test("a real accident filed by a seeded patrol officer lands in the demo organization", async () => {
	const org = await readDemoOrg();
	const officerId = oid(seed.officers[0]._id);

	const officer = await user.findOne({
		filters: { _id: officerId },
		projection: { _id: 1, level: 1, "unit._id": 1 },
	}) as unknown as { _id: ObjectId; level?: string; unit?: Rel } | null;
	assertExists(officer, "the filing officer exists");
	assertEquals(
		officer!.level,
		"Patrol",
		"filed as one of the seeded officers",
	);

	// Minimal payload, exactly as the app sends it. Note what is *not* here: no
	// `organizationId`. Nothing in a client request can choose the filing org.
	//
	// The QA form's `form_definition_id` is absent too, and cannot be sent: the
	// `accident` model has no `form_definition_id`, `form_answers`,
	// `form_version` or `form_title` field at all, and superstruct's `object()` is
	// strict, so passing one rejects the whole submission. That requirement was
	// dropped for the accident path in the plan; it still stands for
	// `incident_report.add`, which is exercised below.
	const created = await runAct("accident", "add", {
		set: {
			client_report_uuid: `demo-accident-${RUN}`,
			location: { type: "Point", coordinates: DEMO_POINT },
			submitted_from: { app_version: "1.4.2", platform: "ios" },
		},
		get: { _id: 1 },
	}, officerId) as { _id?: ObjectId };

	assertExists(created?._id, "accident.add accepted the submission");
	filedAccidentId = created!._id!;

	const stored = await accident.findOne({
		filters: { _id: filedAccidentId },
		projection: {
			_id: 1,
			organization: 1,
			officer: 1,
			submitted_from: 1,
		},
	}) as unknown as
		| {
			_id: ObjectId;
			organization?: Rel;
			officer?: Rel & { level?: string };
			submitted_from?: { app_version?: string; platform?: string };
		}
		| null;
	assertExists(stored, "the accident is in the database");

	// The seam the whole feature rests on. Nothing named an organization, so this
	// value can only have come from `resolveFilingOrgId` walking the officer's
	// unit server-side — and a null here would leave the report invisible in the
	// oversight console while every other assertion in this file still passed.
	assertEquals(
		str(stored!.organization?._id),
		str(org._id),
		"the organization was resolved server-side from the officer's unit",
	);

	// The build that filed it, stored verbatim rather than looked up: a device's
	// `app_version` is overwritten on every login and cannot describe one report.
	assertEquals(stored!.submitted_from, {
		app_version: "1.4.2",
		platform: "ios",
	});

	// Attribution is server-pinned to the session user, which is also what the
	// console's `officer.level: "Patrol"` scope clause needs.
	assertEquals(str(stored!.officer?._id), str(officerId));
	assertEquals(stored!.officer?.level, "Patrol");
});

Deno.test("a real report filed against a seeded form is accepted, linked, and labelled by the server", async () => {
	const org = await readDemoOrg();
	const officerId = oid(seed.officers[0]._id);

	formRow = (await readOrgForms(org._id)).find((entry) =>
		entry.name === FILED_REPORT_FORM
	);
	assertExists(
		formRow,
		`${FILED_REPORT_FORM} exists for the demo organization`,
	);
	assertEquals(formRow!.status, "active");
	assertEquals(formRow!.form_kind, "incident_report");
	const form = formRow!;

	// Unlike the accident, this act *requires* `form_definition_id` — the report is
	// classified by its form, and there is no category enum to fall back on.
	const created = await runAct("incident_report", "add", {
		set: {
			form_definition_id: str(form!._id),
			client_report_uuid: `demo-report-${RUN}`,
			location: { type: "Point", coordinates: DEMO_POINT },
			submitted_from: { app_version: "1.4.2", platform: "android" },
			description: "گزارش آزمایشی دمو — خرابی سطح راه",
		},
		get: { _id: 1 },
	}, officerId) as { _id?: ObjectId };

	assertExists(created?._id, "incident_report.add accepted the submission");
	filedReportId = created!._id!;

	const stored = await incident_report.findOne({
		filters: { _id: filedReportId },
		projection: {
			_id: 1,
			form_definition_id: 1,
			form_title: 1,
			form_icon: 1,
			organization: 1,
			officer: 1,
			submitted_from: 1,
		},
	}) as unknown as
		| {
			_id: ObjectId;
			form_definition_id?: ObjectId;
			form_title?: string;
			form_icon?: string;
			organization?: Rel;
			officer?: Rel & { level?: string };
			submitted_from?: { app_version?: string; platform?: string };
		}
		| null;
	assertExists(stored, "the report is in the database");

	assertEquals(
		str(stored!.organization?._id),
		str(org._id),
		"the organization was resolved server-side from the officer's unit",
	);
	assertEquals(stored!.submitted_from, {
		app_version: "1.4.2",
		platform: "android",
	});

	// Server-derived provenance. The act reads the title and icon off the stored
	// definition rather than the request, so a client cannot mislabel a report in
	// the review console.
	//
	// `form_version` is deliberately **not** asserted here: nothing on the server
	// writes it. `incident_report_set_schema` accepts it as a client input and no
	// act ever sets it, so a report carries the form it was filed under but not the
	// definition version that was current. See the task report.
	assertEquals(stored!.form_title, form!.name);
	assertEquals(stored!.form_icon, form!.icon);
	assertEquals(str(stored!.form_definition_id), str(form!._id));

	assertEquals(str(stored!.officer?._id), str(officerId));
	assertEquals(stored!.officer?.level, "Patrol");
});

// ---------------------------------------------------------------------------
// 7. The console can see them
// ---------------------------------------------------------------------------

Deno.test("the seeded OrgHead's oversight console shows both the accident and the report", async () => {
	const org = await readDemoOrg();

	const { rows, total } = await runAct(
		"incident_report",
		"getOversightList",
		{ set: { page: 1, limit: 200 }, get: {} },
		oid(seed.orgHead._id),
	) as { rows: Array<Record<string, unknown>>; total: number };

	const byId = new Map(rows.map((row) => [str(row["_id"]), row]));
	const accidentRow = byId.get(str(filedAccidentId));
	const reportRow = byId.get(str(filedReportId));

	assertExists(accidentRow, "the accident reaches the org's console");
	assertExists(reportRow, "the report reaches the same console");

	assertEquals(accidentRow!["source"], "accident");
	assertEquals(accidentRow!["group_key"], "accident");
	assertEquals(reportRow!["source"], "incident_report");
	assertEquals(
		reportRow!["group_title"],
		FILED_REPORT_FORM,
		"a report is grouped under the form it was filed with",
	);
	assertEquals(
		str(reportRow!["group_key"]),
		str(formRow!._id),
		"a report's group key is its form definition",
	);

	// The accident was filed with no road at all, so its only route into this
	// console is the `organization._id` clause of `getOrgReportBase`. That clause
	// is exactly what assertion 5 wrote, so this is the end-to-end proof that the
	// server-side resolution worked — and the assertion most likely to catch a
	// silently-wrong scope, because the failure mode is an empty console rather
	// than an error.
	assertEquals(
		accidentRow!["road"],
		undefined,
		"the accident carries no road, so it can only have arrived via its organization",
	);
	assertEquals(
		str((accidentRow!["organization"] as Rel | undefined)?._id),
		str(org._id),
	);
	assertEquals(
		str((reportRow!["organization"] as Rel | undefined)?._id),
		str(org._id),
	);

	// Both documents are attributable to the filing officer, which is the other
	// half of the scope: `"officer.level": "Patrol"`.
	for (const row of [accidentRow!, reportRow!]) {
		assertEquals(
			str((row["officer"] as Rel | undefined)?._id),
			str(seed.officers[0]._id),
		);
	}

	// `total` counts the union rather than one page of it, and this database holds
	// nothing but what this suite filed.
	assertEquals(
		total,
		2,
		"the OrgHead's console holds exactly the two filings",
	);
	assertEquals(rows.length, total, "one page returned the whole match");
});

// ---------------------------------------------------------------------------
// 8. Re-running creates no duplicates
// ---------------------------------------------------------------------------

Deno.test("re-running the seed creates no duplicates", async () => {
	const org = await readDemoOrg();
	const before = {
		orgId: str(org._id),
		roadId: str(org.road?._id),
		unitIds: (await readOrgUnits(org._id)).map((row) => str(row._id))
			.sort(),
		formIds: (await readOrgForms(org._id)).map((row) => str(row._id))
			.sort(),
	};

	// Idempotency has to be measured on the documents, not on the seed's own
	// counters: a re-run reporting "0 created" while leaving a duplicate behind
	// would pass every check that reads the response.
	const second = await runAct("user", "seedDemoOrganization", {
		set: {},
		get: {},
	}, managerId) as SeedSummary;

	const orgAfter = await readDemoOrg();
	const unitsAfter = await readOrgUnits(org._id);
	const formsAfter = await readOrgForms(org._id);

	assertEquals(str(orgAfter._id), before.orgId, "the same organization");
	assertEquals(
		str(orgAfter.road?._id),
		before.roadId,
		"the same road",
	);
	assertEquals(
		await organization.countDocument({ filter: { code: DEMO_ORG_CODE } }),
		1,
		"still one organization with the demo code",
	);
	assertEquals(
		await road.countDocument({ filter: { name: DEMO_ROAD_NAME } }),
		1,
		"still one road with the demo name",
	);

	assertEquals(unitsAfter.length, 6, "still six units");
	assertEquals(
		unitsAfter.map((row) => str(row._id)).sort(),
		before.unitIds,
		"and the very same six unit documents",
	);

	assertEquals(
		await user.countDocument({
			filter: { "organizations._id": orgAfter._id, level: "Patrol" },
		}),
		10,
		"still ten patrol officers",
	);
	assertEquals(
		await user.countDocument({
			filter: { "organizations._id": orgAfter._id, level: "UnitHead" },
		}),
		6,
		"still six unit heads",
	);
	assertEquals(
		await user.countDocument({
			filter: { "organizations._id": orgAfter._id, level: "OrgHead" },
		}),
		1,
		"still one OrgHead",
	);
	assertEquals(
		unitsAfter.reduce(
			(total, row) => total + (row.vehicles ?? []).length,
			0,
		),
		12,
		"still twelve vehicles attached to units",
	);

	assertEquals(formsAfter.length, 4, "still exactly four form definitions");
	assertEquals(
		formsAfter.map((row) => str(row._id)).sort(),
		before.formIds,
		"and the very same four form documents",
	);
	assertEquals(
		await form_definition.countDocument({
			filter: {
				"organization._id": orgAfter._id,
				form_kind: "accident",
				status: "active",
			},
		}),
		1,
		"still exactly one active accident form",
	);

	// The re-run's own summary, as a cross-check on the documents above rather
	// than as the evidence for them.
	assertEquals(second.organization._id, before.orgId);
	assertEquals(second.totalCreated, 0, "the re-run created nothing");
	assert(
		second.forms.every((form) => form.activated === false),
		"the re-run activated nothing, so no already-active form was re-activated",
	);

	// The seed must not have disturbed what was filed before it: a second pass
	// that silently moved an officer's unit would leave both documents
	// unattributable, and every count above would still be correct.
	assertEquals(
		str(orgAfter.head?._id),
		seed.orgHead._id,
		"the OrgHead is still the organization's head",
	);
	for (const row of unitsAfter) {
		assert(
			str(row.head?._id).length > 0,
			`unit ${row.code} still has its head`,
		);
		assertEquals(
			str(row.road?._id),
			before.roadId,
			`unit ${row.code} is still on the organization's road`,
		);
	}
	for (
		const [label, model, filedId] of [
			["accident", accident, filedAccidentId],
			["incident report", incident_report, filedReportId],
		] as const
	) {
		const still = await model.findOne({
			filters: { _id: filedId },
			projection: { _id: 1, organization: 1 },
		}) as unknown as { organization?: Rel } | null;
		assertEquals(
			str(still?.organization?._id),
			str(orgAfter._id),
			`the ${label} filed before the re-run is still linked to the organization`,
		);
	}
});

Deno.test("a re-run does not advance any form's version", async () => {
	const org = await readDemoOrg();
	const before = new Map(
		(await readOrgForms(org._id)).map((row) => [
			str(row._id),
			row.version,
		]),
	);

	await runAct("user", "seedDemoOrganization", {
		set: {},
		get: {},
	}, managerId);

	const after = new Map(
		(await readOrgForms(org._id)).map((row) => [str(row._id), row.version]),
	);
	assertEquals(after.size, before.size, "still the same four forms");
	for (const [formId, version] of before) {
		assertEquals(
			after.get(formId),
			version,
			`form ${formId} keeps version ${version}`,
		);
	}
});

// ---------------------------------------------------------------------------
// 9. The demo password really authenticates
// ---------------------------------------------------------------------------

Deno.test("a seeded patrol officer logs in with the demo password, and only with it", async () => {
	// Assertion 1 is tautological with respect to authentication: `demoPassword`
	// is the act echoing a constant from `people.ts`, compared against the same
	// literal this file hardcodes, and nothing since has asked whether the hash
	// the seeder stored actually accepts that string. The plan's requirement —
	// "must have a usable password … or the demo cannot log in" — is only
	// testable by going through the real `user.login`, which is the one thing the
	// response cannot stand in for.
	//
	// Placed after the re-run tests on purpose: they leave every person untouched
	// (`ensureDemoUser` reuses and returns the existing document without
	// rewriting it), so this proves the password survives a second seed too.
	const claimed = str(seed.officers[0].email);
	assert(
		claimed.length > 0,
		"the seed reported an email for its first patrol officer",
	);

	// Re-verified against the database the way every other id in this suite is:
	// the response is a pointer at a document, never the evidence, and a login
	// against a stale or mis-mapped address would fail for the wrong reason and
	// read as a broken password.
	const officer = await user.findOne({
		filters: { email: claimed },
		projection: { _id: 1, email: 1, level: 1, is_active: 1 },
	}) as unknown as {
		_id: ObjectId;
		email?: string;
		level?: string;
		is_active?: boolean;
	} | null;
	assertExists(officer, `${claimed} is a user in the database`);
	assertEquals(officer!.level, "Patrol", "and is one of the seeded officers");
	assertEquals(officer!.is_active, true);
	assertEquals(
		str(officer!._id),
		str(seed.officers[0]._id),
		"the seed's id and the seed's email name the same person",
	);

	// A `device` payload is the demo's real path and the strongest proof
	// available that this account is genuinely Patrol-level: `loginUserFn`
	// refuses a device-scoped session for anyone who is not Patrol or Ghost, and
	// a device-less login would skip that check altogether. It also leaves the
	// one thing a plain login cannot show — that the officer holds patrol
	// permissions.
	const deviceId = `demo-device-${RUN}`;

	const loggedIn = await runAct("user", "login", {
		set: {
			email: claimed,
			password: DEMO_PASSWORD,
			device: {
				device_id: deviceId,
				fingerprint: `demo-fingerprint-${RUN}`,
				platform: "ios",
				app_version: "1.4.2",
				model: "Demo iPhone",
			},
		},
		// `get` is optional on this act, but `user` is required *inside* it, so an
		// empty `{}` is not a valid projection — `{user: {}}` asks for the officer
		// with no fields, and the act always adds `email` and `level` itself.
		get: { user: {} },
	}) as { token?: string; permissions?: Record<string, unknown> };

	assert(
		typeof loggedIn?.token === "string" && loggedIn.token.length > 0,
		"the demo password authenticates a seeded patrol officer",
	);
	assertEquals(
		loggedIn?.permissions?.can_submit_accident,
		true,
		"and the session carries the patrol permissions the officer was seeded with",
	);

	// The token is read rather than the response's `user` projection, because the
	// claims are what the next request will be authorized from: a device-scoped
	// JWT whose `level` is the officer's own.
	const claims = JSON.parse(
		atob(
			loggedIn!.token!.split(".")[1].replace(/-/g, "+").replace(
				/_/g,
				"/",
			),
		),
	) as Record<string, unknown>;
	assertEquals(
		str(claims["device_id"]),
		deviceId,
		"the token is device-scoped, so the device branch really ran",
	);
	assertEquals(claims["level"], "Patrol");
	assertEquals(str(claims["_id"]), str(officer!._id));

	// And the device is persisted and owned, not just carried in the JWT: every
	// assertion above would pass on a session whose device the act never wrote.
	const deviceRow = await device.findOne({
		filters: { device_id: deviceId },
		projection: { _id: 1, is_active: 1, revoked_at: 1, "owner._id": 1 },
	}) as unknown as
		| { is_active?: boolean; revoked_at?: Date; owner?: Rel }
		| null;
	assertExists(deviceRow, "the login registered the device");
	assertEquals(deviceRow!.is_active, true);
	assertEquals(deviceRow!.revoked_at, undefined, "and did not revoke it");
	assertEquals(
		str(deviceRow!.owner?._id),
		str(officer!._id),
		"the device belongs to the officer who logged in",
	);

	// The negative control, same test, same account, same projection. Every
	// assertion above is satisfied by a `login` that never compared the password at
	// all — a stubbed act, a bypassed validator, a comparison that always returns
	// true. Only this one can tell that apart from a real credential check.
	//
	// The message is pinned to the generic credential error rather than left loose
	// on purpose: `loginUserFn` has three other rejections for this account (lockout
	// after five misses, wrong level for a device session, deactivated), and any of
	// them would make this control pass without the password ever being compared.
	await assertRejects(
		() =>
			runAct("user", "login", {
				set: { email: claimed, password: `Wrong@${RUN}` },
				get: { user: {} },
			}),
		Error,
		"ایمیل یا رمز عبور",
		"the same email with a wrong password is rejected",
	);
});

// ---------------------------------------------------------------------------

Deno.test("cleanup seed-demo-organization test database", async () => {
	await emptyDocuments();
});
