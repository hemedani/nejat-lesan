import { coreApp } from "../../../mod.ts";
import { setTokens, setUser } from "@lib";
import { uploadFileFn } from "./uploadFile.fn.ts";
import { uploadFileValidator } from "./uploadFile.val.ts";

export const uploadFileSetup = () =>
	coreApp.acts.setAct({
		schema: "file",
		actName: "uploadFile",
		validationRunType: "create",
		validator: uploadFileValidator(),
		preAct: [
			setTokens,
			setUser,
		],
		fn: uploadFileFn,
	});
