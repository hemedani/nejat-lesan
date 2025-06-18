import { useCallback, useEffect, useRef, useState } from "react";

type UseAutoReturnTimer = (step: number, setStep: React.Dispatch<React.SetStateAction<number>>) => {
  clearAutoReturnTimer: () => void;
  remainingTime: number;
};

export const useAutoReturnTimer: UseAutoReturnTimer = (step, setStep) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(60);

  const clearAutoReturnTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step === 2) {
      // Only start timer if we don't already have one running
      if (!timerRef.current) {
        const countdown = setInterval(() => {
          setRemainingTime((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(countdown);
              timerRef.current = null;
              setStep(1);
              return 60; // Reset to 60 when going back to step 1
            }
            return prevTime - 1;
          });
        }, 1000);
        timerRef.current = countdown;
      }
    } else if (step === 1) {
      // Clear timer and reset remaining time when going to step 1
      clearAutoReturnTimer();
      setRemainingTime(60);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [step, setStep, clearAutoReturnTimer]);

  return { clearAutoReturnTimer, remainingTime };
};
