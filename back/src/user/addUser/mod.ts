import type { Infer } from "@deps";
import {
	grantAccess,
	type MyContext,
	setTokens,
	setUser,
	throwError,
} from "@lib";
import { coreApp } from "../../../mod.ts";
import { addUserFn } from "./addUser.fn.ts";
import { addUserValidator } from "./addUser.val.ts";
import { user_level_emums } from "@model";

export const checkGhostUser = () => {
	const { user, body }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	if (user.level === "Ghost") {
		return;
	}

	const insertedLevels = body?.details.set.levels as Infer<
		typeof user_level_emums
	>;

	if (insertedLevels === undefined || insertedLevels === null) {
		return;
	}

	if (insertedLevels !== "Ghost") {
		return;
	}

	throwError("Sorry can not add this level");
};

export const addUserSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		actName: "addUser",
		validationRunType: "create",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
			checkGhostUser,
		],
		validator: addUserValidator(),
		fn: addUserFn,
	});
