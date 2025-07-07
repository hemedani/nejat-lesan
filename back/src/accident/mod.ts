import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { countSetup } from "./count/mod.ts";
import { chartSetup } from "./charts/mod.ts";
import { mapSetup } from "./maps/mod.ts";

export const accidentSetup = () => {
	addSetup();
	updateSetup();
	getSetup();
	getsSetup();
	removeSetup();
	countSetup();

	//chart functions
	chartSetup();

	// map functions
	mapSetup();
};
