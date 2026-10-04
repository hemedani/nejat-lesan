import { type ActFn, type ObjectId } from "@deps";
import { type MyContext } from "@lib";
import * as allModels from "../../../mod.ts";
import { coreApp, organization, unit, user } from "../../../mod.ts";
import {
	type Ensured,
	ensureDemoOrganization,
	ensureDemoRoad,
	fail,
	findDemoOrganization,
} from "./org.ts";
import {
	DEMO_ORG_HEAD,
	DEMO_PASSWORD,
	DEMO_UNITS,
	type DemoUnit,
	ensureDemoUnit,
	ensureDemoUser,
	ensureDemoVehicle,
	personEmail,
} from "./people.ts";
import { activateDemoForms } from "./forms.ts";

type RelationRow = { _id?: ObjectId };

type UnitState = {
	spec: DemoUnit;
	_id: ObjectId;
	officerIds: ObjectId[];
	vehicleIds: ObjectId[];
};

type VehicleState = {
	unitCode: string;
	_id: ObjectId;
	plaque_no: [string, string, string];
	title: string;
};

const str = (id: ObjectId) => id.toString();

/**
 * فقط شناسه‌های غایب را برمی‌گرداند.
 *
 * هرگز `replace: true` روی رابطه‌ی چندتایی نمی‌زنیم: یک اپراتور دمو ممکن
 * است مأمور یا خودرویی را دستی اضافه کرده باشد و جایگزینی آرایه آن را پاک
 * می‌کند. تکراری هم اضافه نمی‌شود چون Lesan با `$setUnion`/`$in` روی سند
 * کامل dedupe می‌کند — ولی فیلترِ صریح ارزان‌تر و خواناتر است.
 */
const missingIds = (
	current: RelationRow[] | undefined,
	ids: ObjectId[],
): ObjectId[] => {
	const present = new Set(
		(current ?? []).map((row) => row._id?.toString()).filter(
			Boolean,
		) as string[],
	);
	return ids.filter((id) => !present.has(id.toString()));
};

export const seedDemoOrganizationFn: ActFn = async () => {
	// `setUser` همین سند را در context گذاشته؛ دوباره از دیتابیس نمی‌خوانیم.
	const { user: actor }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const registrer = actor._id as ObjectId;

	let totalCreated = 0;
	let totalReused = 0;
	const track = <TRow>({ doc, created }: Ensured<TRow>): TRow => {
		if (created) totalCreated++;
		else totalReused++;
		return doc;
	};

	// --- ۱. راه -------------------------------------------------------------
	// سازمان دمو فقط *خوانده* می‌شود، نه ساخته: جست‌وجوی راه باید «نام + پیوندِ
	// سازمان» باشد تا راهِ هم‌نامِ یک سازمانِ دیگر را برنداریم.
	const orgLookup = await findDemoOrganization();
	const roadRow = track(
		await ensureDemoRoad({
			registrer,
			ownedByOrgId: orgLookup?._id ?? null,
		}),
	);

	// --- ۲. سازمان ----------------------------------------------------------
	const orgRow = track(
		await ensureDemoOrganization({
			roadId: roadRow._id,
			registrer,
		}),
	);

	// --- ۳. واحدها ----------------------------------------------------------
	const units: UnitState[] = [];
	for (const spec of DEMO_UNITS) {
		const row = track(
			await ensureDemoUnit({
				spec,
				organizationId: orgRow._id,
				roadId: roadRow._id,
				registrer,
			}),
		);
		units.push({
			spec,
			_id: row._id,
			officerIds: [],
			vehicleIds: [],
		});
	}

	// --- ۴. افراد ----------------------------------------------------------
	// چون `roles[].scopeId` به سازمان/واحد اشاره می‌کند و آن‌ها هم به فرد
	// برمی‌گردند، اول همه ساخته می‌شوند و بعد ارجاع‌های برگشتی وصل می‌شوند.
	const orgHeadRow = track(
		await ensureDemoUser({
			person: DEMO_ORG_HEAD,
			level: "OrgHead",
			roleName: "OrgHead",
			scopeType: "organization",
			scopeId: orgRow._id,
		}),
	);

	const personIds: ObjectId[] = [orgHeadRow._id];
	const unitHeads: Array<{ unit: UnitState; headId: ObjectId }> = [];

	for (const entry of units) {
		const headRow = track(
			await ensureDemoUser({
				person: entry.spec.head,
				level: "UnitHead",
				roleName: "UnitHead",
				scopeType: "unit",
				scopeId: entry._id,
			}),
		);
		unitHeads.push({ unit: entry, headId: headRow._id });
		personIds.push(headRow._id);

		for (const officer of entry.spec.officers) {
			const officerRow = track(
				await ensureDemoUser({
					person: officer,
					level: "Patrol",
					roleName: "Officer",
					scopeType: "unit",
					scopeId: entry._id,
				}),
			);
			entry.officerIds.push(officerRow._id);
			personIds.push(officerRow._id);
		}
	}

	// خودروها بعد از آدم‌ها ساخته می‌شوند: `unit.vehicles` باید وصل شود و
	// خودرو باید به همان واحدِ خودش تعلق داشته باشد.
	const vehicles: VehicleState[] = [];
	for (const entry of units) {
		for (const spec of entry.spec.vehicles) {
			const row = track(
				await ensureDemoVehicle({
					spec,
					unitCode: entry.spec.code,
					registrer,
				}),
			);
			entry.vehicleIds.push(row._id);
			vehicles.push({
				unitCode: entry.spec.code,
				_id: row._id,
				plaque_no: row.plaque_no,
				title: row.title,
			});
		}
	}

	// --- ۵. وصل‌کردن ارجاع‌های برگشتی ---------------------------------------
	const unitRows = await unit.find({
		filters: { _id: { $in: units.map((entry) => entry._id) } },
		projection: {
			_id: 1,
			"head._id": 1,
			"officers._id": 1,
			"vehicles._id": 1,
		},
	}).toArray() as unknown as Array<
		{
			_id: ObjectId;
			head?: RelationRow;
			officers?: RelationRow[];
			vehicles?: RelationRow[];
		}
	>;
	const unitState = new Map(unitRows.map((row) => [str(row._id), row]));

	for (const { unit: current, headId } of unitHeads) {
		const state = unitState.get(str(current._id));
		if (!state) {
			fail(`واحد «${current.spec.code}» یافت نشد؛ روابط آن وصل نشد.`);
		}

		if (state.head?._id?.toString() !== str(headId)) {
			await unit.addRelation({
				filters: { _id: current._id },
				relations: {
					head: {
						_ids: headId,
						relatedRelations: { headedUnits: true },
					},
				},
				// رابطه‌ی تکیِ پرشده بدون `replace` خطا می‌دهد.
				replace: true,
				projection: { _id: 1 },
			});
		}

		const newOfficers = missingIds(state.officers, current.officerIds);
		if (newOfficers.length) {
			await unit.addRelation({
				filters: { _id: current._id },
				relations: {
					officers: {
						_ids: newOfficers,
						relatedRelations: { unit: true },
					},
				},
				projection: { _id: 1 },
			});
		}

		const newVehicles = missingIds(state.vehicles, current.vehicleIds);
		if (newVehicles.length) {
			await unit.addRelation({
				filters: { _id: current._id },
				relations: {
					vehicles: {
						_ids: newVehicles,
						relatedRelations: { unit: true },
					},
				},
				projection: { _id: 1 },
			});
		}
	}

	// `user.organizations` پدربزرگِ `organization.members` است؛ عضویتِ واحد
	// جداگانه از راه `unit.officers` و `unit.head` پر می‌شود.
	const userRows = await user.find({
		filters: { _id: { $in: personIds } },
		projection: { _id: 1, "organizations._id": 1 },
	}).toArray() as unknown as Array<
		{ _id: ObjectId; organizations?: RelationRow[] }
	>;

	for (const row of userRows) {
		if (missingIds(row.organizations, [orgRow._id]).length) {
			await user.addRelation({
				filters: { _id: row._id },
				relations: {
					organizations: {
						_ids: [orgRow._id],
						relatedRelations: { members: true },
					},
				},
				projection: { _id: 1 },
			});
		}
	}

	const orgState = await organization.findOne({
		filters: { _id: orgRow._id },
		projection: { _id: 1, "head._id": 1 },
	}) as unknown as { _id: ObjectId; head?: RelationRow } | null;

	if (orgState?.head?._id?.toString() !== str(orgHeadRow._id)) {
		await organization.addRelation({
			filters: { _id: orgRow._id },
			relations: { head: { _ids: orgHeadRow._id } },
			replace: true,
			projection: { _id: 1 },
		});
	}

	// --- ۶. فرم‌ها ----------------------------------------------------------
	// آخر انجام می‌شود، چون هر دو پیش‌شرطِ آن (ماژول `forms` و مدل‌های مرجعِ
	// پرشده) باید پیش از ساختن حتی یک draft بررسی شوند؛ وگرنه سازمان نیمه‌کاره
	// می‌ماند و خطایی می‌آید که اپراتور باید رمزگشایی کند.
	const forms = await activateDemoForms({
		organizationId: orgRow._id,
		registrer,
		models: allModels,
	});

	// «قبلاً کامل seed شده» یعنی نه چیزی ساخته شد و نه فرمی فعال. فقط
	// `totalCreated` کافی نیست: فرم‌ها جدا شمرده می‌شوند، پس سازمانی که راه و
	// واحدهایش هست ولی فرم‌هایش نیست، `totalCreated === 0` می‌دهد در حالی که
	// کامل نیست — دقیقاً همان حالتِ نیمه‌کاره‌ای که این پاسخ باید آن را
	// «کامل نیست» بنامد تا caller بداند دوباره باید اجرا کند.
	const alreadySeeded = totalCreated === 0 &&
		forms.every((f) => !f.activated);

	return {
		demoPassword: DEMO_PASSWORD,
		alreadySeeded,
		organization: {
			_id: str(orgRow._id),
			code: orgRow.code,
			name: orgRow.name,
		},
		road: { _id: str(roadRow._id), name: roadRow.name },
		units: units.map((entry) => ({
			_id: str(entry._id),
			code: entry.spec.code,
			name: entry.spec.name,
			type: entry.spec.type,
		})),
		orgHead: {
			_id: str(orgHeadRow._id),
			email: orgHeadRow.email,
			level: "OrgHead",
		},
		unitHeads: unitHeads.map(({ unit: current, headId }) => ({
			_id: str(headId),
			email: personEmail(current.spec.head),
			unitCode: current.spec.code,
		})),
		officers: units.flatMap((entry) =>
			entry.spec.officers.map((officer, position) => ({
				_id: str(entry.officerIds[position]),
				email: personEmail(officer),
				unitCode: entry.spec.code,
			}))
		),
		vehicles: vehicles.map((entry) => ({
			_id: str(entry._id),
			plaque_no: entry.plaque_no,
			title: entry.title,
			unitCode: entry.unitCode,
		})),
		forms,
		totalCreated,
		totalReused,
	};
};
