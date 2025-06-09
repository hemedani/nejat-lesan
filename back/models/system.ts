import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const systems = () =>
	coreApp.odm.newModel(
		"system",
		shared_relation_pure,
		createSharedRelations(),
	);
