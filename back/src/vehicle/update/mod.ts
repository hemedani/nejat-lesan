import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateVehicleFn } from "./update.fn.ts";
import { updateVehicleValidator } from "./update.val.ts";

export const updateVehicleSetup = () =>
	coreApp.acts.setAct({
		schema: "vehicle",
		fn: updateVehicleFn,
		actName: "update",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: updateVehicleValidator(),
	});
