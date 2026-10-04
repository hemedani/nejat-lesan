import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import {
	getManagerDashboardFn,
	getManagerReportsFn,
	getReporterDashboardFn,
} from "./dashboard.fn.ts";
import { dashboardValidator } from "./dashboard.val.ts";

export const incidentReportDashboardSetup = () => {
	coreApp.acts.setAct({
		schema: "incident_report",
		fn: getReporterDashboardFn,
		actName: "getReporterDashboard",
		preAct: [setTokens, setUser],
		validator: dashboardValidator(),
	});
	coreApp.acts.setAct({
		schema: "incident_report",
		fn: getManagerDashboardFn,
		actName: "getManagerDashboard",
		preAct: [setTokens, setUser],
		validator: dashboardValidator(),
	});
	coreApp.acts.setAct({
		schema: "incident_report",
		fn: getManagerReportsFn,
		actName: "getManagerReports",
		preAct: [setTokens, setUser],
		validator: dashboardValidator(),
	});
};
