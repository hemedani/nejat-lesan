import { type ActFn, compare, jwt, ObjectId } from "@deps";
import { jwtTokenKey, throwError } from "@lib";
import { device, user } from "../../../mod.ts";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export const mobileLoginFn: ActFn = async (body) => {
	const {
		set: { personnel_code, password, device: devicePayload },
		get,
	} = body.details;

	const createToken = async (user: any, deviceId: string) => {
		const token = await jwt.create(
			{ alg: "HS512", typ: "JWT" },
			{
				_id: user._id,
				personnel_code: user.personnel_code,
				level: user.level,
				device_id: deviceId,
				exp: jwt.getNumericDate(60 * 60 * 24 * 30 * 3),
			},
			jwtTokenKey,
		);
		return token;
	};

	get.user = get.user || {};
	get.user.personnel_code = 1;
	get.user.password = 1;
	get.user.level = 1;
	get.user.is_active = 1;
	get.user.patrol_permissions = 1;
	get.user.failed_login_attempts = 1;
	get.user.locked_until = 1;

	const foundedUser = await user.findOne({
		filters: { personnel_code },
		projection: get.user,
	});

	if (!foundedUser || !foundedUser.password) {
		return throwError("کد پرسنلی یا رمز عبور صحیح نیست");
	}

	// --- Lockout check (before password verification) ---
	const now = new Date();
	if (foundedUser.locked_until && new Date(foundedUser.locked_until) > now) {
		const remainingMinutes = Math.ceil(
			(new Date(foundedUser.locked_until).getTime() - now.getTime()) /
				60000,
		);
		return throwError(
			`به دلیل تلاش‌های ناموفق مکرر، حساب شما ${remainingMinutes} دقیقه دیگر قفل است`,
		);
	}

	const passIsCorrect = await compare(password, foundedUser.password);
	if (!passIsCorrect) {
		const attempts = (foundedUser.failed_login_attempts || 0) + 1;
		const update: Record<string, any> = {
			$set: {
				failed_login_attempts: attempts,
				updatedAt: new Date(),
			},
		};
		if (attempts >= MAX_FAILED_ATTEMPTS) {
			update.$set.locked_until = new Date(now.getTime() + LOCKOUT_MS);
			update.$set.failed_login_attempts = 0;
			await user.findOneAndUpdate({
				filter: { _id: new ObjectId(foundedUser._id) },
				update,
				projection: { _id: 1 },
			});
			return throwError(
				`به دلیل ${MAX_FAILED_ATTEMPTS} تلاش ناموفق، حساب شما به مدت ۵ دقیقه قفل شد`,
			);
		}
		await user.findOneAndUpdate({
			filter: { _id: new ObjectId(foundedUser._id) },
			update,
			projection: { _id: 1 },
		});
		return throwError("کد پرسنلی یا رمز عبور صحیح نیست");
	}

	// --- Success → reset the failed-login counter ---
	await user.findOneAndUpdate({
		filter: { _id: new ObjectId(foundedUser._id) },
		update: {
			$set: {
				failed_login_attempts: 0,
				updatedAt: new Date(),
			},
			$unset: { locked_until: "" },
		},
		projection: { _id: 1 },
	});

	if (foundedUser.is_active === false) {
		return throwError("حساب کاربری غیرفعال است");
	}

	if (foundedUser.level !== "Patrol") {
		return throwError("این حساب اجازه استفاده از اپ مأمور گشت را ندارد");
	}

	delete foundedUser.password;

	// --- Register / reactivate the device ---
	const { device_id, fingerprint, platform, app_version, model } =
		devicePayload;

	const existingDevice = await device.findOne({
		filters: { device_id },
		projection: { _id: 1, is_active: 1 },
	});

	let deviceId: string;
	if (existingDevice) {
		await device.findOneAndUpdate({
			filter: { _id: new ObjectId(existingDevice._id) },
			update: {
				$set: {
					is_active: true,
					last_seen_at: new Date(),
					platform,
					app_version,
					model,
					fingerprint,
					updatedAt: new Date(),
				},
				$unset: { revoked_at: "" },
			},
			projection: { _id: 1 },
		});
		deviceId = existingDevice._id as unknown as string;
	} else {
		const addedDevice = await device.insertOne({
			doc: {
				device_id,
				fingerprint,
				platform,
				app_version,
				model,
				is_active: true,
				last_seen_at: new Date(),
				registered_at: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			relations: { owner: { _ids: foundedUser._id } },
			projection: { _id: 1 },
		});
		if (!addedDevice) {
			return throwError("ثبت دستگاه با مشکل مواجه شد");
		}
		deviceId = addedDevice._id as unknown as string;
	}

	const token = await createToken(foundedUser, device_id);

	// --- Officer devices for the response ---
	const devicesList = await device
		.find({
			filters: {
				"owner._id": new ObjectId(foundedUser._id),
				is_active: true,
			},
			projection: get.devices || {
				_id: 1,
				device_id: 1,
				platform: 1,
				app_version: 1,
				model: 1,
				last_seen_at: 1,
				is_active: 1,
			},
		})
		.toArray();

	return {
		token,
		user: foundedUser,
		permissions: foundedUser.patrol_permissions || {},
		devices: devicesList,
	};
};