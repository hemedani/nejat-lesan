import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getCreatedAtPeriodsFn } from "./getCreatedAtPeriods.fn.ts";
import { getCreatedAtPeriodsValidator } from "./getCreatedAtPeriods.val.ts";

export const getCreatedAtPeriodsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		actName: "getCreatedAtPeriods",
		fn: getCreatedAtPeriodsFn,
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager", "Enterprise"],
			}),
		],
		validator: getCreatedAtPeriodsValidator(),
	});
