import { roadDefectsAnalyticsSetup } from "./roadDefectsAnalytics/mod.ts";
import { roadDefectsAnalyticsWithCountSetup } from "./roadDefectsAnalyticsFnWithCount/mod.ts";

export const chartSetup = () => {
	roadDefectsAnalyticsSetup();
	roadDefectsAnalyticsWithCountSetup();
};
