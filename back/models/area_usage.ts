import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const area_usages = () =>
	coreApp.odm.newModel(
		"area_usage",
		shared_relation_pure,
		createSharedRelations(),
	);
