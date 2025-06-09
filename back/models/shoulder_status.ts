import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const shoulder_statuses = () =>
	coreApp.odm.newModel(
		"shoulder_status",
		shared_relation_pure,
		createSharedRelations(),
	);
