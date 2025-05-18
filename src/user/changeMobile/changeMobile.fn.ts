import type { ActFn, Document, WithId } from "@deps";
import { throwError } from "@lib";
import { myRedis, user } from "../../../mod.ts";
import { generatingLoginRequestCode } from "../loginReq/loginReqUser.fn.ts";

const checkNationalNumber = async (mobile: string, national_number: string) => {
  // TODO check SHAHKAR Api
  return true;
};

export const changeMobileFn: ActFn = async (body) => {
  const {
    set: { national_number, mobile },
    get,
  } = body.details;

  const foundedUserWithNewMobileNumber = await user.findOne({
    filters: { mobile },
  });

  if (foundedUserWithNewMobileNumber?.national_number === national_number) {
    throwError(
      "شماره ملی کاربر دقیقا همین شماره ملی است و نیازی به تغییر شماره موبایل نیست"
    );
  }

  if (foundedUserWithNewMobileNumber) {
    throwError("این شماره در سامانه موجود میباشد و متعلق به کاربر دیگری است");
  }

  const checkNewMobileBelognsToNationalNumber = await checkNationalNumber(
    mobile,
    national_number
  );

  if (!checkNewMobileBelognsToNationalNumber) {
    throwError("این شماره موبایل متعلق به این شماره ملی نیست");
  }

  const generatedCode =
    Deno.env.get("ENV") === "development"
      ? "11111"
      : await generatingLoginRequestCode();

  const returnUser = async (user: WithId<Document>) => {
    await myRedis.set(user.national_number, generatedCode, { ex: 100 });
    const mobile = user.mobile as string;
    user.mobile = `${mobile.slice(0, 3)}****${mobile.slice(-3)}`;
    return user;
  };

  const foundedUser = await user.findOneAndUpdate({
    filter: { national_number },
    update: {
      $set: {
        mobile,
        updatedAt: new Date(),
      },
    },
    projection: { _id: 0, mobile: 1, national_number: 1 },
  });

  return foundedUser
    ? await returnUser(foundedUser as WithId<Document>)
    : throwError("با این شماره ملی هیچ کاربری پیدا نشد");
};
