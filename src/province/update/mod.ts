import { grantAccess, setTokens, setUser } from "@lib";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { coreApp } from "../../../mod.ts";

export const updateSetup = () =>
	coreApp.acts.setAct({
		schema: "province",
		fn: updateFn,
		actName: "update",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: updateValidator(),
	});
