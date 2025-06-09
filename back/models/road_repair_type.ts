import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const road_repair_types = () =>
	coreApp.odm.newModel(
		"road_repair_type",
		shared_relation_pure,
		createSharedRelations(),
	);
