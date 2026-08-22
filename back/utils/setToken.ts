import { jwt } from "@deps";
import { coreApp, device } from "../mod.ts";
import { throwError } from "./throwError.ts";

const secretKey = Deno.env.get("TOKEN_KEY") || "simpleSecretKey";
const encoder = new TextEncoder();
const keyBuf = encoder.encode(secretKey || "mySuperSecret");
export const jwtTokenKey = await crypto.subtle.importKey(
	"raw",
	keyBuf,
	{ name: "HMAC", hash: "SHA-512" },
	true,
	["sign", "verify"],
);

export const setTokens = async () => {
	const { Headers } = coreApp.contextFns.getContextModel();
	const token = Headers.get("token");

	const verifingToken = async () => {
		const verifyToke = await jwt.verify(token as string, jwtTokenKey);
		coreApp.contextFns.setContext({ user: verifyToke });

		// Mobile tokens carry a device_id; enforce device is still active
		// (revoked sessions are force-logged-out on the next request).
		const payload = verifyToke as { device_id?: string };
		if (payload.device_id) {
			const foundDevice = await device.findOne({
				filters: { device_id: payload.device_id },
				projection: { _id: 1, is_active: 1 },
			});
			if (!foundDevice || foundDevice.is_active !== true) {
				return throwError("نشست این دستگاه باطل شده است");
			}
		}
	};

	token ? await verifingToken() : throwError(
		"you should send your id with token key in req header",
	);
};
