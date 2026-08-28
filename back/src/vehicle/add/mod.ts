import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { addVehicleFn } from "./add.fn.ts";
import { addVehicleValidator } from "./add.val.ts";

export const addVehicleSetup = () =>
	coreApp.acts.setAct({
		schema: "vehicle",
		fn: addVehicleFn,
		actName: "add",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: addVehicleValidator(),
		validationRunType: "create",
	});
