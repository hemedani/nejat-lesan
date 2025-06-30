/**
 * -----------------------------------------------------------------------------
 * FILE: companyPerformanceAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "companyPerformanceAnalytics" act. This endpoint provides all
 * the complex aggregated data needed for the bubble chart comparing car manufacturers.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { companyPerformanceAnalyticsFn } from "./companyPerformanceAnalytics.fn.ts";
import { companyPerformanceAnalyticsValidator } from "./companyPerformanceAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const companyPerformanceAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: companyPerformanceAnalyticsFn,
		actName: "companyPerformanceAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: companyPerformanceAnalyticsValidator(),
	});
