import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getVehicleFn } from "./get.fn.ts";
import { getVehicleValidator } from "./get.val.ts";

export const getVehicleSetup = () =>
	coreApp.acts.setAct({
		schema: "vehicle",
		fn: getVehicleFn,
		actName: "get",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: getVehicleValidator(),
	});
