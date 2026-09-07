import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { countSetup } from "./count/mod.ts";
import { activateSetup } from "./activate/mod.ts";
import { duplicateSetup } from "./duplicate/mod.ts";
import { getForPatrolSetup } from "./getForPatrol/mod.ts";
import { getQuestionModelsSetup } from "./getQuestionModels/mod.ts";

export const accidentProcessSetup = () => {
	addSetup();
	updateSetup();
	getSetup();
	getsSetup();
	removeSetup();
	countSetup();
	activateSetup();
	duplicateSetup();
	getForPatrolSetup();
	getQuestionModelsSetup();
};
