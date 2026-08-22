import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getRoadsGeometryFn } from "./getRoadsGeometry.fn.ts";
import { getRoadsGeometryValidator } from "./getRoadsGeometry.val.ts";

export const getRoadsGeometrySetup = () =>
	coreApp.acts.setAct({
		schema: "road",
		fn: getRoadsGeometryFn,
		actName: "getRoadsGeometry",
		preAct: [
			setTokens,
			setUser,
		],
		validator: getRoadsGeometryValidator(),
	});