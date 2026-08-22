import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const vehicle_types = () =>
	coreApp.odm.newModel(
		"vehicle_type",
		shared_relation_pure,
		createSharedRelations(),
	);