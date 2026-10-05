import { RelationDataType, optional, string } from "@deps";
import { createUpdateAt } from "../../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

export const shared_relation_pure = {
	name: string(),

	/**
	 * Provenance stamp for rows written by `user.seedShared`.
	 *
	 * `user.cleanupDemoSeed` deletes a reference row only when it carries this
	 * marker, because the seed *skips* a name that already exists — so a row
	 * sharing a seeded name is unstampable and must survive. Without the marker
	 * on the seed side the cleanup would find nothing to own and could never
	 * undo the seed. Optional: every pre-existing or operator-entered row has no
	 * marker, which is exactly what makes it safe.
	 */
	seed: optional(string()),

	...createUpdateAt,
};

export const share_relation_excludes = ["createdAt", "updatedAt"];

export const createSharedRelations = () => ({
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
});
