import { jwt } from "@deps";
import { coreApp } from "../mod.ts";
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
	};

	token ? await verifingToken() : throwError(
		"you should send your id with token key in req header",
	);
};
