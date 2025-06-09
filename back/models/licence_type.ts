import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const licence_types = () =>
	coreApp.odm.newModel(
		"licence_type",
		shared_relation_pure,
		createSharedRelations(),
	);
