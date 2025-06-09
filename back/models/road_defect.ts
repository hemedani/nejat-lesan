import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const road_defects = () =>
	coreApp.odm.newModel(
		"road_defect",
		shared_relation_pure,
		createSharedRelations(),
	);
