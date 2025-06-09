import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const road_situations = () =>
	coreApp.odm.newModel(
		"road_situation",
		shared_relation_pure,
		createSharedRelations(),
	);
