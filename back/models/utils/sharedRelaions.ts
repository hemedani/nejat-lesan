import { RelationDataType, string } from "@deps";
import { createUpdateAt } from "../../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

export const shared_relation_pure = {
	name: string(),

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
