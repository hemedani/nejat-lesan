import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { seedFn } from "./seed.fn.ts";
import { seedValidator } from "./seed.val.ts";

export const seedSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		fn: seedFn,
		actName: "seed",
		preValidation: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: seedValidator(),
	});
