import type { Infer } from "@deps";
import type { user_level_emums } from "@model";
import { throwError } from "./throwError.ts";
import type { MyContext } from "@lib";
import { coreApp } from "../mod.ts";

type UserLevels = Infer<typeof user_level_emums>;
export const grantAccess = (
	{ levels, isOwn }: {
		levels?: UserLevels[];
		isOwn?: boolean;
	},
) => {
	const checkAccess = () => {
		const { user }: MyContext = coreApp.contextFns
			.getContextModel() as MyContext;

		if (levels) {
			const levelIsInUser = levels.some((inLevel) => {
				return user.level === inLevel;
			});

			if (levelIsInUser || user.level === "Ghost") {
				coreApp.contextFns.setContext({ isInLevels: true });
				return;
			} else {
				coreApp.contextFns.setContext({ isInLevels: false });
				return throwError("You cant do this");
			}
		}

		if (isOwn) {
			return;
		} else {
			throwError("You cant do this");
		}
	};

	return checkAccess;
};
