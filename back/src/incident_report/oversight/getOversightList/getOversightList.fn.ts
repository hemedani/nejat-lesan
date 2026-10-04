import { type ActFn } from "@deps";
import { coreApp } from "../../../../mod.ts";
import { type MyContext } from "@lib";
import { resolveOversightScope } from "../filters.ts";
import { buildOversightPipeline } from "../pipeline.ts";

/**
 * One list of everything an organization filed from the patrol app: accidents and
 * non-accident reports together.
 *
 * Runs through the **raw** collection driver on purpose. Lesan's `aggregation()`
 * appends `$lookup`/`$unwind`/`$project` stages derived from the client's `get`,
 * which cannot follow a `$unionWith` branch into a second collection and would
 * corrupt the `$facet` at the end of the pipeline.
 */
export const getOversightListFn: ActFn = async (body) => {
	const set = (body.details.set ?? {}) as Record<string, unknown>;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// Floored as well as clamped: `number()` lets a client send `page: 2.5`, and a
	// fractional `$skip` is a server error rather than a page.
	const page = Math.max(1, Math.floor(Number(set.page ?? 1)));
	const limit = Math.min(
		200,
		Math.max(1, Math.floor(Number(set.limit ?? 25))),
	);

	const scope = await resolveOversightScope(
		user as never,
		typeof set.organizationId === "string" ? set.organizationId : undefined,
	);

	const pipeline = buildOversightPipeline({
		scope,
		filters: {
			page,
			limit,
			dateFrom: set.dateFrom as string | undefined,
			dateTo: set.dateTo as string | undefined,
			groupKeys: set.groupKeys as string[] | undefined,
			syncStatus: set.syncStatus as string[] | undefined,
			reviewStatus: set.reviewStatus as string[] | undefined,
			officerIds: set.officerIds as string[] | undefined,
			appVersions: set.appVersions as string[] | undefined,
			unlinkedOnly: set.unlinkedOnly as boolean | undefined,
			search: set.search as string | undefined,
		},
	});

	const [result] = await coreApp.odm.getCollection("incident_report")
		.aggregate(pipeline)
		.toArray();

	const facet = (result ?? { rows: [], total: [] }) as {
		rows?: Array<Record<string, unknown>>;
		total?: Array<{ n: number }>;
	};

	return {
		rows: facet.rows ?? [],
		total: facet.total?.[0]?.n ?? 0,
	};
};
