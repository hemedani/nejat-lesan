import { type ActFn } from "@deps";
import { getModuleConfigRows } from "../moduleConfig.ts";

export const getModulesFn: ActFn = async () => {
	const modules = await getModuleConfigRows();
	return { modules };
};
