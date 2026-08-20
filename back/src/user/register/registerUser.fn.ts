import { type ActFn, hash } from "@deps";
import { user } from "../../../mod.ts";
import { throwError } from "@lib";

export const registerUserFn: ActFn = async (body) => {
	const {
		set: {
			first_name,
			last_name,
			father_name,
			mobile,
			gender,
			birth_date,
			email,
			password,
			national_number,
		},
		get,
	} = body.details;

	const foundedUserWithEmail = await user.findOne({
		filters: { email },
		projection: { _id: 1 },
	});

	if (foundedUserWithEmail) {
		return throwError("این ایمیل قبلا ثبت نام شده است");
	}

	if (national_number) {
		const foundedUserWithNationalNumber = await user.findOne({
			filters: { national_number },
			projection: { _id: 1 },
		});

		if (foundedUserWithNationalNumber) {
			return throwError("این شماره ملی قبلا ثبت نام شده است");
		}
	}

	const foundedUserWithMobileNumber = await user.findOne({
		filters: { mobile },
		projection: { _id: 1 },
	});

	if (foundedUserWithMobileNumber) {
		return throwError("این شماره موبایل قبلا ثبت نام شده است");
	}

	const registeredUser = await user.insertOne({
		doc: {
			first_name,
			last_name,
			father_name,
			mobile,
			gender,
			birth_date: birth_date ? new Date(birth_date as string) : undefined,
			email,
			password: await hash(password),
			national_number,
			address: "",
			level: "Editor",
			is_verified: false,
			settings: {
				cities: [],
				provinces: [],
				availableCharts: {},
			},
		},
		projection: get,
	});

	return registeredUser ? registeredUser : throwError("کاربر ایجاد نشد");
};
