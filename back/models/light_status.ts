import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const light_statuses = () =>
	coreApp.odm.newModel(
		"light_status",
		shared_relation_pure,
		createSharedRelations(),
	);
