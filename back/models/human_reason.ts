import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const human_reasons = () =>
	coreApp.odm.newModel(
		"human_reason",
		shared_relation_pure,
		createSharedRelations(),
	);
