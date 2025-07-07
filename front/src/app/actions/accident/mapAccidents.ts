"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const mapAccidents = async (details: ReqType["main"]["accident"]["mapAccidents"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "mapAccidents",
      details,
    },
    { token: token?.value }
  );
};




