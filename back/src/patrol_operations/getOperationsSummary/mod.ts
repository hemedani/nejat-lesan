import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getOperationsSummaryFn } from "./getOperationsSummary.fn.ts";
import { getOperationsSummaryValidator } from "./getOperationsSummary.val.ts";

export const getOperationsSummarySetup = () =>
	coreApp.acts.setAct({
		schema: "patrol_operations",
		fn: getOperationsSummaryFn,
		actName: "getOperationsSummary",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: getOperationsSummaryValidator(),
	});
