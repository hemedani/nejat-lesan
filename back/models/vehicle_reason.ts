import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const vehicle_reasons = () =>
	coreApp.odm.newModel(
		"vehicle_reason",
		shared_relation_pure,
		createSharedRelations(),
	);
