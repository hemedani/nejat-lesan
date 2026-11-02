import { type ActFn, type Document, ObjectId } from "@deps";
import { accident, incident_report } from "../../../mod.ts";
import {
	findCityZoneForPoint,
	type PointGeometry,
} from "../../shared/cityZoneLookup.ts";

const BATCH_SIZE = 50;
const DEFAULT_LIMIT = 5000;

type BackfillModel = "accident" | "incident_report";

type Cursor = {
	sort: (spec: Document) => Cursor;
	limit: (count: number) => Cursor;
	toArray: () => Promise<Document[]>;
};

type Repository = {
	find: (args: { filters: Document; projection: Document }) => Cursor;
	addRelation: (args: Record<string, unknown>) => Promise<unknown>;
};

// Resolved lazily: `mod.ts` finishes wiring the models after this module is
// evaluated, so reading them at module scope hits the temporal dead zone.
const modelFor = (target: BackfillModel): {
	repository: Repository;
	reverse: string;
} => target === "accident"
	? {
		repository: accident as unknown as Repository,
		reverse: "accidents",
	}
	: {
		repository: incident_report as unknown as Repository,
		reverse: "incident_reports",
	};

type Summary = {
	scanned: number;
	matched: number;
	linked: number;
	unmatched: number;
	errors: number;
	dryRun: boolean;
};

/**
 * Link documents that were created before city-zone resolution existed (or
 * before a zone's geometry was imported) to the zone that contains them.
 *
 * New documents are linked at write time by `accident.add`, `incident_report.add`
 * and `user.seed`. This act only fills gaps, never creates zone documents and
 * never overwrites an existing link — so it is safe to run repeatedly. It pages
 * over candidates by `_id` instead of loading the whole collection.
 */
export const backfillCityZonesFn: ActFn = async (body) => {
	const { set } = body.details;
	const requested = (set.model as BackfillModel | undefined) ?? "both";
	const cityId = set.cityId ? new ObjectId(set.cityId as string) : null;
	const limit = (set.limit as number | undefined) ?? DEFAULT_LIMIT;
	const dryRun = Boolean(set.dryRun);

	const startedAt = Date.now();
	const summary: Summary = {
		scanned: 0,
		matched: 0,
		linked: 0,
		unmatched: 0,
		errors: 0,
		dryRun,
	};

	const targets: BackfillModel[] = requested === "both"
		? ["accident", "incident_report"]
		: [requested];

	for (const target of targets) {
		const { repository, reverse } = modelFor(target);
		let lastId: ObjectId | undefined;
		let processed = 0;

		while (processed < limit) {
			const pageSize = Math.min(BATCH_SIZE, limit - processed);
			const filters: Document = {
				city_zone: { $exists: false },
			};
			if (cityId) filters["city._id"] = cityId;
			if (lastId) filters._id = { $gt: lastId };

			const page = await repository.find({
				filters,
				projection: { _id: 1, location: 1, "city._id": 1 },
			}).sort({ _id: 1 }).limit(pageSize).toArray();

			if (page.length === 0) break;

			lastId = page[page.length - 1]._id as ObjectId;
			processed += page.length;
			summary.scanned += page.length;

			for (let i = 0; i < page.length; i += BATCH_SIZE) {
				const chunk = page.slice(i, i + BATCH_SIZE);

				await Promise.all(chunk.map(async (doc) => {
					const location = doc.location as PointGeometry | undefined;
					const docCity =
						(doc.city as { _id?: ObjectId } | undefined)?._id ??
							null;
					const zoneId = await findCityZoneForPoint(
						location,
						cityId ?? docCity,
					);

					if (!zoneId) {
						summary.unmatched++;
						return;
					}

					summary.matched++;
					if (dryRun) return;

					try {
						await repository.addRelation({
							filters: { _id: doc._id },
							relations: {
								city_zone: {
									_ids: zoneId,
									relatedRelations: { [reverse]: true },
								},
							},
						});
						summary.linked++;
					} catch (error) {
						summary.errors++;
						console.error(
							`Failed to link ${target} ${doc._id} to city zone ${zoneId}:`,
							(error as Error).message,
						);
					}
				}));
			}

			if (page.length < pageSize) break;
		}
	}

	const durationMs = Date.now() - startedAt;

	console.log(
		`City-zone backfill: scanned ${summary.scanned}, matched ${summary.matched}, linked ${summary.linked}, unmatched ${summary.unmatched}, errors ${summary.errors}, ${durationMs}ms`,
	);

	return {
		summary: {
			...summary,
			durationMs,
		},
	};
};
