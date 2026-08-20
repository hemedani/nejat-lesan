import { coreApp } from "../../../mod.ts";
import { setGhostPasswordFn } from "./setGhostPassword.fn.ts";
import { setGhostPasswordValidator } from "./setGhostPassword.val.ts";

export const setGhostPasswordSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		actName: "setGhostPassword",
		fn: setGhostPasswordFn,
		validator: setGhostPasswordValidator(),
	});
