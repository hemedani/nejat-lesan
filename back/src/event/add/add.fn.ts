import type { ActFn } from "@deps";
import { event } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
	const { name, description, dates } = body.details.set;
	const get = body.details.get;

	const eventData = {
		name,
		description,
		dates,
	};

	return await event.insertOne({
		doc: eventData,
		projection: get,
	});
};
