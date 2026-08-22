import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeDeviceFn } from "./removeDevice.fn.ts";
import { removeDeviceValidator } from "./removeDevice.val.ts";

export const removeDeviceSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		actName: "removeDevice",
		fn: removeDeviceFn,
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: removeDeviceValidator(),
	});