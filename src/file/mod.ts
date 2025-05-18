import { getFilesSetup } from "./getFiles/mod.ts";
import { uploadFileSetup } from "./uploadFile/mod.ts";

export const fileSetup = () => {
	getFilesSetup(), uploadFileSetup();
};
