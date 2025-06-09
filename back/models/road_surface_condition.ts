import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const road_surface_conditions = () =>
	coreApp.odm.newModel(
		"road_surface_condition",
		shared_relation_pure,
		createSharedRelations(),
	);
