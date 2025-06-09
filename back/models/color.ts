import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const colors = () =>
	coreApp.odm.newModel(
		"color",
		shared_relation_pure,
		createSharedRelations(),
	);
