import { RelationDataType, string } from "@deps";
import { createUpdateAt } from "../../utils/createUpdateAt.ts";

export const shared_relation_pure = {
	name: string(),

	...createUpdateAt,
};

export const createSharedRelations = () => ({
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
});
