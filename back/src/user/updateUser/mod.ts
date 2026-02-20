import type { Infer } from "@deps";
import {
	grantAccess,
	type MyContext,
	setTokens,
	setUser,
	throwError,
} from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateUserFn } from "./updateUser.fn.ts";
import { updateUserValidator } from "./updateUser.val.ts";
import { user_level_emums } from "@model";

export const checkGhostUserUpdate = () => {
	const { user, body }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	if (user.level === "Manager") {
		return;
	}

	const insertedLevels = body?.details.set.level as Infer<
		typeof user_level_emums
	>;

	if (insertedLevels === undefined || insertedLevels === null) {
		return;
	}

	if (insertedLevels !== "Ghost") {
		return;
	}

	throwError("Sorry can not update to Ghost level");
};

export const updateUserSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		actName: "updateUser",
		validationRunType: "create",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
			checkGhostUserUpdate,
		],
		validator: updateUserValidator(),
		fn: updateUserFn,
	});
