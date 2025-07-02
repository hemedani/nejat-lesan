/**
 * -----------------------------------------------------------------------------
 * FILE: temporalNightAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "temporalNightAnalytics" act. This endpoint provides time-series
 * data for the "Temporal Comparison of Accidents at Night" chart.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { temporalNightAnalyticsFn } from "./temporalNightAnalytics.fn.ts";
import { temporalNightAnalyticsValidator } from "./temporalNightAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const temporalNightAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: temporalNightAnalyticsFn,
		actName: "temporalNightAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: temporalNightAnalyticsValidator(),
	});
