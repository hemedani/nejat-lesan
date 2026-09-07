import type { Infer } from "@deps";
import { grantAccess, setTokens, setUser, throwError } from "@lib";
import { coreApp } from "../../../mod.ts";
import { addUserFn } from "./addUser.fn.ts";
import { addUserValidator } from "./addUser.val.ts";
import { user_level_emums } from "@model";

/** جلوگیری از ساخته‌شدن کاربر سطح Ghost توسط غیرگوست‌ها. */
export const checkGhostUser = () => {
	const { user }: { user: { level?: string } } = coreApp.contextFns
		.getContextModel() as never;

	if (user.level === "Ghost") {
		return;
	}

	const insertedLevels = (coreApp.contextFns.getContextModel() as {
		body?: {
			details?: { set?: { level?: Infer<typeof user_level_emums> } };
		};
	}).body?.details?.set?.level as Infer<typeof user_level_emums> | undefined;

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
				levels: ["Manager", "OrgHead", "UnitHead"],
			}),
		],
		validator: addUserValidator(),
		fn: addUserFn,
	});
