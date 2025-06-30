/**
 * -----------------------------------------------------------------------------
 * FILE: areaUsageAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "areaUsageAnalytics" act. This endpoint provides data for
 * the "Share of Accidents by Land Use" doughnut chart.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { areaUsageAnalyticsFn } from "./areaUsageAnalytics.fn.ts";
import { areaUsageAnalyticsValidator } from "./areaUsageAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const areaUsageAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: areaUsageAnalyticsFn,
		actName: "areaUsageAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: areaUsageAnalyticsValidator(),
	});
