import type { ActFn, Document, WithId } from "@deps";
import { myRedis, user } from "../../../mod.ts";
import { throwError } from "@lib";
import { generatingLoginRequestCode } from "../loginReq/loginReqUser.fn.ts";

export const registerUserFn: ActFn = async (body) => {
	const {
		set: { mobile, national_number },
		get,
	} = body.details;

	const foundedUserWithNationalNumber = await user.findOne({
		filters: { national_number },
	});

	if (foundedUserWithNationalNumber) {
		return throwError("این شماره ملی قبلا ثبت نام شده است");
	}

	const foundedUserWithMobileNumber = await user.findOne({
		filters: { mobile },
	});

	if (foundedUserWithMobileNumber) {
		return throwError("این شماره موبایل قبلا ثبت نام شده است");
	}

	const generatedCode = Deno.env.get("ENV") === "development"
		? "11111"
		: await generatingLoginRequestCode();

	const returnUser = async (user: WithId<Document>) => {
		await myRedis.set(user.national_number, generatedCode, { ex: 100 });
		const mobile = user.mobile as string;
		user.mobile = `${mobile.slice(0, 3)}****${mobile.slice(-3)}`;
		return user;
	};

	const registeredUser = await user.insertOne({
		doc: {
			mobile,
			national_number,
			is_verified: false,
			level: "Driver",
		},
		projection: get,
	});

	return registeredUser
		? await returnUser(registeredUser)
		: throwError("کاربر ایجاد نشد");
};
