import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { resubmitReportFn } from "./resubmitReport.fn.ts";
import { resubmitReportValidator } from "./resubmitReport.val.ts";

export const resubmitReportSetup = () =>
	coreApp.acts.setAct({
		schema: "incident_report",
		fn: resubmitReportFn,
		actName: "resubmitReport",
		preAct: [setTokens, setUser],
		validator: resubmitReportValidator(),
	});
