import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const motion_directions = () =>
	coreApp.odm.newModel(
		"motion_direction",
		shared_relation_pure,
		createSharedRelations(),
	);
