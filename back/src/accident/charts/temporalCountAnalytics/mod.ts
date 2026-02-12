/**
 * -----------------------------------------------------------------------------
 * FILE: temporalCountAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "temporalCountAnalytics" act. This endpoint provides time-series
 * data for the "Temporal Comparison of Accident Counts" chart.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { temporalCountAnalyticsFn } from "./temporalCountAnalytics.fn.ts";
import { temporalCountAnalyticsValidator } from "./temporalCountAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const temporalCountAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: temporalCountAnalyticsFn,
		actName: "temporalCountAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("temporalCountAnalytics"),
		],
		validator: temporalCountAnalyticsValidator(),
	});
