import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { updateRelationsSetup } from "./updateRelations/mod.ts";

export const patrolUnitSetup = () => {
	addSetup();
	updateSetup();
	updateRelationsSetup();
	getSetup();
	getsSetup();
	removeSetup();
};