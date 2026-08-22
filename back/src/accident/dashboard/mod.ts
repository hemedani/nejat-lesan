import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { dashboardValidator } from "./dashboard.val.ts";
import {
	getManagerDashboardFn,
	getManagerReportsFn,
	getReporterDashboardFn,
} from "./dashboard.fn.ts";

const register = (actName: string, fn: typeof getReporterDashboardFn) =>
	coreApp.acts.setAct({
		schema: "accident",
		fn,
		actName,
		preAct: [setTokens, setUser],
		validator: dashboardValidator(),
	});

export const dashboardSetup = () => {
	register("getReporterDashboard", getReporterDashboardFn);
	register("getManagerDashboard", getManagerDashboardFn);
	register("getManagerReports", getManagerReportsFn);
};
