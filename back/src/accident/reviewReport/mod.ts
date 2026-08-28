import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { reviewReportFn } from "./reviewReport.fn.ts";
import { reviewReportValidator } from "./reviewReport.val.ts";

export const reviewReportSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: reviewReportFn,
		actName: "reviewReport",
		preAct: [setTokens, setUser],
		validator: reviewReportValidator(),
	});
