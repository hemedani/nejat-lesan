import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { reviewHistoryFn } from "./reviewHistory.fn.ts";
import { reviewHistoryValidator } from "./reviewHistory.val.ts";

export const reviewHistorySetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: reviewHistoryFn,
		actName: "getReportReviewHistory",
		preAct: [setTokens, setUser],
		validator: reviewHistoryValidator(),
	});
