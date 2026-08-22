import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { revokeDeviceFn } from "./revokeDevice.fn.ts";
import { revokeDeviceValidator } from "./revokeDevice.val.ts";

export const revokeDeviceSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		fn: revokeDeviceFn,
		actName: "revokeDevice",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: revokeDeviceValidator(),
	});