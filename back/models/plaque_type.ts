import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const plaque_types = () =>
	coreApp.odm.newModel(
		"plaque_type",
		shared_relation_pure,
		createSharedRelations(),
	);
