import type { ActFn, Document, WithId } from "@deps";
import { throwError } from "@lib";
import { myRedis, user } from "../../../mod.ts";

const sendSms = async (code: string) => {};

export const generatingLoginRequestCode = async () => {
	const generatedCode = (Math.floor(Math.random() * 90000) + 10000)
		.toString();
	await sendSms(generatedCode);
	return generatedCode;
};

export const loginReqUserFn: ActFn = async (body) => {
	const {
		set: { national_number },
		get,
	} = body.details;

	// const generatedCode = Deno.env.get("ENV") === "development"
	// 	? "11111"
	// 	: await generatingLoginRequestCode();

	const generatedCode = "11111";

	const returnUser = async (user: WithId<Document>) => {
		await myRedis.set(user.national_number, generatedCode, { ex: 100 });
		const mobile = user.mobile as string;
		user.mobile = `${mobile.slice(0, 3)}****${mobile.slice(-3)}`;
		return user;
	};

	const foundedUser = await user.findOne({
		filters: { national_number: String(national_number) },
		projection: { _id: 0, mobile: 1, national_number: 1 },
	});

	return foundedUser
		? await returnUser(foundedUser)
		: throwError("با این شماره ملی هیچ کاربری پیدا نشد");
};
