import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const person_roles = () =>
	coreApp.odm.newModel(
		"person_role",
		shared_relation_pure,
		createSharedRelations(),
	);