import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const system_types = () =>
	coreApp.odm.newModel(
		"system_type",
		shared_relation_pure,
		createSharedRelations(),
	);
