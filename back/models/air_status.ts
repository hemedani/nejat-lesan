import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const air_statuses = () =>
	coreApp.odm.newModel(
		"air_status",
		shared_relation_pure,
		createSharedRelations(),
	);
