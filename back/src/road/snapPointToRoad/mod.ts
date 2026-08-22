import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { snapPointToRoadFn } from "./snapPointToRoad.fn.ts";
import { snapPointToRoadValidator } from "./snapPointToRoad.val.ts";

export const snapPointToRoadSetup = () =>
	coreApp.acts.setAct({
		schema: "road",
		fn: snapPointToRoadFn,
		actName: "snapPointToRoad",
		preAct: [
			setTokens,
			setUser,
		],
		validator: snapPointToRoadValidator(),
	});