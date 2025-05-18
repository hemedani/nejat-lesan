import { ObjectId } from "@deps";
import { coreApp, user } from "../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "./throwError.ts";

export const setUser = async () => {
	const { user: { _id } }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const userPureProjection = coreApp.schemas.createProjection("user", "Pure");

	const foundedUser = await user.findOne({
		filters: { _id: new ObjectId(_id) },
		projection: userPureProjection,
	});

	!foundedUser && throwError("user not exist");

	coreApp.contextFns.setContext({ user: foundedUser });
};
