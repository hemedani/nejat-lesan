"use client";

import { loginAction } from "@/app/actions/login";
import React, { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

type TProps = {
  setStep: Dispatch<SetStateAction<number>>;
  phone: string;
  onCodeEntered: (token: string, level: string, nationalNumber: string) => void;
};

const LoginStepTwo = ({ setStep, phone, onCodeEntered }: TProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 5) {
      try {
        setLoading(true);
        const userLoggedIn = await loginAction({
          national_number: phone,
          code: otp,
        });

        if (userLoggedIn.success) {
          const { user, token } = userLoggedIn.body
          Cookies.set("user", JSON.stringify({
            ...user,
            level: user.level || "Normal",
          }))
          Cookies.set("national_number", user.national_number)
          Cookies.set("token", token)

          onCodeEntered(userLoggedIn.body.token, userLoggedIn.body.user.level, userLoggedIn.body.user.national_number);
          router.replace("/");
        } else {
          throw new Error(userLoggedIn.body)
        }

      } catch (error) {
        console.error("Login error:", error);
        setLoading(false);
        alert("خطا در ورود. لطفا دوباره تلاش کنید.");
      }
    } else {
      alert("کد وارد شده نامعتبر است. لطفا دوباره تلاش کنید.");
    }
  };

  return (
    <form onSubmit={handleOtpSubmit}>
      <div className="mb-4">
        <div className="flex items-center justify-between py-6">
          <p className="text-gray-500 text-sm text-right">
            کدورود ارسال شده است
          </p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-blue-500 hover:underline text-sm"
            disabled={loading}
          >
            ویرایش کد ملی
          </button>
        </div>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="کد 5 رقمی را وارد کنید"
          className="mt-1 text-black w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        className={`w-full ${loading ? "bg-green-300" : "bg-green-500 hover:bg-green-600"
          } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
        disabled={loading}
      >
        {loading ? "در حال پردازش..." : "تایید و وارد شوید"}
      </button>
    </form>
  );
};

export default LoginStepTwo;
