import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const injury_statuses = () =>
	coreApp.odm.newModel(
		"injury_status",
		shared_relation_pure,
		createSharedRelations(),
	);