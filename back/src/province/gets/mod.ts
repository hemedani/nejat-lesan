import { createProvinceGetsAuthMiddleware, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";

export const getsSetup = () =>
	coreApp.acts.setAct({
		schema: "province",
		fn: getsFn,
		actName: "gets",
		preValidation: [
			setTokens,
			setUser,
			createProvinceGetsAuthMiddleware(),
		],
		validator: getsValidator(),
	});
