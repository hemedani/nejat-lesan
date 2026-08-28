import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const damage_severities = () =>
	coreApp.odm.newModel(
		"damage_severity",
		shared_relation_pure,
		createSharedRelations(),
	);
