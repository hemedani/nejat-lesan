"use server";

import { AppApi } from "@/services/api";
import type { UserData } from "@/types/auth";

export interface LoginResponseBody {
  token: string;
  user: UserData;
  modules: string[];
  orgModules: string[];
}

export interface LoginResponse {
  success: boolean;
  body: LoginResponseBody | { message?: string };
}

export const loginAction = async ({ email, password }: { email: string; password: string }): Promise<LoginResponse> => {
  const response = await AppApi().send({
    service: "main",
    model: "user",
    act: "login",
    details: {
      set: {
        email,
        password,
      },
      get: {
        token: 1,
        user: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          mobile: 1,
          email: 1,
          national_number: 1,
          level: 1,
          roles: 1,
          settings: 1,
          organizations: {
            _id: 1,
            code: 1,
            name: 1,
            enName: 1,
            is_active: 1,
          },
          units: {
            _id: 1,
            code: 1,
            name: 1,
            type: 1,
            is_active: 1,
          },
        },
      },
    },
  });
  return response as unknown as LoginResponse;
};
