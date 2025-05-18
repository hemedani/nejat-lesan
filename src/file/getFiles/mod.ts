import { coreApp } from "../../../mod.ts";
import { setTokens, setUser } from "@lib";
import { getFilesFn } from "./getFiles.fn.ts";
import { getFilesValidator } from "./getFiles.val.ts";

export const getFilesSetup = () =>
	coreApp.acts.setAct({
		schema: "file",
		fn: getFilesFn,
		actName: "getFiles",
		preAct: [
			setTokens,
			setUser,
		],
		validator: getFilesValidator(),
	});
