"use client";
import LoginStepOne from "@/components/organisms/login/LoginStepOne";
import LoginStepTwo from "@/components/organisms/login/LoginStepTwo";
import { useAutoReturnTimer } from "@/hook/useAutoReturnTimer";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const Login = ({ }) => {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState(1);
  const { login } = useAuth();

  const { clearAutoReturnTimer, remainingTime } = useAutoReturnTimer(
    step,
    setStep
  );

  const handleCodeEntered = (
    token: string,
    level: string,
    nationalNumber: string
  ) => {
    clearAutoReturnTimer();

    // Convert level to our UserLevel type
    const userLevel = level as "Ghost" | "Manager" | "Editor" | "Normal" | null;

    // Call login from auth context
    login(token, userLevel, nationalNumber);
  };

  return (
    <div className="w-full min-h-[calc(100vh-9rem)] p-6 bg-gray-300">
      <div className="h-[calc(100vh-9rem)] bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-700">
            {step === 1
              ? "کد ملی خود را وارد کنید"
              : "کد ارسال شده را وارد کنید"}
          </h1>
          {step === 1 ? (
            <LoginStepOne setStep={setStep} setPhone={setPhone} phone={phone} />
          ) : (
            <LoginStepTwo
              setStep={setStep}
              phone={phone}
              onCodeEntered={handleCodeEntered}
            />
          )}
          {step === 2 ? (
            <div className="text-center mt-4 text-gray-500">
              <p>
                زمان باقی‌مانده:
                <span className="text-red-300">{remainingTime}</span> ثانیه
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;
