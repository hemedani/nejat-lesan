/**
 * -----------------------------------------------------------------------------
 * FILE: temporalTotalReasonAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "temporalTotalReasonAnalytics" act. This endpoint provides
 * time-series data for the top 10 ultimate causes of accidents.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { temporalTotalReasonAnalyticsFn } from "./temporalTotalReasonAnalytics.fn.ts";
import { temporalTotalReasonAnalyticsValidator } from "./temporalTotalReasonAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const temporalTotalReasonAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: temporalTotalReasonAnalyticsFn,
		actName: "temporalTotalReasonAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: temporalTotalReasonAnalyticsValidator(),
	});
