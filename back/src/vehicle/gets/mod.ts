import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getVehiclesFn } from "./gets.fn.ts";
import { getVehiclesValidator } from "./gets.val.ts";

export const getVehiclesSetup = () =>
	coreApp.acts.setAct({
		schema: "vehicle",
		fn: getVehiclesFn,
		actName: "gets",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: getVehiclesValidator(),
	});
