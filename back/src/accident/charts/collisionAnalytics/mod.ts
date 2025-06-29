/**
 * -----------------------------------------------------------------------------
 * FILE: collisionAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the new "collisionAnalytics" act. This endpoint provides all the
 * necessary aggregated data for the complex "Collision Type" dashboard, which
 * includes multiple doughnut and bar charts.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { collisionAnalyticsFn } from "./collisionAnalytics.fn.ts";
import { collisionAnalyticsValidator } from "./collisionAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const collisionAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: collisionAnalyticsFn,
		actName: "collisionAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: collisionAnalyticsValidator(),
	});
