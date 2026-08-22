import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getUserDevicesFn } from "./getUserDevices.fn.ts";
import { getUserDevicesValidator } from "./getUserDevices.val.ts";

export const getUserDevicesSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		fn: getUserDevicesFn,
		actName: "getUserDevices",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: getUserDevicesValidator(),
	});