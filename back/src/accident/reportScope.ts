import { ObjectId } from "@deps";
import type { MyContext } from "@lib";

/**
 * Returns the server-enforced report scope. Manager assignments are not yet
 * represented by a relation, so managers currently receive patrol reports;
 * the scope can be narrowed here when that organizational relation exists.
 */
export const getReportScope = (
	actor: MyContext["user"],
	userId?: string,
): Record<string, unknown> => {
	if (actor.level === "Patrol") {
		return { "officer._id": new ObjectId(actor._id) };
	}

	if (actor.level === "Manager" || actor.level === "Ghost") {
		const scope: Record<string, unknown> = { "officer.level": "Patrol" };
		if (userId) scope["officer._id"] = new ObjectId(userId);
		return scope;
	}

	throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
};
