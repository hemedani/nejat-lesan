import { getFilesSetup } from "./getFiles/mod.ts";
import { uploadFileSetup } from "./uploadFile/mod.ts";
import { uploadAccidentImagesSetup } from "./uploadAccidentImages/mod.ts";

export const fileSetup = () => {
	getFilesSetup();
	uploadFileSetup();
	uploadAccidentImagesSetup();
};
