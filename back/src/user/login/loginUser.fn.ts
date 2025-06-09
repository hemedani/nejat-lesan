import { type ActFn, jwt } from "@deps";
import { jwtTokenKey, throwError } from "@lib";
import { myRedis, user } from "../../../mod.ts";

export const loginUserFn: ActFn = async (body) => {
  const {
    set: { national_number, code },
    get,
  } = body.details;

  const createToken = async (user: any) => {
    const token = await jwt.create(
      { alg: "HS512", typ: "JWT" },
      {
        _id: user._id,
        national_number: user.national_number,
        mobile: user.mobile,
        exp: jwt.getNumericDate(60 * 60 * 24 * 30 * 3),
      },
      jwtTokenKey
    );
    return {
      token,
      user,
    };
  };

  const checkCode = async (user: any) => {
    const redisCode = await myRedis.get(user.national_number);

    return code.toString() === redisCode
      ? await createToken(user)
      : throwError("کد وارد شده صحیح نیست");
  };

  const foundedUser = await user.findOne({
    filters: { national_number },
    projection: get.user,
  });
  return foundedUser
    ? await checkCode(foundedUser)
    : throwError(" چنین کاربری پیدا نشد");
};
