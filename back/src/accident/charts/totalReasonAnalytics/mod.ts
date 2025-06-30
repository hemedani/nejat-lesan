/**
 * -----------------------------------------------------------------------------
 * FILE: totalReasonAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "totalReasonAnalytics" act. This endpoint provides data for
 * the "Distribution of Ultimate Cause in Severe Accidents" treemap chart.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { totalReasonAnalyticsFn } from "./totalReasonAnalytics.fn.ts";
import { totalReasonAnalyticsValidator } from "./totalReasonAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const totalReasonAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: totalReasonAnalyticsFn,
		actName: "totalReasonAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: totalReasonAnalyticsValidator(),
	});
