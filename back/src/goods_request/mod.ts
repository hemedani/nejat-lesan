import { addSetup } from "./add/mod.ts";
import { approveSetup } from "./approve/mod.ts";
import { issueSetup } from "./issue/mod.ts";
import { receiveSetup } from "./receive/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { countSetup } from "./count/mod.ts";

export const goodsRequestSetup = () => {
	addSetup();
	approveSetup();
	issueSetup();
	receiveSetup();
	getsSetup();
	countSetup();
};
