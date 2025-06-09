import { date, defaulted } from "@deps";

export const createUpdateAt = {
	createdAt: defaulted(date(), () => new Date()),
	updatedAt: defaulted(date(), () => new Date()),
};
