/**
 * -----------------------------------------------------------------------------
 * FILE: temporalUnlicensedDriversAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "temporalUnlicensedDriversAnalytics" act. This endpoint provides
 * time-series data for the "Temporal Comparison of Unlicensed Drivers" chart.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { temporalUnlicensedDriversAnalyticsFn } from "./temporalUnlicensedDriversAnalytics.fn.ts";
import { temporalUnlicensedDriversAnalyticsValidator } from "./temporalUnlicensedDriversAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const temporalUnlicensedDriversAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: temporalUnlicensedDriversAnalyticsFn,
		actName: "temporalUnlicensedDriversAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("temporalUnlicensedDriversAnalytics"),
		],
		validator: temporalUnlicensedDriversAnalyticsValidator(),
	});
