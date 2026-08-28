import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getMyReportsFn } from "./getMyReports.fn.ts";
import { getMyReportsValidator } from "./getMyReports.val.ts";

export const getMyReportsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: getMyReportsFn,
		actName: "getMyReports",
		preAct: [
			setTokens,
			setUser,
		],
		validator: getMyReportsValidator(),
	});
