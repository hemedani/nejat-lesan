import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { countSetup } from "./count/mod.ts";

export const citySetup = () => {
	addSetup();
	updateSetup();
	getSetup();
	getsSetup();
	removeSetup();
	countSetup();
};
