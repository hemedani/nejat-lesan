import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const ruling_types = () =>
	coreApp.odm.newModel(
		"ruling_type",
		shared_relation_pure,
		createSharedRelations(),
	);
