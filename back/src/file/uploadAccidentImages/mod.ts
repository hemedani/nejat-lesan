import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { uploadAccidentImagesFn } from "./uploadAccidentImages.fn.ts";
import { uploadAccidentImagesValidator } from "./uploadAccidentImages.val.ts";

export const uploadAccidentImagesSetup = () =>
	coreApp.acts.setAct({
		schema: "file",
		fn: uploadAccidentImagesFn,
		actName: "uploadAccidentImages",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager", "Patrol"],
			}),
		],
		validator: uploadAccidentImagesValidator(),
		validationRunType: "create",
	});
