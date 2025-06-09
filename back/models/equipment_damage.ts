import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const equipment_damages = () =>
	coreApp.odm.newModel(
		"equipment_damage",
		shared_relation_pure,
		createSharedRelations(),
	);
