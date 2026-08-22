import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const vehicle_final_statuses = () =>
	coreApp.odm.newModel(
		"vehicle_final_status",
		shared_relation_pure,
		createSharedRelations(),
	);