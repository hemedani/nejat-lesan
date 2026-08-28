import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeVehicleFn } from "./remove.fn.ts";
import { removeVehicleValidator } from "./remove.val.ts";

export const removeVehicleSetup = () =>
	coreApp.acts.setAct({
		schema: "vehicle",
		fn: removeVehicleFn,
		actName: "remove",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: removeVehicleValidator(),
	});
