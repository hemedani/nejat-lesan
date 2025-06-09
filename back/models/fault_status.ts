import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const fault_statuses = () =>
	coreApp.odm.newModel(
		"fault_status",
		shared_relation_pure,
		createSharedRelations(),
	);
