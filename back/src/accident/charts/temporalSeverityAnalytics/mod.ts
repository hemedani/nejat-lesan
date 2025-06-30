/**
 * -----------------------------------------------------------------------------
 * FILE: temporalSeverityAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "temporalSeverityAnalytics" act. This endpoint provides time-series
 * data for the "Temporal Comparison of the Share of Fatal Accidents from Severe Accidents" chart.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { temporalSeverityAnalyticsFn } from "./temporalSeverityAnalytics.fn.ts";
import { temporalSeverityAnalyticsValidator } from "./temporalSeverityAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const temporalSeverityAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: temporalSeverityAnalyticsFn,
		actName: "temporalSeverityAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: temporalSeverityAnalyticsValidator(),
	});
