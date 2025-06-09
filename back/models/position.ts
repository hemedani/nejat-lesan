import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const positions = () =>
	coreApp.odm.newModel(
		"position",
		shared_relation_pure,
		createSharedRelations(),
	);
