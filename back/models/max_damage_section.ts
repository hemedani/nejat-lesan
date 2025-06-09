import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const max_damage_sections = () =>
	coreApp.odm.newModel(
		"max_damage_section",
		shared_relation_pure,
		createSharedRelations(),
	);
