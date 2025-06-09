import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const types = () =>
	coreApp.odm.newModel(
		"type",
		shared_relation_pure,
		createSharedRelations(),
	);
