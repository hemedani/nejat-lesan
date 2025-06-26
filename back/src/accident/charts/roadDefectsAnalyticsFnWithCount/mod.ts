/**
 * -----------------------------------------------------------------------------
 * FILE: roadDefectsAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This file registers the new "roadDefectsAnalytics" act with the core application.
 * This act is specifically designed to provide aggregated data for the
 * "Effective Road Defects" chart on the dashboard.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { roadDefectsAnalyticsFnWithCount } from "./roadDefectsAnalyticsFnWithCount.fn.ts";
import { roadDefectsAnalyticsWithCountValidator } from "./roadDefectsAnalyticsFnWithCount.val.ts";
import { coreApp } from "../../../../mod.ts";

export const roadDefectsAnalyticsWithCountSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: roadDefectsAnalyticsFnWithCount,
		actName: "roadDefectsAnalyticsWithCount", // New, specific act name
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"], // Access control remains the same
			}),
		],
		validator: roadDefectsAnalyticsWithCountValidator(),
	});
