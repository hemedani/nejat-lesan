import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const plaque_usages = () =>
	coreApp.odm.newModel(
		"plaque_usage",
		shared_relation_pure,
		createSharedRelations(),
	);
