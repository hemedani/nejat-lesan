import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { seedSharedFn } from "./seedShared.fn.ts";
import { seedSharedValidator } from "./seedShared.val.ts";

export const seedSharedSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		fn: seedSharedFn,
		actName: "seedShared",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: seedSharedValidator(),
	});