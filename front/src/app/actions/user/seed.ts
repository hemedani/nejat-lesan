"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const seed = async (
  details: ReqType["main"]["user"]["seed"],
) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "seed",
      details,
    },
    { token: token?.value },
  );
};

