import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../../mod.ts";
import { reviewReportsFn } from "./reviewReports.fn.ts";
import { reviewReportsValidator } from "./reviewReports.val.ts";

export const reviewReportsSetup = () =>
	coreApp.acts.setAct({
		schema: "incident_report",
		fn: reviewReportsFn,
		actName: "reviewReports",
		preAct: [setTokens, setUser],
		validator: reviewReportsValidator(),
	});
