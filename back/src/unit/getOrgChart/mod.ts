import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getOrgChartFn } from "./getOrgChart.fn.ts";
import { getOrgChartValidator } from "./getOrgChart.val.ts";

export const getOrgChartSetup = () =>
	coreApp.acts.setAct({
		schema: "unit",
		fn: getOrgChartFn,
		actName: "getOrgChart",
		preAct: [setTokens, setUser],
		validator: getOrgChartValidator(),
	});
