import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { countSetup } from "./count/mod.ts";
import { snapPointToRoadSetup } from "./snapPointToRoad/mod.ts";
import { validatePointInZoneSetup } from "./validatePointInZone/mod.ts";
import { getRoadsGeometrySetup } from "./getRoadsGeometry/mod.ts";

export const roadSetup = () => {
	addSetup();
	updateSetup();
	getSetup();
	getsSetup();
	removeSetup();
	countSetup();
	snapPointToRoadSetup();
	validatePointInZoneSetup();
	getRoadsGeometrySetup();
};
