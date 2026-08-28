import { type ActFn, compare, jwt, ObjectId } from "@deps";
import { jwtTokenKey, throwError } from "@lib";
import { device, user } from "../../../mod.ts";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const GENERIC_LOGIN_ERROR = "ایمیل یا رمز عبور صحیح نیست";

export const loginUserFn: ActFn = async (body) => {
	const {
		set: { email, password, device: devicePayload },
		get,
	} = body.details;

	const createToken = async (
		foundedUser: any,
		deviceId?: string,
	) => {
		const payload: Record<string, unknown> = {
			_id: foundedUser._id,
			email: foundedUser.email,
			level: foundedUser.level,
			exp: jwt.getNumericDate(60 * 60 * 24 * 30 * 3),
		};
		if (deviceId) {
			payload.device_id = deviceId;
		}
		return await jwt.create(
			{ alg: "HS512", typ: "JWT" },
			payload,
			jwtTokenKey,
		);
	};

	// --- Phase 1: internal credential check (fixed projection, never returned) ---
	const authUser = await user.findOne({
		filters: { email },
		projection: {
			_id: 1,
			email: 1,
			level: 1,
			password: 1,
			is_active: 1,
			patrol_permissions: 1,
			failed_login_attempts: 1,
			locked_until: 1,
		},
	});

	if (!authUser || !authUser.password) {
		return throwError(GENERIC_LOGIN_ERROR);
	}

	// --- Lockout check (before password verification) ---
	const now = new Date();
	if (authUser.locked_until && new Date(authUser.locked_until) > now) {
		const remainingMinutes = Math.ceil(
			(new Date(authUser.locked_until).getTime() - now.getTime()) / 60000,
		);
		return throwError(
			`به دلیل تلاش‌های ناموفق مکرر، حساب شما ${remainingMinutes} دقیقه دیگر قفل است`,
		);
	}

	const passIsCorrect = await compare(password, authUser.password);
	if (!passIsCorrect) {
		const attempts = (authUser.failed_login_attempts || 0) + 1;
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
				filter: { _id: new ObjectId(authUser._id) },
				update,
				projection: { _id: 1 },
			});
			return throwError(
				`به دلیل ${MAX_FAILED_ATTEMPTS} تلاش ناموفق، حساب شما به مدت ۵ دقیقه قفل شد`,
			);
		}
		await user.findOneAndUpdate({
			filter: { _id: new ObjectId(authUser._id) },
			update,
			projection: { _id: 1 },
		});
		return throwError(GENERIC_LOGIN_ERROR);
	}

	// --- Success → reset the failed-login counter ---
	await user.findOneAndUpdate({
		filter: { _id: new ObjectId(authUser._id) },
		update: {
			$set: {
				failed_login_attempts: 0,
				updatedAt: new Date(),
			},
			$unset: { locked_until: "" },
		},
		projection: { _id: 1 },
	});

	if (authUser.is_active === false) {
		return throwError("حساب کاربری غیرفعال است");
	}

	// --- Device-scoped session (patrol app) ---
	if (devicePayload) {
		if (authUser.level !== "Patrol" && authUser.level !== "Ghost") {
			return throwError(
				"این حساب اجازه استفاده از اپ مأمور گشت را ندارد",
			);
		}

		const {
			device_id,
			fingerprint,
			platform,
			app_version,
			model,
			push_token,
		} = devicePayload;

		const existingDevice = await device.findOne({
			filters: { device_id },
			projection: { _id: 1, is_active: 1 },
		});

		let deviceId: string | undefined;
		if (existingDevice) {
			const updateSet: Record<string, any> = {
				is_active: true,
				last_seen_at: new Date(),
				platform,
				app_version,
				model,
				fingerprint,
				updatedAt: new Date(),
			};
			// Only overwrite the token when the client actually sent one,
			// so tokens survive logins from code paths that omit it.
			if (push_token) updateSet.push_token = push_token;
			await device.findOneAndUpdate({
				filter: { _id: new ObjectId(existingDevice._id) },
				update: {
					$set: updateSet,
					$unset: { revoked_at: "" },
				},
				projection: { _id: 1 },
			});
			// Refresh the owner link so the reverse `user.devices` array stays
			// accurate (covers devices registered before relation embedding).
			await device.addRelation({
				filters: { device_id },
				relations: {
					owner: {
						_ids: authUser._id,
						relatedRelations: { devices: true },
					},
				},
				replace: true,
				projection: { _id: 1 },
			});
			deviceId = existingDevice._id as unknown as string;
		} else {
			// Lesan insertOne does not apply `defaulted` defaults — set explicitly.
			// relatedRelations.devices: true embeds the new device id into the
			// owner's reverse `user.devices` array (opt-in per Lesan semantics).
			const addedDevice = await device.insertOne({
				doc: {
					device_id,
					fingerprint,
					platform,
					app_version,
					model,
					push_token,
					is_active: true,
					last_seen_at: new Date(),
					registered_at: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				relations: {
					owner: {
						_ids: authUser._id,
						relatedRelations: { devices: true },
					},
				},
				projection: { _id: 1 },
			});
			if (!addedDevice) {
				return throwError("ثبت دستگاه با مشکل مواجه شد");
			}
			deviceId = addedDevice._id as unknown as string;
		}

		const token = await createToken(authUser, device_id);

		return {
			token,
			user: await clientProjectedUser(email, get),
			permissions: authUser.patrol_permissions || {},
		};
	}

	// --- Plain session (web) ---
	const token = await createToken(authUser);

	return {
		token,
		user: await clientProjectedUser(email, get),
	};
};

// Fetch the user again using the caller's requested projection, so internal
// auth fields (password hash, lockout counters) never leak into responses.
// Reverse relations such as `user.devices` are embedded inside the user
// document by Lesan, so a plain findOne returns them with the projection.
async function clientProjectedUser(
	email: string,
	get?: { user?: Record<string, any> },
): Promise<Record<string, any> | null> {
	const clientGet = get?.user || {};
	clientGet.email = 1;
	clientGet.level = 1;
	return await user.findOne({ filters: { email }, projection: clientGet });
}
