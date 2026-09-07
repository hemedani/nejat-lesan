import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { updateRelationsSetup } from "./updateRelations/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { countSetup } from "./count/mod.ts";
import { getOrgChartSetup } from "./getOrgChart/mod.ts";

export const unitSetup = () => {
	addSetup();
	updateSetup();
	updateRelationsSetup();
	getSetup();
	getsSetup();
	removeSetup();
	countSetup();
	getOrgChartSetup();
};
