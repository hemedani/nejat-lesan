import { type ActFn, compare, jwt } from "@deps";
import { jwtTokenKey, throwError } from "@lib";
import { user } from "../../../mod.ts";

export const loginUserFn: ActFn = async (body) => {
	const {
		set: { email, password },
		get,
	} = body.details;

	const createToken = async (user: any) => {
		const token = await jwt.create(
			{ alg: "HS512", typ: "JWT" },
			{
				_id: user._id,
				email: user.email,
				mobile: user.mobile,
				level: user.level,
				exp: jwt.getNumericDate(60 * 60 * 24 * 30 * 3),
			},
			jwtTokenKey,
		);
		return {
			token,
			user,
		};
	};

	get.user.email = 1;
	get.user.password = 1;
	get.user.mobile = 1;
	get.user.level = 1;

	const foundedUser = await user.findOne({
		filters: { email },
		projection: get.user,
	});

	if (!foundedUser) {
		return throwError("چنین کاربری پیدا نشد");
	}

	if (!foundedUser.password) {
		return throwError("رمز عبور برای این کاربر تنظیم نشده است");
	}

	const passIsCorrect = await compare(password, foundedUser.password);

	if (passIsCorrect) {
		delete foundedUser.password;
		return await createToken(foundedUser);
	} else {
		return throwError("رمز عبور وارد شده صحیح نیست");
	}
};
