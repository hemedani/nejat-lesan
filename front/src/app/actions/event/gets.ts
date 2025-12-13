"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const gets = async (details: ReqType["main"]["event"]["gets"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "event",
      act: "gets",
      details,
    },
    { token: token?.value },
  );
};
