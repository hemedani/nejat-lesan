import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getUnreadCountFn } from "./getUnreadCount.fn.ts";
import { getUnreadCountValidator } from "./getUnreadCount.val.ts";

export const getUnreadCountSetup = () =>
	coreApp.acts.setAct({
		schema: "announcement",
		fn: getUnreadCountFn,
		actName: "getUnreadCount",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Patrol"],
			}),
		],
		validator: getUnreadCountValidator(),
	});
